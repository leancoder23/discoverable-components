import * as  ComponentManager from './component-manager.js';

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
        console.log('[decorators] DiscorableWebComponent decorator called');
        let connectedCallback: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'connectedCallback');
        let disconnectedCallback:PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'disconnectedCallback');

        if(!connectedCallback||!disconnectedCallback){
            throw new Error('Component cannot be made discoverable, as required methods are not implemented');
        }

        let uniqueIdSymbol = Symbol("uniqueId");
        
        classOrDescriptor.prototype.connectedCallback = function(){
            //Add unique identifier for the discoverable component to keep track in component registory
            this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);

            ComponentManager.registerComponent({
                identifier:this[uniqueIdSymbol],
                instance:this,
                classMetadata:{type:classOrDescriptor, ...dwcClassMetadata}
            });
            connectedCallback?.value.apply(this);
        }

        classOrDescriptor.prototype.disconnectedCallback =function(){
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);
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
export function Api(dwcMethodMetadata?:IdwcApiMetadata){
    return function(target:any,methodKey:string){
       ComponentManager.registerMethodOrProperty(target,methodKey,dwcMethodMetadata);
    }
}