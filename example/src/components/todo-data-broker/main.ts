import { Discover, 
    Renderer,
    OnConnected,
    OnDisconnected,
} from '@dwc/core';

import { TodoStatus } from '../../@types/todo';

@Discover.Component({
    name: 'TodoDataBroker',
    description: 'Data Broker for todo lists'
})
class TodoDataBroker extends HTMLElement {
    static is = "todo-data-broker";

    private _todoList: Todo[] = [];

    @Discover.Field({
        description:'List of todo items'
    })
    get todoList(): Todo[] {
        return this._todoList;
    }

    set todoList(todoList: Todo[]) {
        this._todoList = todoList;
    }

    @Discover.Field({
        description: "test"
    })
    testProp:string;

    @Discover.Field({
        description:'Unique id of the rendered component'
    })
    get numberOfTodos():Number {
        return this.todoList.length;
    }

    constructor () {
        super();
        this.testProp = "Test Value"
    }

    @Discover.Method({
        description:'Fetch todo items from server'
    })
    fetchTodos () {
        console.log('[fetchTodos] triggered');

        // fake server fech
        this.todoList = [{
            id: Math.random().toString(36).substr(2, 9),
            title: 'my todo',
            status: TodoStatus.PENDING
        }];

        return this.todoList;
    }

    @Discover.Method({
        description:'Add new todo item'
    })
    addTodoItem (title: string = 'default'): Todo {
        const todo: Todo = {
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            status: TodoStatus.PENDING
        };

        this.todoList = [...this._todoList, todo];
        
        return todo;
    }

    @Discover.Method({
        description:'Check todo item'
    })
    checkTodoItem (id: string): Todo | undefined {
        const foundTodo = this.todoList.find(todo => todo.id === id) || undefined;
        if (foundTodo) foundTodo.status = TodoStatus.DONE;
        
        return foundTodo;
    }

    @Discover.Method({
        description:'Uncheck todo item'
    })
    uncheckTodoItem (id: string): Todo | undefined {
        const foundTodo = this.todoList.find(todo => todo.id === id) || undefined;
        if (foundTodo) foundTodo.status = TodoStatus.PENDING;
        
        return foundTodo;
    }

    @Renderer
    updateUI() {

    }

    @OnConnected
    connectedCallback () {
        // do inital fetch on load
        this.fetchTodos()
    }

    @OnDisconnected
    disconnectedCallback () {

    }
}

customElements.define(TodoDataBroker.is, TodoDataBroker);