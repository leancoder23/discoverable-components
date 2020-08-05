export const componentList = {};
function setComponentInfo(cmpDescriptor) {
    if (!Reflect.has(componentList, cmpDescriptor.id))
        componentList[cmpDescriptor.id] = cmpDescriptor;
}
function removeComponentInfo(id) {
    Reflect.deleteProperty(componentList, id);
}
function notifyComponentListUpdated() {
    const event = new CustomEvent('componentListUpdated');
    window.dispatchEvent(event);
}
export function DiscorableWebComponent(clsMetadata) {
    return function (classOrDescriptor) {
        var _a;
        const newClass = (_a = class extends classOrDescriptor {
            },
            _a.classMetaData = clsMetadata,
            _a);
        let connectedCallbackMethod = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype, 'connectedCallback');
        if (connectedCallbackMethod) {
            classOrDescriptor.prototype.connectedCallback = function () {
                console.log('notifying others');
                this.newComponentEventHandler = (e) => {
                    console.log("new component added");
                    this.updateUI();
                    console.log(componentList);
                };
                setComponentInfo({
                    id: this.uniqueId,
                    instance: this,
                    classMetadata: classOrDescriptor
                });
                window.addEventListener("componentListUpdated", this.newComponentEventHandler);
                notifyComponentListUpdated();
                //bind to new component event
                connectedCallbackMethod === null || connectedCallbackMethod === void 0 ? void 0 : connectedCallbackMethod.value.apply(this);
            };
        }
        let disconnectedCallbackMethod = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype, 'disconnectedCallback');
        console.log(disconnectedCallbackMethod);
        if (disconnectedCallbackMethod) {
            classOrDescriptor.prototype.disconnectedCallback = function () {
                console.log('cleaning up');
                //bind to new component event
                window.removeEventListener('componentListUpdated', this.newComponentEventHandler);
                removeComponentInfo(this.uniqueId);
                console.log(componentList);
                notifyComponentListUpdated();
                disconnectedCallbackMethod === null || disconnectedCallbackMethod === void 0 ? void 0 : disconnectedCallbackMethod.value.apply(this);
            };
        }
        ///window.customElements.define(tagName,newClass);
        return newClass;
    };
}
//# sourceMappingURL=component.js.map