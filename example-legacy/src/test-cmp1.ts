import { html, render } from '../node_modules/lit-html/lit-html.js';
import{ 
    Discover,
    DiscoverableWebComponent, 
    IDiscoverableWebComponent,
    Renderer,
    Bind,
    Api
} from './lib/decorators.js';


import './component-info.js';

@Discover.Component({
    name:'TestCMP',
    description:'Another component'
})
class TestCmp extends HTMLElement implements IDiscoverableWebComponent {
    static is = "test-cmp";
    
    private root:ShadowRoot;

     _id:string;  
     @Discover.Field({
        description:'Unique id of the rendered component'
    }) 
     testProp:string;

    constructor(){
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.testProp='initial test';  
        this._id=Math.random().toString(36).substr(2, 9);
       
       
    }

    @Bind({
        sourceComponentName:"MyApp",
        sourceComponentPropertyName:"counter"
    })
    myAppCounter:Number|undefined;
   
    @Discover.Field({
        description:'Unique id of the rendered component'
    })
    get uniqueId():string{
        return this._id;
    }

    @Bind({
        sourceComponentName:"MyApp",
        sourceComponentPropertyName:"todoList"
    })
    _todoList:any[]|undefined;
   
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
  
    @Discover.Method({
        description:'Update UI method'
    })
   
    performMagicStuff() {
        return {
            test: "fdsdf",
            object: {
                myProp: "fsf",
                myProp2: "fsf",
                myProp3: "fsf",
                myProp4: "fsf"
            },
            array: [1, 2, 3, 4, 5, 6, 7, 8, 9]
        };
    }

    @Renderer
    updateUI() {
        console.log('myapp todo list', this._todoList);
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
                      <i> just a dummy component from other module</i> <br/>
                      <b>MyApp counter value (design time binding): ${this.myAppCounter}</b><br/>

                      <b>MyApp no of todoList Item (design time binding): ${this._todoList?.length}</b><br/>
                     
                    </div>
                 
                    
                </div>`,this.root);
    }

}


customElements.define(TestCmp.is, TestCmp);
