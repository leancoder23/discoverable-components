import Vue from 'vue';

import { 
    Discover,
    Renderer,
    Bind,
    subscribeComponentTraceLog
} from '@dwc/core';

import VueComponent from './app.vue';

@Discover.Component({
    name: 'Vue Todo List UI',
    description: 'Displays available todo items'
})
class TodoListUI extends HTMLElement {
    static is = "todo-list-ui-vue";

    private root:ShadowRoot;
    private wrapper:Vue;

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

        this.wrapper = new Vue({
            name: 'shadow-root',
            data () {
                return {
                    props: {},
                    slotChildren: []
                }
            },
            render (h) {
              return h(VueComponent, {
                ref: 'inner'
              })
            }
        });
    }

    connectedCallback () {
        subscribeComponentTraceLog(this.handlePropertyUpdate.bind(this));

        const wrapper = this.wrapper;

        wrapper.$mount();
        console.log(wrapper.$el);
        this.shadowRoot?.appendChild(wrapper.$el);
    }

    disconnectedCallback () {

    }

    handlePropertyUpdate():void {
        this.updateUI();
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any){
        this.updateUI();
    }

    @Renderer
    updateUI() {
        
    }
}

customElements.define(TodoListUI.is, TodoListUI);