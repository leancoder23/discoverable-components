import {IComponentRegistory} from './@types/interfaces';

declare const window: any; // TODO could be solved better
export class DwcStore {
     componentRegistory:IComponentRegistory = {};

     //unique keys used by discoverable web component
     propertyMetadataKey:symbol = Symbol('properties');
     methodMetadataKey:symbol = Symbol('methods');
     uniqueIdSymbol:symbol = Symbol("uniqueId");
     subscriptionSymbol:symbol = Symbol("subscriptions");
     renderMetadataKey:symbol = Symbol("renderer");
     componentMetadataKey:symbol = Symbol("componentMetadata");

    static getInstance():DwcStore{
        if (window?.dwcStore) {
            return window.dwcStore;
        } else if (window) {
            let storeInstance =  new DwcStore();
            Object.freeze(storeInstance); //Important: prevent further modification of the instance
            window.dwcStore = storeInstance;
            return  storeInstance;
        }
        else{
           throw new Error('Discoverable component store could not be instantiated as global window object is not available');
        }
    }
}