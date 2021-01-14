import Logger, { LogLevel } from './utils/logger';
const logger = new Logger({
    logLevel: LogLevel.DEBUG,
    debugPrefix: 'component manager'
});

import 'reflect-metadata';

import { EventBus } from './event-bus';

import { BusEvent } from './@types/bus-event';
import { TraceLogType } from './@types/trace-log';

import {DwcStore} from './dwc-store';

interface IComponentRegistory {
    [key: string]: IComponentDescriptor;
}


let _componentRegistory: IComponentRegistory = DwcStore.getInstance().componentRegistory ;

interface IComponentDescriptor {
    /**
     * Component instance unique identifier
     */
    identifier: string;
    /**
     * Instance of the component
     */
    instance: any;
    /**
     * 
     */
    classMetadata: any;

    /**
     * Class exposed properties meta infos
     */
    properties?: any[];

    /**
     * Class exposed method infos
     */
    methods?: any[];
}

function notifyComponentRegisteryIsUpdated() {
    logger.debug('notify about registry updated. Current component keys:', Object.keys(_componentRegistory));
    EventBus.emit(BusEvent.CMP_TRACE_LOG);
}

/**
 * Register discoverable component to keep track of all component in the DOM
 * This method should be called when component is initiazed or loaded in the DOM
 * @param descriptor component descriptor
 */
