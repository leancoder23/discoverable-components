
import {html, render} from '../node_modules/lit-html/lit-html.js';
import {getAllAvailableComponentInfo,
    addComponentRegistoryUpdateEventListner,
    removeComponentRegistoryUpdateEventListner,
    getAvailableMethods,
    getAvailableProperties
    
 } from './lib/@dwc/component-manager.js';


class ComponentInfo extends HTMLElement {
    static is = "cmp-info";
    private root:ShadowRoot;
 
    constructor(){
        super();
        console.log('cmp is loaded ')
        this.root = this.attachShadow({ mode: 'open' });    
    }

    handleComponentRegistoryUpdate():void{
        this.updateUI();
    }

    connectedCallback(){
        addComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate.bind(this));
        this.updateUI();
    }   
    disconnectedCallback(){
        removeComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate);
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
                    .section {
                        border-bottom:1px solid black;
                    }
                </style>
                <div>   
                    ${cmp} 
                </div>`,this.root);
    }

}


customElements.define(ComponentInfo.is, ComponentInfo);
