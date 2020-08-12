
import {html, render} from '../node_modules/lit-html/lit-html.js';
import {getAllAvailableComponentInfo,
    subscribeComponentRegistoryUpdate,
    unsubscribeComponentRegistoryUpdate,
    getAvailableMethods,
    getAvailableProperties,
    subscribePropertyChange,
    unsubscribePropertyChange
    
 } from './lib/@dwc/component-manager.js';


class ComponentInfo extends HTMLElement {
    static is = "cmp-info";
    private root:ShadowRoot;

    private subscribedPropChange:any;
 
    constructor(){
        super();
        console.log('cmp is loaded ')
        this.root = this.attachShadow({ mode: 'open' });   
        this.subscribedPropChange={}; 
    }

    

    handleComponentRegistoryUpdate():void{
        this.updateUI();
    }

    handlePropertyChangeEvent(){
        console.log('Property Change');
        this.updateUI();
    }

    connectedCallback(){
        subscribeComponentRegistoryUpdate(this.handleComponentRegistoryUpdate.bind(this));
        this.updateUI();
    }   
    disconnectedCallback(){
        unsubscribeComponentRegistoryUpdate(this.handleComponentRegistoryUpdate);
    } 
    
    updateObjectValue(event:any,instance:any,property:string){
        console.log('updating object value ');
       let v =  Number(event.target.value);
       console.log(instance,property);
       instance[property]=v;
    }

    updateUI() {

      
      let componentList = getAllAvailableComponentInfo();


       let cmp = componentList.map((cmp)=>{
           if(!this.subscribedPropChange[cmp.identifier]){
               subscribePropertyChange(cmp.identifier,this.handlePropertyChangeEvent.bind(this));
               this.subscribedPropChange[cmp.identifier]=true;
               
           }
          console.log(cmp.identifier);
        
          console.log(cmp.instance.counter);


            let props = getAvailableProperties(cmp.classMetadata.type).map((p:any)=>{
                
                return html`<div>
                
                    <b>${p.name}:</b><input type="text" .value=${cmp.instance[p.name]||''} @change="${(event:any)=>this.updateObjectValue(event,cmp.instance,p.name)}" />
                </div>` ; 
            });
            
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
