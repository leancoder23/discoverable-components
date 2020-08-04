export function DiscorableWebComponent(name, description, tagName) {
    return function (classOrDescriptor) {
        const newClass = class extends classOrDescriptor {
            static getMetadata() {
                return {
                    name: name,
                    tagName: tagName,
                    description: description
                };
            }
        };
        console.log(Object.getOwnPropertyNames(classOrDescriptor.prototype));
        let prop = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype, 'connectedCallback');
        console.log(prop);
        classOrDescriptor.prototype.connectedCallback = function () {
            prop === null || prop === void 0 ? void 0 : prop.value.apply(this);
            console.log('updated cconnect ccallback');
            //bind to new component event
        };
        window.customElements.define(tagName, newClass);
        return newClass;
    };
}
//# sourceMappingURL=decorators.js.map