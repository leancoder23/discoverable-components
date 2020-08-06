import '../../../node_modules/reflect-metadata/Reflect.js';
let _componentRegistory = {};
const EVENT_COMPONENT_REGISTORY_UPDATED = 'componentRegistoryUpdatedEvent';
function notifyComponentRegisteryIsUpdated() {
    const event = new CustomEvent(EVENT_COMPONENT_REGISTORY_UPDATED);
    window.dispatchEvent(event);
}
/**
 * Register discoverable component to keep track of all component in the DOM
 * This method should be called when component is initiazed or loaded in the DOM
 * @param descriptor component descriptor
 */
export function registerComponent(descriptor) {
    console.log('properties');
    console.log(Reflect.getMetadata(propertyMetadataKey, descriptor.classMetadata.type.prototype));
    console.log('methods');
    console.log(Reflect.getMetadata(methodMetadataKey, descriptor.classMetadata.type.prototype));
    //do not change  code below
    _componentRegistory[descriptor.identifier] = descriptor;
    notifyComponentRegisteryIsUpdated();
}
/**
 * Remove component from component registry so that component can be recycled
 * This method should be called when component is removed from the dom or no longer in use
 * @param identifier component identifer
 */
export function deRegisterComponent(identifier) {
    if (Reflect.has(_componentRegistory, identifier)) {
        Reflect.deleteProperty(_componentRegistory, identifier);
        notifyComponentRegisteryIsUpdated();
    }
}
let propertyMetadataKey = Symbol('property');
function registerProperty(target, propertyKey, metadataInfo) {
    let properties = Reflect.getMetadata(propertyMetadataKey, target);
    let propInfo = Object.assign({ name: propertyKey, type: Reflect.getMetadata("design:type", target, propertyKey) }, metadataInfo);
    if (properties) {
        properties.push(propInfo);
    }
    else {
        properties = [propInfo];
        Reflect.defineMetadata(propertyMetadataKey, properties, target);
    }
}
let methodMetadataKey = Symbol('method');
function registerMethod(target, methodKey, metadataInfo) {
    let methods = Reflect.getMetadata(methodMetadataKey, target);
    let methodInfo = Object.assign({ name: methodKey }, metadataInfo);
    if (methods) {
        methods.push(methodInfo);
    }
    else {
        methods = [methodInfo];
        Reflect.defineMetadata(methodMetadataKey, methods, target);
    }
}
/**
 * Register specific property or method at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerMethodOrProperty(target, key, metadataInfo) {
    //For Method and accessor decorator the property descriptor is provided but for property it is not undefined
    let descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    if (typeof (descriptor === null || descriptor === void 0 ? void 0 : descriptor.value) == "function") {
        registerMethod(target, key, metadataInfo);
    }
    else {
        registerProperty(target, key, metadataInfo);
    }
}
/**
 * Register event listner when a component is added to the registory
 */
export function addComponentRegistoryUpdateEventListner(eventHandler) {
    window.addEventListener(EVENT_COMPONENT_REGISTORY_UPDATED, eventHandler);
}
/**
 * Remove component registory update event listner
 * @param eventHandler
 */
export function removeComponentRegistoryUpdateEventListner(eventHandler) {
    window.removeEventListener(EVENT_COMPONENT_REGISTORY_UPDATED, eventHandler);
}
/**
 * Returns the component registery
 */
export function getAllAvailableComponentInfo() {
    return Object.keys(_componentRegistory).map((identifer) => _componentRegistory[identifer]);
    //return _componentRegistory;
}
/**
 * Return all available methods
 * @param target
 */
export function getAvailableMethods(target) {
    return Reflect.getMetadata(methodMetadataKey, target.prototype);
}
/**
 * Returns all available properties
 * @param target
 */
export function getAvailableProperties(target) {
    return Reflect.getMetadata(propertyMetadataKey, target.prototype);
}
//# sourceMappingURL=component-manager.js.map