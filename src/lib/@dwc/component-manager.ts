import '../../../node_modules/reflect-metadata/Reflect.js';
import {EventBus} from './event-bus.js';

let _componentRegistory:any={}
const EVENT_COMPONENT_REGISTORY_UPDATED:string='component:Registory:Updated';


interface IComponentDescriptor{
    /**
     * Component instance unique identifier
     */
    identifier:string;
    /**
     * Instance of the component
     */
    instance:any;
    /**
     * 
     */
    classMetadata:any;
}

function notifyComponentRegisteryIsUpdated(){
    EventBus.emit(EVENT_COMPONENT_REGISTORY_UPDATED);
} 

/**
 * Register discoverable component to keep track of all component in the DOM
 * This method should be called when component is initiazed or loaded in the DOM
 * @param descriptor component descriptor
 */
export function registerComponent(descriptor:IComponentDescriptor){

    console.log('properties');
    console.log(Reflect.getMetadata(propertyMetadataKey,descriptor.classMetadata.type.prototype));
    
    console.log('methods');
    console.log(Reflect.getMetadata(methodMetadataKey,descriptor.classMetadata.type.prototype));

   //do not change  code below
    _componentRegistory[descriptor.identifier] = descriptor;
    notifyComponentRegisteryIsUpdated();
}

/**
 * Remove component from component registry so that component can be recycled
 * This method should be called when component is removed from the dom or no longer in use
 * @param identifier component identifer
 */
export function deRegisterComponent(identifier:string){
    if(Reflect.has(_componentRegistory,identifier)){
        Reflect.deleteProperty(_componentRegistory,identifier);
        notifyComponentRegisteryIsUpdated();
    }
     
}


let propertyMetadataKey = Symbol('property');
/**
 * Register specific property at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
 export function registerProperty(target:Object,propertyKey:string,metadataInfo?:Object):void{
    let descriptor: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(target,propertyKey);
    console.log(propertyKey,descriptor);
    let properties: Object[] = Reflect.getMetadata(propertyMetadataKey, target);
    let propInfo:Object = {
        name:propertyKey,
        type:Reflect.getMetadata("design:type",target,propertyKey),
       ...metadataInfo
    };
    if (properties) {
      properties.push(propInfo);
    } else {
      properties = [propInfo];
     
      Reflect.defineMetadata(propertyMetadataKey, properties, target);
    }
}

let methodMetadataKey = Symbol('method');
/**
 * Register specific method  at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerMethod(target:Object,methodKey:string,metadataInfo?:Object):void{
    let methods: Object[] = Reflect.getMetadata(methodMetadataKey, target);
    let methodInfo:Object = {
        name:methodKey,
        ...metadataInfo
    };
    if (methods) {
        methods.push(methodInfo);
    } else {
        methods = [methodInfo];
      Reflect.defineMetadata(methodMetadataKey, methods, target);
    }
}


/**
 * Register specific property or method at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerMethodOrProperty(target:Function,key:string,metadataInfo?:Object){
    //For Method and accessor decorator the property descriptor is provided but for property it is not undefined
    let descriptor: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(target,key);
     if(typeof(descriptor?.value) =="function"){
         registerMethod(target,key,metadataInfo);
     }else{
         registerProperty(target,key,metadataInfo);
     }
}

/**
 * Get the property change event name for a specific  component
 * @param identifier Component unique identifer
 */
function getPropertyChangeEventName(identifier:string):string{
    return "cmp_"+identifier+"_PropertyChanged";
}

/**
 * Fire property change event
 * @param identifier Component unique id
 */
export function firePropertyChangeEvent(identifier:string){
    EventBus.emit(getPropertyChangeEventName(identifier))
}

/**
 * Subscribe to property change event of the specific component
 * @param identifer Component unique identifer
 */
export function subscribePropertyChange(identifer:string,eventHandler:Function){
    EventBus.subscribe(getPropertyChangeEventName(identifer),eventHandler);
}

/**
 * Unsubscribe property change event of the specific component
 * @param identifer Component unique identifer
 */
export function unsubscribePropertyChange(identifer:string,eventHandler:Function){
    EventBus.unsubscribe(getPropertyChangeEventName(identifer),eventHandler);
}

/**
 * Register event listner when a component is added to the registory
 */
export function subscribeComponentRegistoryUpdate(eventHandler:Function){
    EventBus.subscribe(EVENT_COMPONENT_REGISTORY_UPDATED,eventHandler);
}
/**
 * Remove component registory update event listner
 * @param eventHandler
 */
export function unsubscribeComponentRegistoryUpdate(eventHandler:Function){
    EventBus.unsubscribe(EVENT_COMPONENT_REGISTORY_UPDATED,eventHandler);
}

/**
 * Returns the component registery
 */
export function getAllAvailableComponentInfo(){
    return Object.keys(_componentRegistory).map((identifer)=> _componentRegistory[identifer]);
    //return _componentRegistory;
}

/**
 * Return all available methods
 * @param target
 */
export function getAvailableMethods(target:Function):any{
    return Reflect.getMetadata(methodMetadataKey,target.prototype);
}


/**
 * Returns all available properties
 * @param target 
 */

export function getAvailableProperties(target:Function):any{
    return Reflect.getMetadata(propertyMetadataKey,target.prototype);
}
