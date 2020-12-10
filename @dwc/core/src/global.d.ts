import { BusEvent } from "./@types/bus-event";
declare module '@dwc/core' {
    interface ComponentMetadata {
        name: string;
        description?: string;
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

    export function Store(target: any, propertyKey: string)

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