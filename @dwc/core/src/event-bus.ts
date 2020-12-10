import Logger, { LogLevel } from './utils/logger';
const logger = new Logger({
    logLevel: LogLevel.DEBUG,
    debugPrefix: 'event bus'
});

type EventReceiver = {
    callback:Function
}

interface IListener{
    [key:string]:Array<EventReceiver>
}

 class EventBusClass {
    private listeners:IListener;
    constructor(){
        this.listeners={};
    }
    private _registerListener(topic:string, callback:Function) {

        let listeners = this.listeners[topic] || [];
        //Add specific listner only once
        if(listeners.findIndex((listner)=>listner.callback==callback)===-1){
          listeners.push({
            callback: callback
          });
        }
        this.listeners[topic] = listeners;
    }

    /**
       * Attach a callback to an event
       * @param {string} topic - name of the event.
       * @param {function} callback - callback executed when this event is triggered
       */
      subscribe(topic: string, callback: Function): void {
        this._registerListener(topic, callback);
      }

      /**
       * Kill an event with all it's callbacks
       * @param {string} topic - name of the event.
       */
      unsubscribe(topic: string,callback?: Function): void {

        if(Reflect.has(this.listeners,topic)){
            if(!callback){
                //remove all listner for a specific topic
                Reflect.deleteProperty(this.listeners,topic);
                
            }else{
                this.listeners[topic] = this.listeners[topic].filter((e)=>e.callback==callback);
            }
        }
      }

      private getTopicReceivers(topic:string):Array<EventReceiver>{
        return this.listeners[topic]||[];
      }

      /**
       * Emit the event
       * @param {string} topic - name of the event.
       */
      async emit(topic:string,...args:any[]) {
        logger.debug('emit:', topic);
        const receivers = this.getTopicReceivers(topic);
        // Run promises
        receivers.map(
        receiver => new Promise((resolve) =>{
            resolve(receiver.callback.apply(this,args));
        }));
    }
  }

  export const EventBus = new EventBusClass();
