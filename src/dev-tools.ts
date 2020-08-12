
import {html, render, directive} from '../node_modules/lit-html/lit-html.js';
import {
    getAllAvailableComponentInfo,
    addComponentRegistoryUpdateEventListner,
    removeComponentRegistoryUpdateEventListner,
    getAvailableMethods,
    getAvailableProperties
} from './lib/@dwc/component-manager.js';


interface IDiscoveredComponentProperty {
    name: string
    description: string
}

interface IDiscoveredComponentMethod {
    name: string
    description: string
}

interface IDiscoveredComponent {
    id: string
    name: string
    description: string
    props: Array<IDiscoveredComponentProperty>
    methods: Array<IDiscoveredComponentMethod>
    instance: any
}scrollY

class DwcDevTools extends HTMLElement {
    static is = "dwc-dev-tools";
    private root:ShadowRoot;

    private _visible:boolean = true;
    private _showDwcGuide = false;
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

        window.addEventListener("devtools:component-selection", (event: Event) => {
            if (this._showDwcGuide) {
                this.selectComponent((event as CustomEvent).detail?.identifier);
            }
        });

        window.addEventListener('resize', this.updateUI.bind(this));

        this.updateUI();
    }   

    /**
     * Standard Webcomponent lifecycle hook
     */
    disconnectedCallback () {
        removeComponentRegistoryUpdateEventListner(this.handleComponentRegistoryUpdate);

        window.removeEventListener('resize', this.updateUI.bind(this));
    }

    handleComponentRegistoryUpdate():void {
        this.updateUI();
    }

    toggleTools():void {
        this._visible = !this._visible;
        this.updateUI();
    }

    toggleDwcGuide():void {
        this._showDwcGuide = !this._showDwcGuide;

        this.updateUI();
    }

    selectComponent(id:string):void {
        this._selectedComponentId = id;

        this.updateUI();
    }

    updatePropertyValue(comp: IDiscoveredComponent, propertyName: string, value: string):void {
        console.log(`[dev tools] update property "${propertyName}" to new value "${value}" on component "${comp.name}"`);
    }

    executeFunction(comp: IDiscoveredComponent, methodName: string):void {
        console.log(`[dev tools] execute method "${methodName}" on component "${comp.name}"`);
    }

    private getDiscoveredComponents():Array<IDiscoveredComponent> {
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

    getSelectedComponent():IDiscoveredComponent | undefined {
        if (!this._selectedComponentId) {
            return undefined;
        }

        return this.getDiscoveredComponents().find((comp) => comp.id === this._selectedComponentId);
    }

    private getRenderedDwcGuide (label: string | undefined) {
        const DISTANCE = 10; // how many px should the guide be larger than the covered element?
        const dwcGuideBoundedClientRect = document.querySelectorAll(`[dwc-id="${this._selectedComponentId}"]`)[0]?.getBoundingClientRect();

        if (!dwcGuideBoundedClientRect) {
            return null;
        }

        const distanceTop = function () {
            if (dwcGuideBoundedClientRect.top - DISTANCE >= 0) {
                return DISTANCE;
            } else {
                return DISTANCE - (dwcGuideBoundedClientRect.top - DISTANCE) * (-1);
            }
        }();

        const distanceBottom = function () {
            if (dwcGuideBoundedClientRect.height + DISTANCE <= dwcGuideBoundedClientRect.bottom) {
                return DISTANCE;
            } else {
                return DISTANCE - (dwcGuideBoundedClientRect.bottom - dwcGuideBoundedClientRect.height - DISTANCE) * (-1);
            }
        }();

        const distanceLeft = function () {
            if (dwcGuideBoundedClientRect.left - DISTANCE >= 0) {
                return DISTANCE;
            } else {
                return DISTANCE - (dwcGuideBoundedClientRect.left - DISTANCE) * (-1);
            }
        }();

        const distanceRight = function () {
            if (dwcGuideBoundedClientRect.width + DISTANCE <= dwcGuideBoundedClientRect.right) {
                return DISTANCE;
            } else {
                return DISTANCE - (dwcGuideBoundedClientRect.right - dwcGuideBoundedClientRect.width - DISTANCE) * (-1) ;
            }
        }();
        
        const top = dwcGuideBoundedClientRect.top - distanceTop;
        const height = dwcGuideBoundedClientRect.height + distanceTop + distanceBottom;
        const left = dwcGuideBoundedClientRect.left - distanceLeft;
        const width = dwcGuideBoundedClientRect.width + distanceLeft + distanceRight;
        
        //console.log(`distanceLeft: ${distanceLeft}, distanceRight: ${distanceRight}, distanceTop: ${distanceLeft}, distanceBottom: ${distanceRight}, top: ${top}, left: ${left}, width: ${width}, height: ${height}`);

        if (this._showDwcGuide) {
            return html`
                <style>
                    .dwc-guide {
                        box-sizing: border-box;
                        pointer-events: none;
                        border: 2px solid #F21879;
                        border-radius: 8px;
                        position: absolute;
                        top: 0; 
                        left: 0; 
                        right: auto; 
                        bottom: auto;
                    }

                    .dwc-guide-label {
                        position: absolute;
                        top: 2px;
                        left: 8px;
                        font-family: sans-serif;
                        font-size: 13px;
                        padding: 2px 5px;
                        background: #F21879;
                        border-radius: 4px;
                        color: white;
                        letter-spacing: 0.5px;
                    }
                </style>
                <div class="dwc-guide" style="width: ${width}px; height: ${height}px; transform: translate(${left}px, ${top}px);">
                    <div class="dwc-guide-label">${label}</div>
                </div>
            `;
        }

        return html``;
    }

    private getRenderedToolbar () {
        return html`
            <style>
                .dev-tools-toolbar {
                    display: flex;
                    align-items: center;
                    box-sizing: border-box;
                    border-bottom: 2px solid #F2F5FA;
                    text-align: left;
                    padding: 5px 10px;
                    height: 35px;
                }

                .dev-tools-toolbar > .dwc-guide-btn {
                    cursor: default;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-sizing: border-box;
                }

                .dev-tools-toolbar > .dwc-guide-btn > .close-icon {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 469.333 469.333' width='512' height='512'%3E%3Cpath d='M234.667 170.667c-35.307 0-64 28.693-64 64s28.693 64 64 64 64-28.693 64-64-28.694-64-64-64z' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%23F21879'/%3E%3Cpath d='M234.667 74.667C128 74.667 36.907 141.013 0 234.667c36.907 93.653 128 160 234.667 160 106.773 0 197.76-66.347 234.667-160-36.907-93.654-127.894-160-234.667-160zm0 266.666c-58.88 0-106.667-47.787-106.667-106.667S175.787 128 234.667 128s106.667 47.787 106.667 106.667-47.787 106.666-106.667 106.666z' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%23F21879'/%3E%3C/svg%3E");
                    background-size: contain;
                }

                .dev-tools-toolbar > .dwc-guide-btn > .open-icon {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 469.44 469.44' width='512' height='512'%3E%3Cpath d='M231.147 160.373l67.2 67.2.32-3.52c0-35.307-28.693-64-64-64l-3.52.32z' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%23E3E9ED'/%3E%3Cpath d='M234.667 117.387c58.88 0 106.667 47.787 106.667 106.667 0 13.76-2.773 26.88-7.573 38.933l62.4 62.4c32.213-26.88 57.6-61.653 73.28-101.333-37.013-93.653-128-160-234.773-160-29.867 0-58.453 5.333-85.013 14.933l46.08 45.973c12.052-4.693 25.172-7.573 38.932-7.573zM21.333 59.253l48.64 48.64 9.707 9.707C44.48 145.12 16.64 181.707 0 224.053c36.907 93.653 128 160 234.667 160 33.067 0 64.64-6.4 93.547-18.027l9.067 9.067 62.187 62.293 27.2-27.093L48.533 32.053l-27.2 27.2zM139.307 177.12l32.96 32.96c-.96 4.587-1.6 9.173-1.6 13.973 0 35.307 28.693 64 64 64 4.8 0 9.387-.64 13.867-1.6l32.96 32.96c-14.187 7.04-29.973 11.307-46.827 11.307-58.88 0-106.667-47.787-106.667-106.667 0-16.853 4.267-32.64 11.307-46.933z' data-original='%23000000' class='active-path' data-old_color='%23000000' fill='%23E0E0E0'/%3E%3C/svg%3E");
                    background-size: contain;
                }
            </style>

            <div class="dev-tools-toolbar">
                <a class="dwc-guide-btn" href="#" @click=${()=>this.toggleDwcGuide()}><div class="${this._showDwcGuide ? 'close-icon' : 'open-icon'}"></div></a>
            </div>
        `;
    }

    private getStyles () {
        return html`
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
        `;
    }

    updateUI() {
        console.log('[dev tools] update UI');

        const componentList:Array<IDiscoveredComponent> = this.getDiscoveredComponents();

        // select first component if available
        if (!this.getSelectedComponent() && componentList.length > 0) {
            this.selectComponent(componentList[0].id);
        }

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
            ${this.getStyles()}

            ${this.getRenderedDwcGuide(this.getSelectedComponent()?.name)}

            <div class="${this._visible ? 'dev-tools-outer' : 'dev-tools-outer closed'}">
                <a class="dev-tools-floating-btn" href="#" @click=${()=>this.toggleTools()}><div class="${this._visible ? 'close-icon' : 'open-icon'}"></div></a>
                
                ${this.getRenderedToolbar()}

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
