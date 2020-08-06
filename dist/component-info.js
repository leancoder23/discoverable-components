import { html, render } from '../node_modules/lit-html/lit-html.js';
import { getAllAvailableComponentInfo, addComponentRegistoryUpdateEventListner, removeComponentRegistoryUpdateEventListner, getAvailableMethods, getAvailableProperties } from './lib/@dwc/component-manager.js';
class ComponentInfo extends HTMLElement {
    constructor() {
        super();
        console.log('cmp is loaded ');
        this.root = this.attachShadow({ mode: 'open' });
    }
    handleComponentRegistoryUpdate() {
        this.updateUI();
    }
    connectedCallback() {
        addComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate.bind(this));
        this.updateUI();
    }
    disconnectedCallback() {
        removeComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate);
    }
    updateUI() {
        let componentList = getAllAvailableComponentInfo();
        let cmp = componentList.map((cmp) => {
            let props = getAvailableProperties(cmp.classMetadata.type).map((p) => {
                return p.name;
            }).join(',');
            let methods = getAvailableMethods(cmp.classMetadata.type).map((m) => {
                return m.name;
            }).join(',');
            return html `
                <div class="section">
                   <b>Identifier:</b> ${cmp.identifier} 
                   <b>Name:</b> ${cmp.classMetadata.name} <br/>
                   <b>Description:</b> ${cmp.classMetadata.description} 
                    <div>
                        <strong>Properties:</strong>
                        ${props}
                    </div>
                    <div>
                        <strong>Methods:</strong>
                        ${methods}
                    </div>
            </div>`;
        });
        render(html `
                <style>
                    .section {
                        border-bottom:1px solid black;
                    }
                </style>
                <div>   
                    ${cmp} 
                </div>`, this.root);
    }
}
ComponentInfo.is = "cmp-info";
customElements.define(ComponentInfo.is, ComponentInfo);
//# sourceMappingURL=component-info.js.map