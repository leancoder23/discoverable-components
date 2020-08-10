
import {html, render, directive} from '../node_modules/lit-html/lit-html.js';
import {
    getAllAvailableComponentInfo,
    addComponentRegistoryUpdateEventListner,
    removeComponentRegistoryUpdateEventListner,
    getAvailableMethods,
    getAvailableProperties
} from './lib/@dwc/component-manager.js';


interface DiscoveredComponentProperty {
    name: string
    description: string
}

interface DiscoveredComponentMethod {
    name: string
    description: string
}

interface DiscoveredComponent {
    id: string
    name: string
    description: string
    props: Array<DiscoveredComponentProperty>
    methods: Array<DiscoveredComponentMethod>
    instance: any
}scrollY

class DwcDevTools extends HTMLElement {
    static is = "dwc-dev-tools";
    private root:ShadowRoot;

    private _visible:boolean = true;
    private _selectedComponentId:string | undefined = undefined;
 
    constructor(){
        super();
        this.root = this.attachShadow({ mode: 'open' });    
    }

    /**
     * Standard Webcomponent lifecycle hook
     */
    connectedCallback () {
        addComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate.bind(this));
        this.updateUI();
    }   

    /**
     * Standard Webcomponent lifecycle hook
     */
    disconnectedCallback () {
        removeComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate);
    }

    handleComponentRegistoryUpdate():void {
        this.updateUI();
    }

    toggleTools():void {
        this._visible = !this._visible;
        this.updateUI();
    }

    selectComponent(id:string):void {
        this._selectedComponentId = id !== this._selectedComponentId ? id : undefined;
        this.updateUI();
    }

    updatePropertyValue(comp: DiscoveredComponent, propertyName: string, value: string):void {
        console.log(`update property "${propertyName}" to new value "${value}" on component "${comp.name}"`);
    }

    executeFunction(comp: DiscoveredComponent, methodName: string):void {
        console.log(`execute method "${methodName}" on component "${comp.name}"`);
    }

    private getDiscoveredComponents():Array<DiscoveredComponent> {
        let availableComponents = getAllAvailableComponentInfo();
        
        return availableComponents.map((component:any) => {
            return {
                id: component.identifier,
                name: component.classMetadata.name,
                description: component.classMetadata.description,
                props: getAvailableProperties(component.classMetadata.type),
                methods: getAvailableMethods(component.classMetadata.type),
                instance: component.instance
            }
        });
    }

    updateUI() {
        const componentList:Array<DiscoveredComponent> = this.getDiscoveredComponents();

        const renderedComponentList = componentList.map((comp)=>{
            return html `
                <li class="comp-list-item ${this._selectedComponentId === comp.id ? 'selected' : ''}" @click=${()=>this.selectComponent(comp.id)}>
                    <div class="name">${comp.name}</div>
                    <div class="description"><small>${comp.description}</small></div>
                </li>
            `;
        });

        const foundComponent = componentList.find(comp => comp.id === this._selectedComponentId);
        const renderedPropsList = foundComponent?.props?.map((prop) => {
            return html`
                <li>
                    <label>${prop.name}:</label>
                    <input type="text" .value=${foundComponent.instance[prop.name] || ''} @keydown=${(event: KeyboardEvent) => { if (event.keyCode === 13) { this.updatePropertyValue(foundComponent, prop.name, (event.target as HTMLInputElement).value); (event.currentTarget as HTMLElement).blur(); }}}>
                    <div class="description">${prop.description}</div>
                </li>
            `;
        });

        let renderedMethodList = foundComponent?.methods?.map((method) => {
            return html`
                <li>
                    <span class="name">${method.name}()</span><button class="trigger-func-btn" @click=${() => this.executeFunction(foundComponent, method.name)}>call</button>
                    <div class="description">${method.description}</div>
                </li>
            `;
        });

        render(html`
            <style>
                .dev-tools-outer {
                    --primary-color: #4E38F2;
                    --dev-tools-height: 300px;

                    box-sizing: border-box;
                    background: #FFF;
                    position: fixed;
                    bottom: 0;
                    margin-bottom: 0;
                    left: 0;
                    width: 100%;
                    height: var(--dev-tools-height);
                    z-index: 1000;
                    font-family: sans-serif;
                    -webkit-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
                    -moz-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
                    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);

                    transition: all 0.15s;
                }

                .dev-tools-outer.closed {
                    margin-bottom: calc(-1 * var(--dev-tools-height));
                    -webkit-box-shadow: none;
                    -moz-box-shadow: none;
                    box-shadow: none;
                }

                .dev-tools-outer.closed > .dev-tools-floating-btn {
                    top: -57px;
                }

                .dev-tools-toolbar {
                    box-sizing: border-box;
                    border-bottom: 2px solid #F2F5FA;
                    text-align: right;
                    padding: 5px 10px;
                    height: 35px;
                }

                .dev-tools-floating-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                    position: absolute;
                    background: #FFF;
                    border-radius: 100%;
                    height: 50px;
                    width: 50px;
                    right: 10px;
                    top: -7px;
                    -webkit-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
                    -moz-box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
                    box-shadow: 0px 0px 10px 0px rgba(0,0,0,0.1);
                }

                .dev-tools-floating-btn > .close-icon {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' height='512' viewBox='0 0 329.2693 329' width='512'%3E%3Cpath d='M194.8008 164.7695l128.211-128.2148c8.3437-8.3399 8.3437-21.8242 0-30.164-8.34-8.34-21.8243-8.34-30.1641 0L164.6328 134.6054 36.4218 6.3906c-8.3437-8.3398-21.8241-8.3398-30.164 0-8.3437 8.3399-8.3437 21.8242 0 30.164l128.211 128.215L6.2577 292.9843c-8.3437 8.3398-8.3437 21.8242 0 30.164 4.1563 4.1602 9.6211 6.25 15.082 6.25 5.461 0 10.922-2.0898 15.082-6.25l128.211-128.2148 128.2149 128.2148c4.1601 4.1602 9.621 6.25 15.082 6.25s10.9219-2.0898 15.082-6.25c8.3438-8.3398 8.3438-21.8242 0-30.164zm0 0' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%234E38F2'/%3E%3C/svg%3E");
                    background-size: contain;
                }

                .dev-tools-floating-btn > .open-icon {
                    display: inline-block;
                    width: 27px;
                    height: 27px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 343.5 343.5' width='512' height='512'%3E%3Cpath d='M322.05 161.8h-182.6c-5.5 0-10 4.5-10 10s4.5 10 10 10h182.6c5.5 0 10-4.5 10-10s-4.4-10-10-10zM57.95 125.3c-25.7 0-46.5 20.8-46.5 46.5s20.8 46.5 46.5 46.5 46.5-20.8 46.5-46.5-20.8-46.5-46.5-46.5zm0 73c-14.7 0-26.5-11.9-26.5-26.5 0-14.7 11.9-26.5 26.5-26.5s26.5 11.9 26.5 26.5-11.9 26.5-26.5 26.5zM322.05 36.8h-182.6c-5.5 0-10 4.5-10 10s4.5 10 10 10h182.6c5.5 0 10-4.5 10-10s-4.4-10-10-10zM57.95 0c-25.7 0-46.5 20.8-46.5 46.5S32.25 93 57.95 93s46.5-20.8 46.5-46.5c0-25.6-20.8-46.4-46.5-46.5zm0 73.1c-14.7 0-26.5-11.9-26.5-26.5s11.9-26.5 26.5-26.5c14.7 0 26.5 11.9 26.5 26.5s-11.9 26.5-26.5 26.5zM322.05 286.8h-182.6c-5.5 0-10 4.5-10 10s4.5 10 10 10h182.6c5.5 0 10-4.5 10-10s-4.4-10-10-10zM57.95 250.5c-25.7 0-46.5 20.8-46.5 46.5s20.8 46.5 46.5 46.5 46.5-20.8 46.5-46.5c0-25.6-20.8-46.5-46.5-46.5zm0 73.1c-14.7 0-26.5-11.9-26.5-26.5 0-14.7 11.9-26.5 26.5-26.5 14.7 0 26.5 11.9 26.5 26.5s-11.9 26.5-26.5 26.5z' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%234E38F2'/%3E%3C/svg%3E");
                    background-size: contain;
                }

                .dev-tools-inner {
                    box-sizing: border-box;
                    display: flex;
                    height: calc(100% - 35px);
                }

                .component-list {
                    flex: 1;
                    padding: 10px;
                    overflow-y: scroll;
                }

                .component-list > ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .component-list > ul > li {
                    box-sizing: border-box;
                    border-radius: 3px;
                    padding: 5px 10px;
                    border: 2px solid transparent;
                }

                .component-list > ul > li:hover {
                    cursor: pointer;
                    background: #fAfAfA;
                }

                .component-list > ul > li.selected {
                    border: 2px solid var(--primary-color);
                }

                .component-list .description {
                    color: #AAA;
                }

                .methods-props-list {
                    flex: 1;
                    border-left: 2px solid #f8f8f8;
                }

                .methods-props-list section {
                    background: #f8f8f8;
                    padding: 10px;
                    color: #333;
                    text-transform: uppercase;
                    font-size: 0.85em;
                    letter-spacing: 1px;
                }

                .props-list {
                    
                }

                .props-list, .methods-list {
                    padding-left: 10px;
                }

                .props-list > li, .methods-list > li {
                    list-style: none;
                    padding: 0 0 5px 0;
                }

                .props-list > li > input {
                    position: relative;
                    font-family: monospace;
                    font-size: 1.2em;
                    border: 1px solid transparent;
                    border-radius: 3px;
                    padding: 2px 2px;
                    background: transparent;
                }

                .props-list > li > label, .methods-list > li > .name {
                    font-family: monospace;
                    font-size: 1.2em;
                    color: var(--primary-color);
                }

                .props-list > li > input:hover {
                    border-color: #eee;
                }

                .props-list > li > input:focus {
                    outline: 0;
                    border-color: #ddd;
                }

                .props-list > li > .description, .methods-list > li > .description {
                    font-size: 0.8em;
                    font-family: sans-serif;
                    color: #AAA;
                }

                .methods-list .trigger-func-btn {
                    border: 1px solid var(--primary-color);
                    border-radius: 3px;
                    color: var(--primary-color);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                    background: none;
                    outline: 0;
                }

                .methods-list > li > .name {
                    margin-right: 10px;
                }

                .methods-list .trigger-func-btn:active {
                    color: white;
                    background: var(--primary-color);
                }
            </style>
            <div class="${this._visible ? 'dev-tools-outer' : 'dev-tools-outer closed'}">
                <a class="dev-tools-floating-btn" href="#" @click=${()=>this.toggleTools()}><div class="${this._visible ? 'close-icon' : 'open-icon'}"></div></a>
                <div class="dev-tools-toolbar"></div>
                <div class="dev-tools-inner">
                    <div class="component-list">
                        <ul>
                            ${renderedComponentList} 
                        </ul>
                    </div>
                    <div style="${!this._selectedComponentId ? 'display: none;' : ''}" class="methods-props-list">
                        <section>props</section>
                        <ul class="props-list">
                            ${renderedPropsList}
                        </ul>
                        <section>methods</section>
                        <ul class="methods-list">
                            ${renderedMethodList}
                        </ul>
                    </div>
                </div>
            </div>`,
            this.root);
    }

}


customElements.define(DwcDevTools.is, DwcDevTools);
