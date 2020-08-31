import { 
    Discover
} from '../lib/@dwc/decorators.js';

import {
    Todo,
    TodoStatus
} from '../example/@types/todo.js';

@Discover.Component({
    name: 'Todo Data Broker',
    description: 'Data Broker for todo lists'
})
class TodoDataBroker extends HTMLElement {
    static is = "todo-data-broker";

    private _todoList:Todo[] = [];

    @Discover.Field({
        description:'Unique id of the rendered component'
    })
    get todoList():Todo[] {
        return this._todoList;
    }

    @Discover.Field({
        description:'Unique id of the rendered component'
    })
    get numberOfTodos():Number {
        return this._todoList.length;
    }

    @Discover.Method({
        description:'Fetch todo items from server'
    })
    fetchTodos () {
        this._todoList = [];

        // fake server fech
        this._todoList.push({
            id: Math.random().toString(36).substr(2, 9),
            title: 'my todo',
            status: TodoStatus.PENDING
        });

        return this._todoList;
    }

    @Discover.Method({
        description:'Add new todo item'
    })
    addTodoItem (title: string): Todo {
        const todo: Todo = {
            id: Math.random().toString(36).substr(2, 9),
            title: title,
            status: TodoStatus.PENDING
        };

        this._todoList.push(todo);
        
        return todo;
    }

    @Discover.Method({
        description:'Check todo item'
    })
    checkTodoItem (id: string): Todo | undefined {
        const foundTodo = this._todoList.find(todo => todo.id === id) || undefined;
        if (foundTodo) foundTodo.status = TodoStatus.DONE;
        
        return foundTodo;
    }

    @Discover.Method({
        description:'Uncheck todo item'
    })
    uncheckTodoItem (id: string): Todo | undefined {
        const foundTodo = this._todoList.find(todo => todo.id === id) || undefined;
        if (foundTodo) foundTodo.status = TodoStatus.PENDING;
        
        return foundTodo;
    }

    connectedCallback () {
        // do inital fetch on load
        this.fetchTodos()
    }

    disconnectedCallback () {

    }
}

customElements.define(TodoDataBroker.is, TodoDataBroker);