import * as  ComponentManager from './component-manager.js';
import TraceLog, { TraceLogType } from './@types/trace-log.js';
import { EventBus } from './event-bus.js';

const uniqueIdSymbol = Symbol("uniqueId");

export type Constructor<T> = {
    // tslint:disable-next-line:no-any
    new (...args: any[]): T 
};

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

interface IdwcClassMetadata{
    name:string;
    description?:string;
} 
/**
 * Extend  a component and makes it discoverable to other component
 * @param dwcClassMetadata 
 */
export function DiscoverableWebComponent(dwcClassMetadata:IdwcClassMetadata) {
    return function (classOrDescriptor: Constructor<IDiscoverableWebComponent>) {
        let connectedCallback: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'connectedCallback');
        let disconnectedCallback:PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'disconnectedCallback');

        if(!connectedCallback||!disconnectedCallback){
            throw new Error('Component cannot be made discoverable, as required methods are not implemented');
        }

        // makes dev tools react to component selection
        function handleComponentClick (identifier: string) {
            EventBus.emit("devtools:component-selection", { identifier: identifier });
        }
        
        classOrDescriptor.prototype.connectedCallback = function(){
            //Add unique identifier for the discoverable component to keep track in component registory
            this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);

            this.setAttribute('dwc-id', this[uniqueIdSymbol]);

            connectedCallback?.value.apply(this);

            ComponentManager.registerComponent({
                identifier:this[uniqueIdSymbol],
                instance:this,
                classMetadata:{type:classOrDescriptor, ...dwcClassMetadata}
            });

            // makes dev tools react to component selection
            this.addEventListener('click', () => handleComponentClick(this[uniqueIdSymbol]));
        }

        classOrDescriptor.prototype.disconnectedCallback =function(){
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);

            this.removeEventListener('click', handleComponentClick);

            disconnectedCallback?.value.apply(this);
        }
    }
}


interface IdwcApiMetadata{
    description:string
}


/**
 * Expose a method or property as API, so that other component can interact with the component using this methods or property
 * @param dwcMethodMetadata 
 */
export function Api(dwcApiMetadata?:IdwcApiMetadata) {
    return function(target:any,key:string,descriptor?:PropertyDescriptor|undefined):void{
        //let descriptor: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(target,key);
        if (typeof(descriptor?.value) =="function") {
            let originalMethod = descriptor.value;
            descriptor.value=function(this:any,...args:any[]) {
                let result= originalMethod.apply(this,args);

                // now fire a method to log the calls
                ComponentManager.fireComponentTraceLog ({
                    date: new Date(),
                    type: TraceLogType.METHOD_CALL,
                    targetId: this[uniqueIdSymbol],
                    payload: {
                        methodName: key,
                        args: args,
                        result: result
                    }
                });

                return result;
            }
            ComponentManager.registerMethod(target,key,dwcApiMetadata);
        } else {
            //override property setter to get add reactivity behaviours
            if(!descriptor){ 
                const propPrivateKey=Symbol(key);
                const getter = function(this:any) {
                    return this[propPrivateKey];
                };
                const setter = function(this:any,val:any) {
                    if(this[propPrivateKey]!=val){
                        this[propPrivateKey]= val;
                        
                        // now fire a method to log the calls
                        ComponentManager.fireComponentTraceLog ({
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
                if (descriptor.set){
                    let originalSetter = descriptor.set;
                    descriptor.set=function(this:any,val){
                        originalSetter.call(this,val);

                        // now fire a method to log the calls
                        ComponentManager.fireComponentTraceLog ({
                            date: new Date(),
                            type: TraceLogType.PROPERTY_CHANGE,
                            targetId: this[uniqueIdSymbol],
                            payload: {
                                property: key,
                                value: val
                            }
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