export enum LogLevel {
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal'
}

interface IOptions {
    logLevel: LogLevel
    showConsoleColors?: boolean
    debugPrefix?: string
}

export default class Logger {
    private options: IOptions;

    private defaultOptions: IOptions = {
        logLevel: LogLevel.WARN,
        showConsoleColors: true,
        debugPrefix: undefined
    };

    private logLevelColors: object = {
        debug: '#0076ff',
        info: '#44ea00',
        warn: '#ff9f00',
        error: '#d92800',
        fatal: '#d92800'
    };

    private logLevelOrder: Array<LogLevel> = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.FATAL];

    constructor (options?: IOptions) {
        this.options = options ? {...this.defaultOptions, ...options} : this.defaultOptions;
    }

    private printLn (logLevel: LogLevel | null = null, logLevelPrefix: string | undefined = undefined, formattedArguments: any = false, showConsoleColors: boolean = false) {
        if (showConsoleColors && (logLevel === LogLevel.INFO || logLevel === LogLevel.WARN || logLevel === LogLevel.ERROR || logLevel === LogLevel.FATAL)) {
            /*eslint no-console: "off"*/
            console[logLevel === LogLevel.FATAL ? LogLevel.ERROR : logLevel](`%c${logLevelPrefix}`, `color: ${this.logLevelColors[logLevel]}`, ...formattedArguments);
        } else {
            /*eslint no-console: "off"*/
            console.log(`%c${logLevelPrefix}`, 'color: #07F', ...formattedArguments);
        }
    }

    private conditionalPrintLn (logLevel: LogLevel, ...args: Array<String | object>) {
        if (this.logLevelOrder.indexOf(logLevel) >= this.logLevelOrder.indexOf(this.options.logLevel)) {
            const prefix = logLevel === LogLevel.DEBUG && this.options.debugPrefix ? `${logLevel} [${this.options.debugPrefix}] ::` : `${logLevel} ::`;
            this.printLn(logLevel, prefix, args, this.options.showConsoleColors);
        }
    }

    public debug = (...args: Array<String | object>) => {
        this.conditionalPrintLn(LogLevel.DEBUG, ...args);
    }

    public info = (...args: Array<String | object>) => {
        this.conditionalPrintLn(LogLevel.INFO, ...args);
    }

    public warn = (...args: Array<String | object>) => {
        this.conditionalPrintLn(LogLevel.WARN, ...args);
    }

    public error = (...args: Array<String | object>) => {
        this.conditionalPrintLn(LogLevel.ERROR, ...args);
    }

    public fatal = (...args: Array<String | object>) => {
        this.conditionalPrintLn(LogLevel.FATAL, ...args);
    }
}