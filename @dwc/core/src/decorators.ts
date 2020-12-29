import Logger, { LogLevel } from './utils/logger';
import {debounce} from './utils/common';
const logger = new Logger({
    logLevel: LogLevel.DEBUG,
    debugPrefix: 'decorators'
});

import 'reflect-metadata';
import * as  ComponentManager from './component-manager';
import { EventBus } from './event-bus';

import { TraceLogType } from './@types/trace-log';

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

interface ISubscriptions{
    [key:string]:Function;
}

interface IdwcClassMetadata{
    name:string;
    description?:string;
     /**
     *When set true then component will not be registered in component registory and will not notify and be available to other component when it is connected
     *Typical use case for this component is developer tool component
     * @type {Boolean}
     * @memberof IdwcClassMetadata
     */
    isNonDiscoverable?: Boolean;
} 
/**
 * Extend  a component and makes it discoverable to other component
 * @param dwcClassMetadata  
 */
export function discoverableWebComponent(dwcClassMetadata:IdwcClassMetadata) {
    return function <T extends { new(...args: any[]): {} }>(target: T) {

        /*
        let connectedCallback: PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(target.prototype, 'connectedCallback');
        let disconnectedCallback: PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(target.prototype, 'disconnectedCallback');

        if (!connectedCallback || !disconnectedCallback) {
            throw new Error('Component cannot be made discoverable, as required methods are not implemented');
        }

        // makes dev tools react to component selection
        function handleComponentClick(identifier: string) {
            EventBus.emit("devtools:component-selection", { identifier: identifier });
        }

        target.prototype.connectedCallback = function () {
            

            this.setAttribute('dwc-id', this[uniqueIdSymbol]);
            connectedCallback?.value.apply(this);
            ComponentManager.registerComponent({
                identifier: this[uniqueIdSymbol],
                instance: this,
                classMetadata: { type: target, ...dwcClassMetadata }
            });

            // makes dev tools react to component selection
            this.addEventListener('click', () => handleComponentClick(this[uniqueIdSymbol]));

            //populate binded property
            populatedBindedProperty(this);

            //if a class has external binder then subscribe the component registory change and run the property

            const componentRegistoryChangeEventHandler = () => {
                populatedBindedProperty(this);
            }

            if (Reflect.getMetadata(binderInfoMetaKey, target.prototype)) {
                let topic = ComponentManager.subscribeComponentRegistoryUpdate(componentRegistoryChangeEventHandler);
                //add to subscription list so that it can be cleaned up later
                this[subscriptionSymbol][topic] = componentRegistoryChangeEventHandler;
            }
        } */

        /*
        target.prototype.disconnectedCallback = function () {
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);

            this.removeEventListener('click', handleComponentClick);

            //Remove all the subscriptions for this component
            let subscriptions = (<ISubscriptions>this[subscriptionSymbol]);
            Object.keys(subscriptions).forEach(topic => {
                //Assumption: All subscriptions are handled via event-bus
                EventBus.unsubscribe(topic, subscriptions[topic]);
            })



            disconnectedCallback?.value.apply(this);
        } */


        //TODO: handle property change event specific to property not on entire component instance level
        target.prototype.setBindedProperty=function(this: any, sourceInstance: any, binderInfo: IBinderMetadata): Boolean {
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

        target.prototype.populatePropertyBinding = function(this:any){

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

        const validateRequiredSetup = () => {
            let targetPrototype = target.prototype;
            if (!Reflect.getMetadata(onConnectedMethodMetadataKey, targetPrototype)) {
                throw new Error(`No OnConnected life cycle method is specified for [${targetPrototype.constructor.name}]`);
            }
            if (!Reflect.getMetadata(onDisconnectedMethodMetadataKey, targetPrototype)) {
                throw new Error(`No OnDisconnected life cycle method is specified for [${targetPrototype.constructor.name}]`);
            }
        }

        //extend the class and override its constructor  check here all the valid methods and required for this component
        return class extends target {
            [subscriptionSymbol]: ISubscriptions;
            constructor(...args: any[]) {
                super(args);
                //Add unique identifier for the discoverable component to keep track in component registory
                this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);
                this[componentMetadataKey] = { type: target, ...dwcClassMetadata };
                validateRequiredSetup();
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
 * Extends component life cycle method - 
 * When this method is called component register the instance and raise events to make inform other component its availability
 * If component binds properties of other discoverable component then this, the neccessary hooks are attached here 
 *
 * @export
 * @param {*} target
 * @param {string} key
 * @param {PropertyDescriptor} descriptor
 */
export function OnConnected(target: any, key: string, descriptor: PropertyDescriptor) {
    assertInvalidMethod(target, key, descriptor);

    let onConnectedMethodMetadata: Object = Reflect.getMetadata(onConnectedMethodMetadataKey, target);
    if (onConnectedMethodMetadata) {
        throw new Error(`Duplicate OnConnected life cycle method for ${target.constructor.name}`);
    }
    //Just save the metadata key on the instance
    Reflect.defineMetadata(onConnectedMethodMetadataKey, key, target);

    let originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
        //execute the user implementation
        originalMethod.apply(this, args);

        //Set html element unique id so that it can be used as DOM element selector by tools such as dev-tools
        //TODO: consider sitution for other type of component such as react or vue
        if (this instanceof HTMLElement) {
            this.setAttribute('dwc-id', this[uniqueIdSymbol]);
        }

        //if component has bind property to any other discoverable component property then set the binding and populate the property here
        this.populatePropertyBinding();

        //if a class has external binder then subscribe the component registory change and run the propertys
        const componentRegistoryChangeEventHandler = () => {
           
            this.populatePropertyBinding();
        }
        if (Reflect.getMetadata(binderInfoMetaKey, target)) {
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

    }
}

/**
 * Extends component life cycle method - when component is no longer available
 * Here we perform all the clean operations such as deregistering event handler and notify other component that component is no longer available
 *
 * @export
 * @param {*} target
 * @param {string} key
 * @param {PropertyDescriptor} descriptor
 */
export function OnDisconnected(target: any, key: string, descriptor: PropertyDescriptor) {
    assertInvalidMethod(target, key, descriptor);

    let onDisconnectedMethodMetadata: Object = Reflect.getMetadata(onDisconnectedMethodMetadataKey, target);
    if (onDisconnectedMethodMetadata) {
        throw new Error(`Duplicate OnDisconnected life cycle method for ${target.constructor.name}`);
    }
    //Just save the metadata key on the instance
    Reflect.defineMetadata(onDisconnectedMethodMetadataKey, key, target);


    let originalMethod = descriptor.value;
    descriptor.value = function (this: any, ...args: any[]) {
        //Remove all the subscriptions for this component
        let subscriptions = (<ISubscriptions>this[subscriptionSymbol]);
        Object.keys(subscriptions).forEach(topic => {
            //Assumption: All subscriptions are handled via event-bus
            EventBus.unsubscribe(topic, subscriptions[topic]);
        })
        ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);
        //execute the user implementation
        originalMethod.apply(this);

    }

}


interface IdwcApiMetadata{
    description:string
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
            // now fire a method to log the calls
            let s = {
                date: new Date(),
                type: TraceLogType.METHOD_CALL,
                targetId: this[uniqueIdSymbol],
                payload: {
                    methodName: key,
                    args: args,
                    result: result,
                    errorStack: new Error().stack
                }
            };
            console.log(s);
            ComponentManager.fireComponentTraceLog(s);


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

                    // now fire a method to log the calls
                    ComponentManager.fireComponentTraceLog({
                        date: new Date(),
                        type: TraceLogType.PROPERTY_CHANGE,
                        targetId: this[uniqueIdSymbol],
                        payload: {
                            property: key,
                            value: val
                        }
                    });

                    //Call the change event on the object
                    ComponentManager.firePropertyChangeEvent(this[uniqueIdSymbol]);

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
                    // now fire a method to log the calls
                    ComponentManager.fireComponentTraceLog({
                        date: new Date(),
                        type: TraceLogType.PROPERTY_CHANGE,
                        targetId: this[uniqueIdSymbol],
                        payload: {
                            property: key,
                            value: val
                        },

                    });

                    ComponentManager.firePropertyChangeEvent(this[uniqueIdSymbol]);
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
export function Renderer(target:any,key:string,descriptor:PropertyDescriptor){
   
    let rendererMetadata:Object =  Reflect.getMetadata(renderMetadataKey, target);
    if(rendererMetadata){
        throw new Error(`Duplicate Renderer ${target.constructor.name}`);
    }
    //Just log render method name
    Reflect.defineMetadata(renderMetadataKey, key, target);
}

interface IExternalComponentPropertyBinder{
    sourceComponentName:string;
    sourceComponentPropertyName:string;
    instanceIdentifier?:string; //Optional TODO: should be used later 
}

interface IBinderMetadata extends IExternalComponentPropertyBinder{
    targetPropertyName:string;
}

const binderInfoMetaKey=Symbol("binderInfo");
/**
 * Bind property of a component to external component, property will be updated when component is discovered and related property changes at source  
 * Use this decorator to bind component property on design time, this will bind the first instance of the source component property
 * @export
 * @param {IExternalComponentPropertyBinder} binderInfo
 * @returns
 */
export function Bind(binderInfo:IExternalComponentPropertyBinder){
    return function(target:any,key:string):void{
        //now keep this information which property is binded to other component 
        //so that when that component property changes then this component should be updated
        let externalPropertyBinders: IBinderMetadata[] = Reflect.getMetadata(binderInfoMetaKey, target);
        let binderDetail:IBinderMetadata = {
            targetPropertyName:key,
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

