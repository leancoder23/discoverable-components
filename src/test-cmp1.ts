//import {html, render} from 'https://unpkg.com/lit-html?module';
import {html, render} from '../node_modules/lit-html/lit-html.js';
import{ DiscorableWebComponent, IDiscorableWebComponent,componentList} from './lib/@dwc/component.js';

@DiscorableWebComponent({
    name:'TestCMP',
    description:'Another component'
})
class TestCmp extends HTMLElement implements IDiscorableWebComponent {
    static is = "test-cmp";
    
    private root:ShadowRoot;
    
    private _id:string;
    constructor(){
        console.log('testt component constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
       
        this._id=Math.random().toString(36).substr(2, 9);
       
    }

    get uniqueId():string{
        return this._id;
    }
   
    connectedCallback(){
        this.setAttribute('id',this.uniqueId);
        this.updateUI();
    }

    disconnectedCallback() {
    //Perform cleanup here
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any){
        if(oldValue!==newValue)
            this.updateUI();
    }


    updateUI() {

       let cmp = Object.keys(componentList).map((key)=>{

            let props = Object.getOwnPropertyNames(componentList[key].classMetadata).map((p)=>{
                return p; 
            }).join(',');

            let methods =Object.getOwnPropertyNames(componentList[key].classMetadata.prototype).map((p)=>{
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


       render(html`
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
                 
                    
                </div>`,this.root);
    }

}


customElements.define(TestCmp.is, TestCmp);
