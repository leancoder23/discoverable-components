import Vue from 'vue';
import wrap from '@vue/web-component-wrapper';

import { 
    Discover,
    Renderer,
    Bind,
    subscribeComponentTraceLog,
    invokeMethod,
    getAllAvailableComponentInfo
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
        description:'Name of the Company'
    })
    company:String = '';

    @Discover.Field({
        description:'todoBrokerDataID'
    })
    todoBrokerDataID:string = '';

    constructor() {
        super();
        this.root = this.attachShadow({ mode: 'open' });
        this.todoBrokerDataID = getAllAvailableComponentInfo()[0].identifier;
        this.company  = 'Deloitte Digital';
        this._todoList = [];
        const self = this;
        this.wrapper = new Vue({
            name: 'shadow-root',
            data () {
                return {
                    props: {
                        company: self.company,
                        todoList: self._todoList
                    },
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
        this.company = wrapper.$data.props.company;
        wrapper.$refs.inner['content'] = this.company;
        wrapper.$refs.inner['list'] = this._todoList;
        this.shadowRoot?.appendChild(wrapper.$el);
    }

    disconnectedCallback () {

    }
    @Discover.Method({
        description:'Trigger addTodoItem from data broker'
    })
    triggerAddTodoItem () {
        invokeMethod(this.todoBrokerDataID, 'addTodoItem')
    }

    handlePropertyUpdate():void {
        this.updateUI();
    }

    attributeChangedCallback(name:string, oldValue:any, newValue:any){
        this.updateUI();
    }

    @Renderer
    updateUI() {
        this.wrapper.$refs.inner['content'] = this.company;
        this.wrapper.$refs.inner['list'] = this._todoList;
    }
}

customElements.define(TodoListUI.is, TodoListUI);