var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
//import {html, render} from 'https://unpkg.com/lit-html?module';
import { html, render } from '../node_modules/lit-html/lit-html.js';
import { DiscorableWebComponent, componentList } from './lib/@dwc/component.js';
let TestCmp = class TestCmp extends HTMLElement {
    constructor() {
        console.log('testt component constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this._id = Math.random().toString(36).substr(2, 9);
    }
    get uniqueId() {
        return this._id;
    }
    connectedCallback() {
        this.setAttribute('id', this.uniqueId);
        this.updateUI();
    }
    disconnectedCallback() {
        //Perform cleanup here
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue)
            this.updateUI();
    }
    updateUI() {
        let cmp = Object.keys(componentList).map((key) => {
            let props = Object.getOwnPropertyNames(componentList[key].classMetadata).map((p) => {
                return p;
            }).join(',');
            let methods = Object.getOwnPropertyNames(componentList[key].classMetadata.prototype).map((p) => {
                return p;
            }).join(',');
            return html `
                ${key}
                <div>
                    <strong>Properties:</strong>
                    ${props}
                </div>
                <div>
                    <strong>Methods:</strong>
                    ${methods}
                </div>`;
        });
        render(html `
                <style>
                    .container{
                        margin-top:5px;
                        margin-bottom:5px;
                       padding:10px;
                       border:1px solid black;
                    }
                    .info{
                        padding-bottom:10px;
                        min-height:30px;
                        background-color:lightGreen;
                    }
                    .action{
                        margin-top:10px;
                    }
                </style>
                <div class="container">
                    <div class="info">
                        ${cmp}
                    </div>
                    <div class="action">
                      <i> just a dummy component from other module</i>
                    </div>
                 
                    
                </div>`, this.root);
    }
};
TestCmp.is = "test-cmp";
TestCmp = __decorate([
    DiscorableWebComponent({
        name: 'TestCMP',
        description: 'Another component'
    })
], TestCmp);
customElements.define(TestCmp.is, TestCmp);
//# sourceMappingURL=test-cmp1.js.map