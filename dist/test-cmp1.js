var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { html, render } from '../node_modules/lit-html/lit-html.js';
import { DiscoverableWebComponent, Api } from './lib/@dwc/decorators.js';
import './component-info.js';
let TestCmp = class TestCmp extends HTMLElement {
    constructor() {
        console.log('testt component constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.testProp = '';
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
    performMagicStuff() {
        console.log('magic stuff');
        return 'magic response';
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
                        background-color:lightGreen;
                    }
                    .action{
                        margin-top:10px;
                    }
                    .section {
                        border-bottom:1px solid black;
                    }
                </style>
                <div class="container">
                    <div class="info">
                        <cmp-info></cmp-info>
                    </div>
                    <div class="action">
                      <i> just a dummy component from other module</i>
                    </div>
                 
                    
                </div>`, this.root);
    }
};
TestCmp.is = "test-cmp";
__decorate([
    Api({
        description: 'Unique id of the rendered component'
    }),
    __metadata("design:type", String)
], TestCmp.prototype, "testProp", void 0);
__decorate([
    Api({
        description: 'Unique id of the rendered component'
    }),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], TestCmp.prototype, "uniqueId", null);
__decorate([
    Api({
        description: 'Call me and see what happens'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TestCmp.prototype, "performMagicStuff", null);
TestCmp = __decorate([
    DiscoverableWebComponent({
        name: 'TestCMP',
        description: 'Another component'
    }),
    __metadata("design:paramtypes", [])
], TestCmp);
customElements.define(TestCmp.is, TestCmp);
//# sourceMappingURL=test-cmp1.js.map