
import {html, render, directive} from '../node_modules/lit-html/lit-html.js';
import {
    getAllAvailableComponentInfo,
    addComponentRegistoryUpdateEventListner,
    removeComponentRegistoryUpdateEventListner,
    getAvailableMethods,
    getAvailableProperties
 } from './lib/@dwc/component-manager.js';


class DwcDevTools extends HTMLElement {
    static is = "dwc-dev-tools";
    private root:ShadowRoot;

    private _visible:boolean = true;
 
    constructor(){
        super();
        this.root = this.attachShadow({ mode: 'open' });    
    }

    /**
     * Standard Webcomponent lifecycle hook
     */
    connectedCallback () {
        addComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate.bind(this));
        this.updateUI();
    }   

    /**
     * Standard Webcomponent lifecycle hook
     */
    disconnectedCallback () {
        removeComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate);
    }

    handleComponentRegistoryUpdate():void {
        this.updateUI();
    }

    toggleTools():void {
        this._visible = !this._visible;
        this.updateUI();
    }

    updateUI() {
      let componentList = getAllAvailableComponentInfo();
        

       let cmp = componentList.map((cmp)=>{
            let props = getAvailableProperties(cmp.classMetadata.type).map((p:any)=>{
                return p.name; 
            }).join(',');
            
            let methods =getAvailableMethods(cmp.classMetadata.type).map((m:any)=>{
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

       render(html`
            <style>
                .dev-tools-outer {
                    background: #FFF;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    width: 100%;
                    z-index: 1000;
                    box-sizing: border-box;
                }

                .dev-tools-outer.closed > .dev-tools-inner {
                    height: 0;
                    padding: 0 10px;
                }

                .dev-tools-toolbar {
                    border-top: 1px solid #DDE0E5;
                    border-bottom: 1px solid #DDE0E5;
                    text-align: right;
                    background: #F4F7FC;
                    padding: 5px 10px;
                }

                .dev-tools-inner {
                    padding: 10px;
                    height: 300px;
                    overflow-y: scroll;
                }
            </style>
            <div class="${this._visible ? 'dev-tools-outer' : 'dev-tools-outer closed'}">
                <div class="dev-tools-toolbar"><button @click=${()=>this.toggleTools()}>${this._visible ? 'hide' : 'show'}</button></div>
                <div class="dev-tools-inner">
                    ${cmp} 
                </div>
            </div>`,
            this.root);
    }

}


customElements.define(DwcDevTools.is, DwcDevTools);
