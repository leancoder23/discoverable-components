var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
//import {html, render} from 'https://unpkg.com/lit-html?module';
import { html, render } from '../node_modules/lit-html/lit-html.js';
import { DiscoverableWebComponent, Api } from './lib/@dwc/decorators.js';
let MyApp = class MyApp extends HTMLElement {
    constructor() {
        console.log('my app constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this._counter = 0;
        this._id = Math.random().toString(36).substr(2, 9);
    }
    static get observedAttributes() {
        return ['counter'];
    }
    get uniqueId() {
        return this._id;
    }
    get counter() {
        return this._counter;
    }
    set counter(val) {
        this._counter = val;
        this.setAttribute('counter', String(val));
    }
    connectedCallback() {
        this.setAttribute('id', this.uniqueId);
        console.log('my app component is loaded in the dom');
        this.updateUI();
    }
    disconnectedCallback() {
        //Perform cleanup here
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue)
            this.updateUI();
    }
    onClick(event) {
        this.counter++;
        // this.setState({ counter: this.state.counter + 1 });
    }
    onClose(event) {
        console.log(this.uniqueId);
        let node = document.getElementById(this.uniqueId);
        node === null || node === void 0 ? void 0 : node.remove();
        // this.setState({ counter: this.state.counter + 1 });
    }
    onInputChange(event) {
        this.counter = 0 + Number(event.target.value);
        //this.setState({ counter: parseInt(event.target.value) });
    }
    updateUI() {
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
                        background-color:#6cbcdc;
                    }
                    .action{
                        margin-top:10px;
                    }
                </style>
                <div class="container">
                    <div class="info">
                    <cmp-info></cmp-info>
                    </div>
                    <div class="action">
                        <input id="counterInput" .value="${String(this.counter)}" @change=${(event) => this.onInputChange(event)}/>
                        <strong>Counter:</strong>${this.counter}
                        <button @click=${(event) => this.onClick(event)}>Counter</button>
                        <button @click=${(event) => this.onClose(event)}>close</button>
                    </div>
                </div>`, this.root);
    }
};
MyApp.is = "my-app";
__decorate([
    Api({
        description: 'Counter value'
    }),
    __metadata("design:type", Number)
], MyApp.prototype, "_counter", void 0);
__decorate([
    Api(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], MyApp.prototype, "uniqueId", null);
__decorate([
    Api({
        description: 'Method called on input change'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MyApp.prototype, "onInputChange", null);
MyApp = __decorate([
    DiscoverableWebComponent({
        name: 'MyApp',
        description: 'Test Decorator'
    }),
    __metadata("design:paramtypes", [])
], MyApp);
export { MyApp };
customElements.define(MyApp.is, MyApp);
//# sourceMappingURL=app.js.map