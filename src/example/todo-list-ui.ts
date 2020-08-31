import { html, render } from '../../node_modules/lit-html/lit-html.js';

import { 
    Discover
} from '../lib/@dwc/decorators.js';

import {
    subscribePropertyChange,
    subscribeComponentTraceLog
} from '../lib/@dwc/component-manager.js';

import {
    Todo,
    TodoStatus
} from '../example/@types/todo.js';

@Discover.Component({
    name: 'Todo List UI',
    description: 'Displays available todo items'
})
class TodoListUI extends HTMLElement {
    static is = "todo-list-ui";

    private root:ShadowRoot;
    private _todoList:Todo[] = [];

    @Discover.Field({
        description:'Title of todo list'
    })
    listTitle:String = '';

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.listTitle  = 'My Todo List';
    }

    connectedCallback () {
        //subscribePropertyChange(this._id, this.handlePropertyUpdate.bind(this));
        subscribeComponentTraceLog(this.handlePropertyUpdate.bind(this));

        this.updateUI();
    }

    disconnectedCallback () {

    }

    handlePropertyUpdate():void {
        this.updateUI();
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any){
        this.updateUI();
    }

    updateUI() {
        const renderedItems = this._todoList.map((item: Todo) => {
            return html`
                <li>${item.title}</li>
            `;
        });

        render(
            html`
                <style>
                </style>
                <div class="todo-list">
                    <div class="title">${this.listTitle}</div>
                    <ul class="">
                        ${renderedItems}
                    </ul>
                </div>
            `,
        this.root);
     }
}

customElements.define(TodoListUI.is, TodoListUI);