import * as ComponentManager from './component-manager.js';
/**
 * Extend  a component and makes it discoverable to other component
 * @param dwcClassMetadata
 */
export function DiscorableWebComponent(dwcClassMetadata) {
    return function (classOrDescriptor) {
        console.log('DiscorableWebComponent decorator called');
        let connectedCallback = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype, 'connectedCallback');
        let disconnectedCallback = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype, 'disconnectedCallback');
        if (!connectedCallback || !disconnectedCallback) {
            throw new Error('Component cannot be made discoverable, as required methods are not implemented');
        }
        let uniqueIdSymbol = Symbol("uniqueId");
        classOrDescriptor.prototype.connectedCallback = function () {
            //Add unique identifier for the discoverable component to keep track in component registory
            this[uniqueIdSymbol] = Math.random().toString(36).substr(2, 9);
            ComponentManager.registerComponent({
                identifier: this[uniqueIdSymbol],
                instance: this,
                classMetadata: Object.assign({ type: classOrDescriptor }, dwcClassMetadata)
            });
            connectedCallback === null || connectedCallback === void 0 ? void 0 : connectedCallback.value.apply(this);
        };
        classOrDescriptor.prototype.disconnectedCallback = function () {
            ComponentManager.deRegisterComponent(this[uniqueIdSymbol]);
            disconnectedCallback === null || disconnectedCallback === void 0 ? void 0 : disconnectedCallback.value.apply(this);
        };
    };
}
/**
 * Expose property metadata to other components
 * @param dwcPropMetadata
 */
export function DiscorableWebComponentProperty(dwcPropMetadata) {
    return function (target, propertyKey) {
        ComponentManager.registerProperty(target, propertyKey, dwcPropMetadata);
    };
}
/**
 * Expose method to other components
 * @param dwcMethodMetadata
 */
export function DiscorableWebComponentMethod(dwcMethodMetadata) {
    return function (target, methodKey) {
        ComponentManager.registerMethod(target, methodKey, dwcMethodMetadata);
    };
}
export function Api(dwcMethodMetadata) {
    return function (target, methodKey) {
        ComponentManager.registerMethod(target, methodKey, dwcMethodMetadata);
    };
}
//# sourceMappingURL=component.js.map