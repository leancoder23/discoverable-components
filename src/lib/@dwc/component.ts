
export type Constructor<T> = {
    // tslint:disable-next-line:no-any
    new (...args: any[]): T 
};

export interface IDiscorableWebComponent{
    readonly uniqueId:string;
    connectedCallback():void; //when component loaded in dom
    disconnectedCallback():void; //
    updateUI():void;

}

export const componentList:any = {};

interface IComponentDescriptor{
    id:string;
    instance:IDiscorableWebComponent;
    classMetadata:any;

}

function setComponentInfo(cmpDescriptor:IComponentDescriptor){
    if(!Reflect.has(componentList,cmpDescriptor.id))
        componentList[cmpDescriptor.id] = cmpDescriptor;
    
}
function removeComponentInfo(id:string){
    Reflect.deleteProperty(componentList,id);
}

function notifyComponentListUpdated(){
    const event = new CustomEvent('componentListUpdated');
    window.dispatchEvent(event);
}


interface IdwcClassMetadata{
    name:string;
    description:string;
}

export function DiscorableWebComponent(clsMetadata:IdwcClassMetadata) {
    return function (classOrDescriptor: Constructor<IDiscorableWebComponent>) {
        const newClass:any =  class extends classOrDescriptor {
            static classMetaData = clsMetadata;
        }

       let connectedCallbackMethod: PropertyDescriptor|undefined  = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'connectedCallback');
       if(connectedCallbackMethod) {
        classOrDescriptor.prototype.connectedCallback =function(){

          
           console.log('notifying others');

           this.newComponentEventHandler = (e:Event)=>{
            console.log("new component added");
            this.updateUI();
            
            console.log(componentList);
        }

            setComponentInfo({
                id:this.uniqueId,
                instance:this,
                classMetadata:classOrDescriptor
            });

           window.addEventListener("componentListUpdated",this.newComponentEventHandler)
           notifyComponentListUpdated();
         
           //bind to new component event


           connectedCallbackMethod?.value.apply(this);
        }
       }  
       
       let disconnectedCallbackMethod:PropertyDescriptor | undefined = Reflect.getOwnPropertyDescriptor(classOrDescriptor.prototype,'disconnectedCallback');
       console.log(disconnectedCallbackMethod);
       if(disconnectedCallbackMethod) {
        classOrDescriptor.prototype.disconnectedCallback =function(){
            
           console.log('cleaning up');
           //bind to new component event
           window.removeEventListener('componentListUpdated',this.newComponentEventHandler );
           removeComponentInfo(this.uniqueId);
           console.log(componentList);

           notifyComponentListUpdated();

           disconnectedCallbackMethod?.value.apply(this);
        }
       }
       
        ///window.customElements.define(tagName,newClass);
       
        return newClass

    }
}