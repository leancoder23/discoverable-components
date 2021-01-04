import { BusEvent } from "./@types/bus-event";
declare module '@dwc/core' {
    interface ComponentMetadata {
        name: string;
        description?: string;
        /**
        *When set true then component will not be registered in component registory and will not notify and be available to other component when it is connected
        *Typical use case for this component is developer tool component
        * @type {Boolean}
        * @memberof IdwcClassMetadata
        */
        isNonDiscoverable?: Boolean;
        /**
         * When this flag is set to true then only once instance of this component will be created in the system
         */
        allowOnlySingleInstance?:Boolean;
    }

    interface PropertyMetadata {
        description: string
    }

    interface FieldMetadata {
        description: string
    }

    interface IExternalComponentPropertyBinder{
        sourceComponentName: string;
        sourceComponentPropertyName: string;
        instanceIdentifier?: string;
    }

    export namespace Discover {
        function Component(dwcClassMetadata: ComponentMetadata): Function
        function Method(dwcApiMetadata?: PropertyMetadata): Function
        function Field(dwcApiMetadata?: FieldMetadata): Function
    }

    export function Renderer(target: any, key: string, descriptor: PropertyDescriptor): void

    export function OnConnected(target: any, key: string, descriptor: PropertyDescriptor):void
    
    export function OnDisconnected(target: any, key: string, descriptor: PropertyDescriptor):void

    export function Bind(binderInfo: IExternalComponentPropertyBinder): Function


    // component manager
    export function getAllAvailableComponentInfo(): Array<any>
    export function subscribeComponentRegistoryUpdate(eventHandler: Function): BusEvent
    export function unsubscribeComponentRegistoryUpdate(eventHandler: Function): void
    export function subscribeComponentTraceLog(eventHandler: Function): void
    export function invokeMethod(identifer: string, methodName: string, ...args: any[]): void
    export function setProperty(identifer: string, propertyKey: string, value:any): void
    export function getAvailableMethods(target: Function): any
    export function getAvailableProperties(target: Function): any

    // event bus
    export namespace EventBus {
        function subscribe(topic: string, callback: Function): void
        function unsubscribe(topic: string, callback?: Function): void
    }
}