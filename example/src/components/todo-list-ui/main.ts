import { html, render } from 'lit-html';

import { 
    Discover,
    Renderer,
    Bind,
    subscribeComponentTraceLog
} from '@dwc/core';

@Discover.Component({
    name: 'Todo List UI',
    description: 'Displays available todo items'
})
class TodoListUI extends HTMLElement {
    static is = "todo-list-ui";

    private root:ShadowRoot;

    @Bind({
        sourceComponentName:"TodoDataBroker",
        sourceComponentPropertyName:"todoList"
    })
    private _todoList:Todo[];

    @Discover.Field({
        description:'Title of todo list'
    })
    listTitle:String = '';

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.listTitle  = 'My Todo List';
        this._todoList = [];
    }
    connectedCallback () {
        //subscribePropertyChange(this._id, this.handlePropertyUpdate.bind(this));
        subscribeComponentTraceLog(this.handlePropertyUpdate.bind(this));

        this.updateUI();
    }

    handlePropertyUpdate():void {
        this.updateUI();
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any){
        this.updateUI();
    }

    @Renderer
    updateUI() {
        console.log(this._todoList);

        
        const renderedItems = this._todoList.map((item: Todo) => {
            return html`
                <li>
                    <div>${item.status} - ${item.title}</div>
                </li>
            `;
        });

        render(
            html`
                <style>
                    .todo-list {
                        font-family: sans-serif;
                    }
                </style>
                <div class="todo-list">
                    <h2 class="title">${this.listTitle}</h2>
                    <ul class="">
                        
                        <div>${renderedItems}</div>
                    </ul>
                </div>
            `,
        this.root);
    
    }
}

customElements.define(TodoListUI.is, TodoListUI);