export function registerComponent(descriptor: IComponentDescriptor) {
    logger.debug('register component: ', descriptor);

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
export function deRegisterComponent(identifier: string) {
    if (Reflect.has(_componentRegistory, identifier)) {
        Reflect.deleteProperty(_componentRegistory, identifier);
        notifyComponentRegisteryIsUpdated();
    }

}

const propertyMetadataKey = DwcStore.getInstance().propertyMetadataKey

/**
 * Register specific property at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerProperty(target: Object, propertyKey: string, metadataInfo?: Object): void {
    let properties: Object[] = Reflect.getMetadata(propertyMetadataKey, target);
    let propInfo: any = {
        name: propertyKey,
        type: Reflect.getMetadata("design:type", target, propertyKey),
        ...metadataInfo
    };
    if (properties) {
        properties.push(propInfo);
    } else {
        properties = [propInfo];

        Reflect.defineMetadata(propertyMetadataKey, properties, target);
    }
}

const methodMetadataKey = DwcStore.getInstance().methodMetadataKey;
/**
 * Register specific method  at class metadata level in order to fetch that information later
 * @param target Class prototype object
 * @param key  property or method name
 */
export function registerMethod(target: Object, methodKey: string, metadataInfo?: Object): void {
    let methods: Object[] = Reflect.getMetadata(methodMetadataKey, target);
    let methodInfo: any = {
        name: methodKey,
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
 * Get the property change event name for a specific  component
 * @param identifier Component unique identifer
 */
export function getPropertyChangeEventName(identifier: string): string {
    return `cmp:${identifier}:prop:changed`;
}

/**
 * Fire property change event
 * @param identifier Component unique id
 */
export function firePropertyChangeEvent(identifier: string) {
    console.log(`firing property change event for ${identifier}`);
    EventBus.emit(getPropertyChangeEventName(identifier))
}

/**
 * Subscribe to property change event of the specific component, return topic name which user has subscribed
 * @param identifer Component unique identifer
 */
export function subscribePropertyChange(identifer: string, eventHandler: Function): string {
    let topic: string = getPropertyChangeEventName(identifer);
    EventBus.subscribe(topic, eventHandler);
    return topic;
}

/**
 * Unsubscribe property change event of the specific component
 * @param identifer Component unique identifer
 */
export function unsubscribePropertyChange(identifer: string, eventHandler: Function) {
    EventBus.unsubscribe(getPropertyChangeEventName(identifer), eventHandler);
}

/**
 * Register event listner when a component is added to the registory
 */
export function subscribeComponentRegistoryUpdate(eventHandler: Function) {
    EventBus.subscribe(BusEvent.CMP_TRACE_LOG, eventHandler);
    return BusEvent.CMP_TRACE_LOG;
}
/**
 * Remove component registory update event listner
 * @param eventHandler
 */
export function unsubscribeComponentRegistoryUpdate(eventHandler: Function) {
    EventBus.unsubscribe(BusEvent.CMP_REG_UPDATED, eventHandler);
}

/**
 * Returns the component registery
 */
export function getAllAvailableComponentInfo(): Array<any> {
    return Object.keys(_componentRegistory).map((identifer) => {
        return _componentRegistory[identifer];
    });
    //return _componentRegistory;
}

/**
 *TODO: Need to restrict the access to only decorators not to other component, this require refactoring later
 *
 * @export
 * @returns {IComponentRegistory}
 */
export function getComponentRegistory(): IComponentRegistory {
    return _componentRegistory;
}

/**
 * Return all available methods
 * @param target
 */
export function getAvailableMethods(target: Function): any {
    const metadata = Reflect.getMetadata(methodMetadataKey, target.prototype);
    //logger.debug(`get available methods for target "${target}" and received metadata "${metadata}"`);
    return metadata;
}

/**
 * Returns all available properties
 * @param target 
 */
export function getAvailableProperties(target: Function): any {
    const metadata = Reflect.getMetadata(propertyMetadataKey, target.prototype);
    //logger.debug(`get available properties for target "${target}" and received metadata "${metadata}"`);
    return metadata;
}




/**
 * Set component property by component name
 * @param componentName Component unique name
 * @param propertyKey property to be set
 * @param value property value
 */
export function setPropertyByComponentName(source: any,componentName: string, propertyKey: string, value: any) {

    let componentIdentifier = Object.keys(_componentRegistory).find((key) => _componentRegistory[key].classMetadata.name === componentName);
    if (componentIdentifier) {
        setProperty(source, componentIdentifier, propertyKey, value);
    } else {
        logger.debug(`Component ${componentName} is not found in the registory, this component may not be loaded in the DOM`);
    }
}

/**
 * set component property
 * @param identifer Component unique identifier
 * @param propertyKey property to be set
 * @param value property value
 */
export function setProperty(source: any,identifer: string, propertyKey: string, value: any) {

    let sourceComponentName:string;
    if(source.isDwcDevTool){
        sourceComponentName='Dev Tool'
    }else{
         let sourceComponentIdentifer = Object.keys(_componentRegistory).find((k) => _componentRegistory[k].instance === source);
        if (!sourceComponentIdentifer) {
            logger.debug(`You are trying to set the ${propertyKey} property of component ${_componentRegistory[identifer].classMetadata.name} from non discoverable component`);
            throw new Error(`Discoverable component property can only be set from another discoverable component`);
        }
        sourceComponentName =_componentRegistory[sourceComponentIdentifer].classMetadata.name;
    }
    if (Reflect.has(_componentRegistory, identifer)) {
        let cmpInfo = _componentRegistory[identifer];
        if (Reflect.has(cmpInfo.classMetadata.type.prototype, propertyKey)) {
            Reflect.set(cmpInfo.instance, propertyKey, value);
            //raise trace log event
            if (isTracelogSubscriberAvailable()) {
                let trace = {
                    date: new Date(),
                    type: TraceLogType.PROPERTY_CHANGE,
                    targetId: identifer,
                    sourceId:sourceComponentName,
                    payload: {
                        property: propertyKey,
                        value: value
                    }
                }
                logger.debug(trace);
                fireComponentTraceLog(trace);
            }
        }else {
            logger.debug(`${propertyKey} is not exposed as api on the ${cmpInfo.classMetadata.name} component. Please make sure the method is annoted with Discover.Field decorator`);
        }
    } else {
        logger.debug(`Component with identifier ${identifer} is not found in the registory, this component may not be loaded in the DOM`);
    }
}

/**
 * Invoke a method by component name
* @param source Source component instance - who want to invoke method of other discoverable component
 * @param componentName Component unique name
 * @param methodName property to be set
 * @param args property value
 */
export function invokeMethodByComponentName(source: any, componentName: string, methodName: string, ...args: any[]) {

    let componentIdentifier = Object.keys(_componentRegistory).find((key) => _componentRegistory[key].classMetadata.name === componentName);
    if (componentIdentifier) {
        invokeMethod(source, componentIdentifier, methodName, args);
    } else {
        logger.debug(`Component ${componentName} is not found in the registory, this component may not be loaded in the DOM`);
    }
}

/**
 * Invoke a method
 * @param source Source component instance - who want to invoke method of other discoverable component
 * @param identifer Component unique identifier
 * @param methodName property to be set
 * @param args property value
 */
export function invokeMethod(source: any, identifer: string, methodName: string, ...args: any[]) {
    //check if source is valid dwc component or dwc dev tool, if not then reject the request
    let sourceComponentName:string;
    if(source.isDwcDevTool){
        sourceComponentName='Dev Tool'
    }else{
         let sourceComponentIdentifer = Object.keys(_componentRegistory).find((k) => _componentRegistory[k].instance === source);
        if (!sourceComponentIdentifer) {
            logger.debug(`You are trying to invoke method ${methodName} of component ${_componentRegistory[identifer].classMetadata.name} from non discoverable component`);
            throw new Error(`Discoverable component method can only be invoked from another discoverable component`);
        }
        sourceComponentName =_componentRegistory[sourceComponentIdentifer].classMetadata.name;
    }
    
    if (Reflect.has(_componentRegistory, identifer)) {
        let cmpInfo = _componentRegistory[identifer];
        if (Reflect.has(cmpInfo.classMetadata.type.prototype, methodName)) {
            // console.log(`invokeMethod called for ${methodName}  of ${identifer} and caller is ${Function.caller}`);
            let result = cmpInfo.instance[methodName].apply(cmpInfo.instance, args);

            //raise trace log event
            if (isTracelogSubscriberAvailable()) {
                let trace = {
                    date: new Date(),
                    type: TraceLogType.METHOD_CALL,
                    targetId: identifer,
                    sourceId:sourceComponentName,
                    payload: {
                        methodName: methodName,
                        args: args,
                        result: result
                    }
                }
                logger.debug(trace);
                fireComponentTraceLog(trace);
            }
        } else {
            logger.debug(`${methodName} method is not exposed as api method on the ${cmpInfo.classMetadata.name} component. Please make sure the method is annoted with Discover.method decorator`);
        }
    } else {
        logger.debug(`Component with identifier ${identifer} is not found in the registory, this component may not be loaded in the DOM`);
    }
}



/**
 * When a component exposed property is updated or method is invoked a component trace log event is fired.
 * Subscriber can subscribe to this event to get the info regarding property change or methods invoked
 */

export function fireComponentTraceLog(trace: any) {
    logger.debug('fire component trace log');
    EventBus.emit(BusEvent.CMP_TRACE_LOG, trace);
}

/**
 * Subscribe component trace log
 * @param eventHandler 
 */
export function subscribeComponentTraceLog(eventHandler: Function) {
    logger.debug('subscribe for component trace log with function:', eventHandler);
    EventBus.subscribe(BusEvent.CMP_TRACE_LOG, eventHandler);
}
/**
 * Unsubscribe component trace log
 * @param eventHandler 
 */
export function unsubscribeComponentTraceLog(eventHandler?: Function) {
    EventBus.unsubscribe(BusEvent.CMP_TRACE_LOG, eventHandler);
}

/**
 * Return true if there is subscriber available. This information is used to generate tracelog information
 */
export function isTracelogSubscriberAvailable(): Boolean {
    let tracelogSubscribers = EventBus.getTopicReceivers(BusEvent.CMP_TRACE_LOG);
    return Array.isArray(tracelogSubscribers) && tracelogSubscribers.length > 0;
}

/**
 * Return true if component instance exists in the system
 *
 * @export
 * @param {string} name
 * @returns {Boolean}
 */
export function checkIfComponentIntanceExists(name: string): Boolean {
    return Object.keys(_componentRegistory).findIndex((key) => _componentRegistory[key].classMetadata.name === name) > -1;

}

