import { TraceLogType } from './trace-log';

export interface PropertyTraceLogPayload {
    property: string,
    value: any
}

export interface MethodTraceLogPayload {
    methodName: string,
    args: any[],
    result: any
}

export interface TraceLog {
    date: Date,
    type: TraceLogType,
    sourceId?: string, // should become mandatory
    targetId: string,
    payload: PropertyTraceLogPayload | MethodTraceLogPayload
}