import Logger, { LogLevel } from './utils/logger';
import { debounce } from './utils/common';
const logger = new Logger({
    logLevel: LogLevel.DEBUG,
    debugPrefix: 'decorators'
});

import 'reflect-metadata';
import * as  ComponentManager from './component-manager';
import { EventBus } from './event-bus';

import { TraceLogType } from './@types/trace-log';

import StackTrace from 'stacktrace-js'

/**
 * hidden property for component unique id
 */
const uniqueIdSymbol = Symbol("uniqueId");
/**
 * hidden property for component subscription
 */
const subscriptionSymbol = Symbol("subscriptions");

const renderMetadataKey = Symbol("renderer");
const onConnectedMethodMetadataKey = Symbol("onConnectedMethodMetadataKey");
const onDisconnectedMethodMetadataKey = Symbol("onDisconnectedMethodMetadataKey");
const componentMetadataKey = Symbol("componentMetadata");

interface ISubscriptions {
    [key: string]: Function;
}

interface IdwcClassMetadata {
    name: string;
    description?: string;
}
/**
 * Extend  a component and makes it discoverable to other component
 * @param dwcClassMetadata  
 */
export function discoverableWebComponent(dwcClassMetadata: IdwcClassMetadata) {
    return function <T extends { new(...args: any[]): {} }>(target: T) {

        addOnConnectedHook(target);
        addOnDisconnectedHook(target);

        //TODO: handle property change event specific to property not on entire component instance level
        target.prototype.setBindedProperty = function (this: any, sourceInstance: any, binderInfo: IBinderMetadata): Boolean {
            let context = this;
            if (!sourceInstance) {
                if (context[binderInfo.targetPropertyName]) {
                    context[binderInfo.targetPropertyName] = null;
                    return true;
                }

            } else if (Reflect.has(sourceInstance, binderInfo.sourceComponentPropertyName)) {
                let propertyValue = Reflect.get(sourceInstance, binderInfo.sourceComponentPropertyName);
                if (propertyValue != context[binderInfo.targetPropertyName]) {
                    if (typeof propertyValue != 'object') {
                        context[binderInfo.targetPropertyName] = propertyValue;
                    } else {
                        context[binderInfo.targetPropertyName] = Array.isArray(propertyValue) ? [...propertyValue] : { ...propertyValue }; //assign copy of it                       
                    }
                    //subscribe to that instance property change
                    let instancePropertyChangeEventName = ComponentManager.getPropertyChangeEventName(sourceInstance[uniqueIdSymbol]);
                    if (!context[subscriptionSymbol][instancePropertyChangeEventName]) {
                        ComponentManager.subscribePropertyChange(sourceInstance[uniqueIdSymbol], context.populatePropertyBinding);
                        context[subscriptionSymbol][instancePropertyChangeEventName] = context.populatePropertyBinding; //keep track of subscription to clean it when component is unloaded

                    }

                    return true;
                }
            }
            return false;
        }

        target.prototype.populatePropertyBinding = function (this: any) {

            let context = this;

            //Check if there is any property to bind first 
            let propertyExternalBinders: Array<IBinderMetadata> = Reflect.getMetadata(binderInfoMetaKey, context);

            if (!propertyExternalBinders || propertyExternalBinders.length == 0) {
                return;
            }

            let isBindedPropertyChanged: Boolean = false;

            //currently available components
            let componentRegistory = ComponentManager.getComponentRegistory();

            //first identify all the binder specific to a component instance for run time binding
            let instanceSpecificBinders: Array<IBinderMetadata> = propertyExternalBinders.filter((b) => b.instanceIdentifier);

            instanceSpecificBinders.forEach((b) => {
                let instanceIdentifier: string = b.instanceIdentifier!;
                let compInstance = componentRegistory[instanceIdentifier]?.instance;
                isBindedPropertyChanged = isBindedPropertyChanged || context.setBindedProperty(compInstance, b);
            });

            //Now for static/design time binding, identify first instance in the registory and bind the property to that instance
            let staticBinders: Array<IBinderMetadata> = propertyExternalBinders.filter((b) => !b.instanceIdentifier);
            console.log('static binders', staticBinders);
            staticBinders.forEach((b) => {
                let matchingComponentInstanceKey = Object.keys(componentRegistory).find((k) => {
                    return componentRegistory[k].classMetadata.name == b.sourceComponentName;
                });
                let compInstance = !matchingComponentInstanceKey ? null : componentRegistory[matchingComponentInstanceKey!].instance;
                isBindedPropertyChanged = isBindedPropertyChanged || context.setBindedProperty(compInstance, b);

            });

            if (isBindedPropertyChanged) {
                //call renderer 
                callRenderer(context);
            }
        }

        const validateRequiredSetup = (instance) => {
            if(ComponentManager.checkIfComponentIntanceExists(dwcClassMetadata.name)){
                logger.error(`Duplicate instance of discoverable component named ${dwcClassMetadata.name} is not allowed`);
                throw new Error(`Only single instance of ${dwcClassMetadata.name} is allowed`)
            }

            //throw error is decorator is applied to a class which is not inherited from webcomponent
            if (!(instance instanceof HTMLElement)) {
                logger.debug(`Discover component decorator can only be applied to a component which is derived from HTMLElement (webcomponent)`);
                throw new Error(`Discover component decorator can only be applied to a component which is derived from HTMLElement (webcomponent)`)
           }
        }

        //extend the class and override its constructor  check here all the valid methods and required for this component
        return class extends target {
            [subscriptionSymbol]: ISubscriptions;
            constructor(...args: any[]) {
                super(args);

                validateRequiredSetup(this);

                //Add unique identifier for the discoverable component to keep track in component registory
                this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);
                this[componentMetadataKey] = { type: target, ...dwcClassMetadata };
                this[subscriptionSymbol] = {};
                this["populatePropertyBinding"] = debounce(this["populatePropertyBinding"].bind(this));
            }
        }
    }
}


