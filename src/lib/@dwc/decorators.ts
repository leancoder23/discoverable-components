import * as  ComponentManager from './component-manager.js';


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
        }

        target.prototype.disconnectedCallback =function(){
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);

            this.removeEventListener('click', handleComponentClick);

            disconnectedCallback?.value.apply(this);
        }

        const validateRequiredSetup = ()=>{
            let targetPrototype = target.prototype;
            if(!Reflect.getMetadata(renderMetadataKey,targetPrototype)){
                throw new Error(`No renderer is specified for [${targetPrototype.constructor.name}]`);
            }
            //TODO: check other requirements here if needed for discoverable component
        }

        //extend the class and override its constructor  check here all the valid methods and required for this component
        return class extends target{
            [subscriptionSymbol]:Array<any>;
            constructor(...args:any[]){
                super(args);
                validateRequiredSetup();
                this[subscriptionSymbol]=[];
            }
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


/**
 * Exposes various Discoverable methods
 */
export const Discover = {
    Component:DiscoverableWebComponent,
    Method:Api,
    Field:Api
}