//import {html, render} from 'https://unpkg.com/lit-html?module';
import {html, render} from '../node_modules/lit-html/lit-html.js';

import{ 
    DiscoverableWebComponent, 
    IDiscoverableWebComponent,
    Api,
    Renderer
} from './lib/@dwc/decorators.js';

@DiscoverableWebComponent({
    name:'MyApp',
    description:'Test Decorator' 
})
export class MyApp extends HTMLElement implements IDiscoverableWebComponent {

    static is = "my-app";
    static get observedAttributes() {
        return ['counter'];
    }
    private root:ShadowRoot;
    private _counter:number;
    private _id:string;
    constructor(){
        console.log('my app constructor is called');
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this._counter=0;
        this._id=Math.random().toString(36).substr(2, 9);
       
    }

    @Api()
    get uniqueId():string{
        return this._id;
    }
   
    @Api({
        description:'Counter value'
    }) 
    get counter():number{
        return this._counter;
    }
    
    set counter(val:number){
       
        this._counter = val;
        this.setAttribute('counter',String(val));
       
    }

    connectedCallback(){    
        console.log('[app] my app component is loaded in the dom');

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

    onClick(event:any) {
        this.counter++;
       // this.setState({ counter: this.state.counter + 1 });
    }

    onClose(event:any) {
        console.log(this.uniqueId);
      let node:HTMLElement|null = document.getElementById(this.uniqueId);
      
      node?.remove();
       // this.setState({ counter: this.state.counter + 1 });
    }
    @Api({
        description:'Method called on input change'
    }) 
    onInputChange(event:any){  
        
        this.counter = 0 + Number(event.target.value);
        //this.setState({ counter: parseInt(event.target.value) });
    }

    @Renderer
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
                        background-color:#6cbcdc;
                    }
                    .action{
                        margin-top:10px;
                    }
                </style>
                <div class="container">

                    <div class="action">
                        <input id="counterInput" .value="${String(this.counter)}" @change=${(event:any)=>this.onInputChange(event)}/>
                        <strong>Counter:</strong>${this.counter}
                        <button @click=${(event:any)=>this.onClick(event)}>Counter</button>
                        <button @click=${(event:any)=>this.onClose(event)}>close</button>
                    </div>
                </div>`,this.root);
    }

}


customElements.define(MyApp.is, MyApp);
