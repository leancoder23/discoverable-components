import { html, render } from '../node_modules/lit-html/lit-html.js';
import{ 
    DiscoverableWebComponent, 
    IDiscoverableWebComponent,
    Api
} from './lib/@dwc/decorators.js';

import './component-info.js';


@DiscoverableWebComponent({
    name:'TestCMP',
    description:'Another component'
})
class TestCmp extends HTMLElement implements IDiscoverableWebComponent {
    static is = "test-cmp";
    
    private root:ShadowRoot;

     _id:string;  
     @Api({
        description:'Unique id of the rendered component'
    }) 
     testProp:string;
    constructor(){
        console.log('testt component constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.testProp='';  
        this._id=Math.random().toString(36).substr(2, 9);
       
    }
   
    @Api({
        description:'Unique id of the rendered component'
    })
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
  
    @Api({
        description:'Update UI method'
    })
    updateUI() {
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
                 
                    
                </div>`,this.root);
    }

}


customElements.define(TestCmp.is, TestCmp);