/**
 * Call component render method
 *
 * @param {*} context
 */
function callRenderer(context: any) {
    let renderMethodName = Reflect.getMetadata(renderMetadataKey, context);
    if (renderMethodName) {
        let renderer = <Function>Reflect.get(context, renderMethodName);
        renderer.apply(context);
    }
}


/**
 *Check if given decorator is not applied to a valid methods
 *
 * @param {*} target
 * @param {string} key
 * @param {PropertyDescriptor} descriptor
 */
function assertInvalidMethod(target: any, key: string, descriptor: PropertyDescriptor) {
    if (!descriptor || typeof (descriptor.value) != "function") {
        throw new Error(`${key} is not a valid method of class ${target.constructor.name}`);
    }
}

/**
 * This method enhances the webcomponent connectedCallback method   
 * Use this function from discoverableWebComponent to registor the component call necessary methods for property binding
 *
 * @param {*} classDescriptor
 */
function addOnConnectedHook(classDescriptor){
    let originalConnectedCallback: PropertyDescriptor|undefined;
    originalConnectedCallback = Reflect.getOwnPropertyDescriptor(classDescriptor.prototype,'connectedCallback');

    //update the connected callback method of the component
    classDescriptor.prototype.connectedCallback = function(this:any){

        //Set html element unique id so that it can be used as DOM element selector by tools such as dev-tools
        this.setAttribute('dwc-id', this[uniqueIdSymbol]);

        //if component has bind property to any other discoverable component property then set the binding and populate the property here
        this.populatePropertyBinding();

         //if a class has external binder then subscribe the component registory change and run the propertys
        const componentRegistoryChangeEventHandler = () => {

            this.populatePropertyBinding();
        }
        if (Reflect.getMetadata(binderInfoMetaKey, classDescriptor.prototype)) {
            let topic = ComponentManager.subscribeComponentRegistoryUpdate(componentRegistoryChangeEventHandler);
            //add to subscription list so that it can be cleaned up later
            this[subscriptionSymbol][topic] = componentRegistoryChangeEventHandler;
        }

        //get the class metadata info
        let componentMetadata = <IdwcClassMetadata>this[componentMetadataKey];

        ComponentManager.registerComponent({
            identifier: this[uniqueIdSymbol],
            instance: this,
            classMetadata: componentMetadata
        });

        //execute user defined callback logic
        originalConnectedCallback?.value.apply(this);
    }
}

/**
 * This method enhances the webcomponent disconnectedCallback method   
 * Use this function from discoverableWebComponent to perform cleanup (e.g. deregistor from registory, clear up property binding) when component is removed from DOM
 *
 * @param {*} classDescriptor
 */
