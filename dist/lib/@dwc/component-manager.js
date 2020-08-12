import '../../../node_modules/reflect-metadata/Reflect.js';
import { EventBus } from './event-bus.js';
let _componentRegistory = {};
const EVENT_COMPONENT_REGISTORY_UPDATED = 'cmp:reg:updated';
function notifyComponentRegisteryIsUpdated() {
    EventBus.emit(EVENT_COMPONENT_REGISTORY_UPDATED);
}
/**
 * Register discoverable component to keep track of all component in the DOM
 * This method should be called when component is initiazed or loaded in the DOM
 * @param descriptor component descriptor
 */
export function registerComponent(descriptor) {
    descriptor.properties = Reflect.getMetadata(propertyMetadataKey, descriptor.classMetadata.type.prototype);
    descriptor.methods = Reflect.getMetadata(methodMetadataKey, descriptor.classMetadata.type.prototype);
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
let propertyMetadataKey = Symbol('properties');
/**
 * Register specific property at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerProperty(target, propertyKey, metadataInfo) {
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
let methodMetadataKey = Symbol('methods');
/**
 * Register specific method  at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerMethod(target, methodKey, metadataInfo) {
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
 * Get the property change event name for a specific  component
 * @param identifier Component unique identifer
 */
function getPropertyChangeEventName(identifier) {
    return `cmp:${identifier}:prop:changed`;
}
/**
 * Fire property change event
 * @param identifier Component unique id
 */
export function firePropertyChangeEvent(identifier) {
    EventBus.emit(getPropertyChangeEventName(identifier));
}
/**
 * Subscribe to property change event of the specific component
 * @param identifer Component unique identifer
 */
export function subscribePropertyChange(identifer, eventHandler) {
    EventBus.subscribe(getPropertyChangeEventName(identifer), eventHandler);
}
/**
 * Unsubscribe property change event of the specific component
 * @param identifer Component unique identifer
 */
export function unsubscribePropertyChange(identifer, eventHandler) {
    EventBus.unsubscribe(getPropertyChangeEventName(identifer), eventHandler);
}
/**
 * Register event listner when a component is added to the registory
 */
export function subscribeComponentRegistoryUpdate(eventHandler) {
    EventBus.subscribe(EVENT_COMPONENT_REGISTORY_UPDATED, eventHandler);
}
/**
 * Remove component registory update event listner
 * @param eventHandler
 */
export function unsubscribeComponentRegistoryUpdate(eventHandler) {
    EventBus.unsubscribe(EVENT_COMPONENT_REGISTORY_UPDATED, eventHandler);
}
/**
 * Returns the component registery
 */
export function getAllAvailableComponentInfo() {
    return Object.keys(_componentRegistory).map((identifer) => {
        return _componentRegistory[identifer];
    });
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
/**
 *
 * @param identifer Component unique identifier
 * @param propertyKey property to be set
 * @param value property value
 */
export function setProperties(identifer, propertyKey, value) {
    if (Reflect.has(_componentRegistory, identifer)) {
        let cmpInfo = _componentRegistory[identifer];
        if (Reflect.has(cmpInfo.classMetadata.type.prototype, propertyKey)) {
            Reflect.set(cmpInfo.instance, propertyKey, value);
        }
    }
}
/**
 * Invoke a method
 * @param identifer Component unique identifier
 * @param methodName property to be set
 * @param args property value
 */
export function invokeMethod(identifer, methodName, ...args) {
    if (Reflect.has(_componentRegistory, identifer)) {
        let cmpInfo = _componentRegistory[identifer];
        if (Reflect.has(cmpInfo.classMetadata.type.prototype, methodName)) {
            cmpInfo.instance[methodName].apply(cmpInfo.instance, args);
        }
    }
}
const EVENT_COMPONENT_TRACE_LOG = 'cmp:trace:log';
export function fireComponentTraceLog(trace) {
    EventBus.emit(EVENT_COMPONENT_TRACE_LOG, trace);
}
/**
 * Subscribe component trace log
 * @param eventHandler
 */
export function subscribeComponentTraceLog(eventHandler) {
    EventBus.subscribe(EVENT_COMPONENT_TRACE_LOG, eventHandler);
}
/**
 * Unsubscribe component trace log
 * @param eventHandler
 */
export function unsubscribeComponentTraceLog(eventHandler) {
    EventBus.unsubscribe(EVENT_COMPONENT_TRACE_LOG, eventHandler);
}
//# sourceMappingURL=component-manager.js.map