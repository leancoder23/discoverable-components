import * as  ComponentManager from './component-manager.js';
import {EventBus} from './event-bus.js';


/**
 * hidden property for component unique id
 */
const uniqueIdSymbol = Symbol("uniqueId");
/**
 * hidden property for component subscription
 */
const subscriptionSymbol = Symbol("subscriptions");

const renderMetadataKey = Symbol("renderer");

/**
 * Interface to be implemented in order to ensure that DiscoverableComponent Decorator works correctly
 * Both methods are lifecycle method of a DiscoverableComponent
 */
export interface IDiscoverableWebComponent{
    /**
     * Call this method when component loaded in dom
     */
    connectedCallback():void; 
    /**
     * Call this method when a component removed or unloaded
     */
    disconnectedCallback():void; 
}

interface ISubscriptions{
    [key:string]:Function;
}

interface IdwcClassMetadata{
    name:string;
    description?:string;
} 
/**
 * Extend  a component and makes it discoverable to other component
 * @param dwcClassMetadata  
 */
export function DiscoverableWebComponent(dwcClassMetadata:IdwcClassMetadata) {
    return function <T extends { new(...args: any[]): {} }>(target: T) {
        
        let connectedCallback: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(target.prototype,'connectedCallback');
        let disconnectedCallback:PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(target.prototype,'disconnectedCallback');

        if(!connectedCallback||!disconnectedCallback){
            throw new Error('Component cannot be made discoverable, as required methods are not implemented');
        }

        // makes dev tools react to component selection
        function handleComponentClick (this:any) {
            const identifier = this[uniqueIdSymbol];
            const event = new CustomEvent("devtools:component-selection", { detail: { identifier: identifier }});
            window.dispatchEvent(event);
        }
        
        target.prototype.connectedCallback = function(){
            //Add unique identifier for the discoverable component to keep track in component registory
            this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);

            this.setAttribute('dwc-id', this[uniqueIdSymbol]);
            console.log(this.constructor.name)
            connectedCallback?.value.apply(this);
            ComponentManager.registerComponent({
                identifier:this[uniqueIdSymbol],
                instance:this,
                classMetadata:{type:target, ...dwcClassMetadata}
            });

            // makes dev tools react to component selection
            this.addEventListener('click', handleComponentClick);


            //populate binded property
            populatedBindedProperty(this);

            //if a class has external binder then subscribe the component registory change and run the property

            const componentRegistoryChangeEventHandler = ()=>{
                populatedBindedProperty(this);
            }

            if(Reflect.getMetadata(binderInfoMetaKey,target.prototype)){
                let topic = ComponentManager.subscribeComponentRegistoryUpdate(componentRegistoryChangeEventHandler);
                //add to subscription list so that it can be cleaned up later
                this[subscriptionSymbol][topic] = componentRegistoryChangeEventHandler;
            }
        }

        target.prototype.disconnectedCallback =function(){
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);

            this.removeEventListener('click', handleComponentClick);

            //Remove all the subscriptions for this component
            let subscriptions = (<ISubscriptions>this[subscriptionSymbol]);
            Object.keys(subscriptions).forEach(topic=>{
                //Assumption: All subscriptions are handled via event-bus
                EventBus.unsubscribe(topic,subscriptions[topic]); 
            })

            

            disconnectedCallback?.value.apply(this);
        }

        const validateRequiredSetup = ()=>{
            let targetPrototype = target.prototype;
            if(!Reflect.getMetadata(renderMetadataKey,targetPrototype)){
                throw new Error(`No renderer is specified for [${targetPrototype.constructor.name}]`);
            }
            //TODO: check other requirements here if needed for discoverable component
        }

        const setStoreProxy = function(this:any){
            let targetPrototype = target.prototype;
            let storePropertyKey = Reflect.getMetadata(storeMetadataKey,targetPrototype);
            if(!storePropertyKey){
                return;
            }

            let store = this[storePropertyKey] || {};

            let componentClassName = targetPrototype.constructor.name;

            this[storePropertyKey] = new Proxy(store,{
                get:function(obj:any,prop:string){
                  if(!Reflect.has(obj,prop)){
                      throw new Error(`Store property [${prop}] of ${componentClassName} does not exist`)
                  }
                  return Reflect.get(obj,prop);
                },
                set:function(obj:any,prop:string, val:any){
                    if(!Reflect.has(obj,prop)){
                        throw new Error(`Store property [${prop}] of ${componentClassName} does not exist`)
                    }
                    if(Reflect.set(obj,prop,val)){
                        //TODO :  Raise event property changed so that subscribers are notified and react to that change
                        return true;
                    }else{
                        throw new Error(`Store property [${prop}] of ${componentClassName} could not be set`)
                    }
                }
            });
        }

        const setBindedProperty = function(context:any,sourceInstance:any,binderInfo:IBinderMetadata):Boolean{
            if(Reflect.has(sourceInstance,binderInfo.sourceComponentPropertyName)){
                let propertyValue = Reflect.get(sourceInstance,binderInfo.sourceComponentPropertyName);
                if(propertyValue!=context[binderInfo.targetPropertyName]){
                    if(typeof propertyValue !='object'){
                        context[binderInfo.targetPropertyName] = propertyValue;
                    }else{
                        context[binderInfo.targetPropertyName] = Array.isArray(propertyValue)?[...propertyValue]:{...propertyValue}; //assign copy of it                       
                    }
                    //subscribe to that instance property change
                    let instancePropertyChangeEventName = ComponentManager.getPropertyChangeEventName(sourceInstance[uniqueIdSymbol]);
                    if(!context[subscriptionSymbol][instancePropertyChangeEventName]){
                        let populatedBindedPropertyFn = populatedBindedProperty.bind(null,context)
                        ComponentManager.subscribePropertyChange(sourceInstance[uniqueIdSymbol],populatedBindedPropertyFn);
                        context[subscriptionSymbol][instancePropertyChangeEventName] = populatedBindedPropertyFn; //keep track of subscription to clean it when component is unloaded

                    }
                     
                    return true;
                }
            }
            return false;
        }

        

        const populatedBindedProperty = function(context:any){

           let isBindedPropertyChanged:Boolean = false;

            let propertyExternalBinders:Array<IBinderMetadata> =  Reflect.getMetadata(binderInfoMetaKey,target.prototype);
            if(!propertyExternalBinders || propertyExternalBinders.length==0){
                return;
            }

            //currently available components
            let componentRegistory = ComponentManager.getComponentRegistory();

            //first identify all the binder specific to a component instance for run time binding
            let instanceSpecificBinders:Array<IBinderMetadata> = propertyExternalBinders.filter((b)=>b.instanceIdentifier);
            
            instanceSpecificBinders.forEach((b)=>{
                let instanceIdentifier:string = b.instanceIdentifier!;
                if(Reflect.has(componentRegistory,instanceIdentifier)){
                    let compInstance = componentRegistory[instanceIdentifier].instance;
                    if(setBindedProperty(context,compInstance,b)){
                        isBindedPropertyChanged=true;
                    }
                }
            });


            //Now for static/design time binding, identify first instance in the registory and bind the property to that instance
            let staticBinders:Array<IBinderMetadata> = propertyExternalBinders.filter((b)=>!b.instanceIdentifier);

            staticBinders.forEach((b)=>{
               let matchingComponentInstanceKey =  Object.keys(componentRegistory).find((k)=>{
                    return componentRegistory[k].classMetadata.name==b.sourceComponentName;
               });
               if(matchingComponentInstanceKey){
                let compInstance = componentRegistory[matchingComponentInstanceKey].instance;
                if(setBindedProperty(context,compInstance,b)){
                    isBindedPropertyChanged=true;
                }
               }
            });


            if(isBindedPropertyChanged){
                //call renderer 
               callRenderer(target,context);
            }
        }

        //extend the class and override its constructor  check here all the valid methods and required for this component
        return class extends target{
            [subscriptionSymbol]:ISubscriptions;
            constructor(...args:any[]){
                super(args);
                validateRequiredSetup();
                this[subscriptionSymbol]={};
            
            }
        }
    }
}


