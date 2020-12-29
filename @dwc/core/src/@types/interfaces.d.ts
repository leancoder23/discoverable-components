interface PropertyTraceLogPayload {
    property: string,
    value: any
}

interface MethodTraceLogPayload {
    methodName: string,
    args: any[],
    result: any
}

interface TraceLog {
    date: Date,
    type: TraceLogType,
    sourceId?: string, // should become mandatory
    targetId: string,
    payload: PropertyTraceLogPayload | MethodTraceLogPayload
}