function addOnDisconnectedHook(classDescriptor){
    let originalDisconnectedCallback:PropertyDescriptor | undefined;
    originalDisconnectedCallback=Reflect.getOwnPropertyDescriptor(classDescriptor.prototype,'disconnectedCallback');

    classDescriptor.prototype.disconnectedCallback =function(this:any){
        //Remove all the subscriptions for this component
        let subscriptions = (<ISubscriptions>this[subscriptionSymbol]);
        Object.keys(subscriptions).forEach(topic => {
            //Assumption: All subscriptions are handled via event-bus
            EventBus.unsubscribe(topic, subscriptions[topic]);
        })
        ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);
        //execute the user implementation
        originalDisconnectedCallback?.value.apply(this);
    }

}

interface IdwcApiMetadata {
    description: string
}

/**
 * Expose a method of a discoverable component to be used/invoked by other component
 *
 * @param {IdwcApiMetadata} dwcApiMetadata
 * @returns
 */
function discoverableMethod(dwcApiMetadata: IdwcApiMetadata) {
    return function (target: any, key: string, descriptor: PropertyDescriptor): void {
        assertInvalidMethod(target, key, descriptor);

        let originalMethod = descriptor.value;
        descriptor.value = function (this: any, ...args: any[]) {
            let result = originalMethod.apply(this, args);
            return result;
        }
        ComponentManager.registerMethod(target, key, dwcApiMetadata);

    }
}

/**
 *Expose a property as API, so that other component can use/bind this property
 *
 * @param {IdwcApiMetadata} dwcApiMetadata
 * @returns
 */
function discoverableProperty(dwcApiMetadata?: IdwcApiMetadata) {
    return function (target: any, key: string, descriptor?: PropertyDescriptor | undefined): void {
        if (typeof (descriptor?.value) == "function") {
            throw new Error(`${key} is not a valid property of class ${target.constructor.name}`);
        }
        //If descriptor is null then the property is just a member veriable, 
        //hence property needs to be redefined both getter and setter needs to be created
        if (!descriptor) {
            const propPrivateKey = Symbol(key);
            const getter = function (this: any) {
                return this[propPrivateKey];
            };
            const setter = function (this: any, val: any) {
                if (this[propPrivateKey] != val) {
                    this[propPrivateKey] = val;
                }
            };

            Object.defineProperty(target, key, {
                get: getter,
                set: setter
            });
        } else {
            //property accessor
            if (descriptor.set) {
                let originalSetter = descriptor.set;
                descriptor.set = function (this: any, val) {
                    originalSetter.call(this, val);
                }
                Object.defineProperty(target, key, descriptor);
            }
        }

        ComponentManager.registerProperty(target, key, dwcApiMetadata);
    }
}

/**
 * Exposes various Discoverable methods
 */
export const Discover = {
    Component: discoverableWebComponent,
    Method: discoverableMethod,
    Field: discoverableProperty
}


/**
 * Indicate render function, this is used to drive the reactivity when component updates
 *
 * @export
 * @param {*} target
 * @param {string} key
 * @param {PropertyDescriptor} descriptor
 */
export function Renderer(target: any, key: string, descriptor: PropertyDescriptor) {

    let rendererMetadata: Object = Reflect.getMetadata(renderMetadataKey, target);
    if (rendererMetadata) {
        throw new Error(`Duplicate Renderer ${target.constructor.name}`);
    }
    //Just log render method name
    Reflect.defineMetadata(renderMetadataKey, key, target);
}

interface IExternalComponentPropertyBinder {
    sourceComponentName: string;
    sourceComponentPropertyName: string;
    instanceIdentifier?: string; //Optional TODO: should be used later 
}

interface IBinderMetadata extends IExternalComponentPropertyBinder {
    targetPropertyName: string;
}

const binderInfoMetaKey = Symbol("binderInfo");
/**
 * Bind property of a component to external component, property will be updated when component is discovered and related property changes at source  
 * Use this decorator to bind component property on design time, this will bind the first instance of the source component property
 * @export
 * @param {IExternalComponentPropertyBinder} binderInfo
 * @returns
 */
export function Bind(binderInfo: IExternalComponentPropertyBinder) {
    return function (target: any, key: string): void {
        //now keep this information which property is binded to other component 
        //so that when that component property changes then this component should be updated
        let externalPropertyBinders: IBinderMetadata[] = Reflect.getMetadata(binderInfoMetaKey, target);
        let binderDetail: IBinderMetadata = {
            targetPropertyName: key,
            ...binderInfo
        };
        if (externalPropertyBinders) {
            externalPropertyBinders.push(binderDetail);
        } else {
            externalPropertyBinders = [binderDetail];
            Reflect.defineMetadata(binderInfoMetaKey, externalPropertyBinders, target);
        }
    }
}