function callRenderer(target:any,context:any){
   
    let renderMethodName = Reflect.getMetadata(renderMetadataKey,target.prototype);
    console.log(renderMethodName);
    if(renderMethodName){
        let renderer =  <Function>Reflect.get(target.prototype,renderMethodName);
        renderer.apply(context);
    }
}


interface IdwcApiMetadata{
    description:string
}

/**
 * Expose a method or property as API, so that other component can interact with the component using this methods or property
 * @param dwcMethodMetadata 
 */
export function Api(dwcApiMetadata?:IdwcApiMetadata){
    return function(target:any,key:string,descriptor?:PropertyDescriptor|undefined):void{
        //let descriptor: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(target,key);
        if(typeof(descriptor?.value) =="function"){
            let originalMethod = descriptor.value;
            descriptor.value=function(this:any,...args:any[]){
                let result= originalMethod.apply(this,args);
                //now fire a method to log the calls
                ComponentManager.fireComponentTraceLog({
                    name:'Method invoked',
                    identifer:this[uniqueIdSymbol],
                    method:key,
                    args:args,
                    result:result
                });
                return result;
            }
            ComponentManager.registerMethod(target,key,dwcApiMetadata);
        }else{
            //override property setter to get add reactivity behaviours
            if(!descriptor){ 
                const propPrivateKey=Symbol(key);
                const getter = function(this:any) {
                    return this[propPrivateKey];
                };
                const setter = function(this:any,val:any) {
                    if(this[propPrivateKey]!=val){
                        this[propPrivateKey]= val;
                        
                        ComponentManager.fireComponentTraceLog({
                            name:'Property Change',
                            identifer:this[uniqueIdSymbol],
                            property:key,
                            value:val
                        }); 

                        //Call the change event on the object
                        ComponentManager.firePropertyChangeEvent(this[uniqueIdSymbol]);
                        
                    }
                };

                Object.defineProperty(target, key, {
                    get: getter,
                    set: setter
                }); 
            }else{
                //property accessor
                if(descriptor.set){
                    let originalSetter = descriptor.set;
                    descriptor.set=function(this:any,val){
                        originalSetter.call(this,val);

                        ComponentManager.fireComponentTraceLog({
                            name:'Property Change',
                            identifer:this[uniqueIdSymbol],
                            property:key,
                            value:val
                        }); 

                        ComponentManager.firePropertyChangeEvent(this[uniqueIdSymbol]);
                    }
                    Object.defineProperty(target, key, descriptor);
                }
            }

            ComponentManager.registerProperty(target,key,dwcApiMetadata);
        }

    }
}


/**
 * Exposes various Discoverable methods
 */
export const Discover = {
    Component:DiscoverableWebComponent,
    Method:Api,
    Field:Api
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


const storeMetadataKey = Symbol('store');

/**
 * Other component can subscribe to component store when that component is discoverable 
 *
 * @export
 * @param {*} target
 * @param {string} propertyKey
 */
export function Store(target:any,propertyKey:string){
    let storeMetadata:Object =  Reflect.getMetadata(storeMetadataKey, target);
    if(storeMetadata){
        throw new Error(`Duplicate Store definition is not allowed ${target.constructor.name}`);
    }

    //save store property name, this information will be used to set the store proxy object in the discoverable constructor
    Reflect.defineMetadata(storeMetadataKey, propertyKey, target);

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

