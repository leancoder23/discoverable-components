enum TodoStatus {
    PENDING = 'PENDING',
    DONE = 'DONE',
}

interface Todo {
    id: string,
    title: string
    status: TodoStatus
}

export { Todo, TodoStatus }