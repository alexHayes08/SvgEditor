import * as d3 from "d3";

import { IDOMDrawable } from "../idom-drawable";
import { 
    isHTMLTemplateElement, 
    isHTMLScriptElement, 
    isHTMLElement 
} from "../../helpers/node-helper";

export interface ITab {
    disabled: boolean;
    tabName: string;
    tabBodyElement: Element;
    selected: boolean;
    iconUrl?: string;
}

export interface ITabTemplateData {

    /**
     * A reference to the element which will be cloned. If the element is a
     * <template> or <script> element then the contents of the element will be
     * cloned while any other element will in its entirety be cloned.
     */
    tabTemplate: Element;
    
    /**
     * After the tab template is cloned, this function will be called on that
     * element to update it with the info in tabData.
     */
    tabTemplateUpdate: (tabData: ITab, element: Element) => void;
}

export interface ITabsData {
    tabContainerClassName?: string;
    tabClassName?: string;
    activeTabClassName?: string;
    activeTabElementClassName?: string;
    inactiveTabClassName?: string;
    inactiveTabElementClassName?: string;
    disabledTabClassName?: string;
    disabledTabElementClassName?: string;
    tabTemplate?: ITabTemplateData;

    /**
     * An array of functions to be executed whenever the active tab changes.
     */
    onTabChanged?: Array<(oldTab: ITab, newTab: ITab) => void>;
}

export class Tabs implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly container: HTMLElement;
    private readonly emitter: d3.Dispatch<EventTarget>;
    private readonly tabs: ITab[];
    private readonly tabsContainer: HTMLElement;
    private readonly onTabChanged: Array<(oldTab: ITab, newTab: ITab) => void>;
    private readonly tabTemplate?: ITabTemplateData;

    tabContainerClassName: string;
    tabClassName: string;
    activeTabClassName: string;
    activeTabElementClassName: string;
    inactiveTabClassName: string;
    inactiveTabElementClassName: string;
    disabledTabClassName: string;
    disabledTabElementClassName: string;

    private activeTabIndex: number;

    //#endregion

    //#region Ctor

    public constructor(container: HTMLElement,
        tabs: ITab[], 
        data: ITabsData = {}) 
    {
        // Verify tabs has a length greater than one
        if (tabs.length == 0) {
            throw new Error("The argument 'tabs' must have a length greater than zero.");
        }

        let self = this;

        this.activeTabIndex = 0;
        this.container = container;
        this.emitter = d3.dispatch();
        this.onTabChanged = data.onTabChanged || [];
        this.tabs = tabs;
        this.tabTemplate = data.tabTemplate;

        // Set the activeTabIndex if any of the tabs are marked as selected.
        this.tabs.find((tab, index) => {
            if (tab.selected == true) {
                this.activeTabIndex = index;
                return true;
            } else {
                return false;
            }
        });

        this.activeTabClassName = data.activeTabClassName 
            || "active-tab-header";
        this.activeTabElementClassName = data.activeTabElementClassName
            || "active-tab";
        this.inactiveTabClassName = data.inactiveTabClassName 
            || "inactive-tab-header";
        this.inactiveTabElementClassName = data.inactiveTabElementClassName
            || "inactive-tab";
        this.disabledTabClassName = data.disabledTabClassName
            || "disabled-tab-header";
        this.disabledTabElementClassName = data.disabledTabElementClassName
            || "disabled-tab";
        this.tabClassName = data.tabClassName 
            || "tab-header";
        this.tabContainerClassName = data.tabContainerClassName 
            || "tabs-header-container";

        // Create element
        this.tabsContainer = document.createElement("div");
        this.tabsContainer.classList.add(this.tabContainerClassName);
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public getActiveTab(): ITab {
        return this.tabs[this.activeTabIndex];
    }

    public switchToTab(index: number) {

        console.log(index);
        
        // Ignore if we are already on that tab.
        if (this.activeTabIndex == index) {
            return;
        } else if (index < 0) {
            throw new Error("The index must be greater than or equal to zero.");
        }

        let oldTabIndex = this.activeTabIndex;
        this.activeTabIndex = index;
        this.tabs[oldTabIndex].selected = false;
        this.tabs[this.activeTabIndex].selected = true;
        this.update();

        for (let func of this.onTabChanged) {
            try {
                func(this.tabs[oldTabIndex], this.tabs[index]);
            } catch (e) {
                console.error(e);
            }
        }
    }

    public draw(): void {
        let self = this;
        this.getContainer().appendChild(this.getElement());

        // Clone the template for each ITab in tabs.
        let clones: DocumentFragment[] = [];

        // Create tabs, use the template if provided.
        if (this.tabTemplate) {
            let template = this.tabTemplate;

            // If the element has a content property, clone that.
            if (isHTMLTemplateElement(template)) {

                // Create a clone for each tab
                for (let tab of this.tabs) {

                    // Clone contents
                    let clone = document.importNode(template.content, true);
                    clones.push(clone);
                }

            } else if (isHTMLScriptElement(template)) {

                // Create a clone for each tab
                for (let tab of this.tabs) {
                    // Create new document fragment;
                    let frag = document.createDocumentFragment();

                    // Create dummy element
                    let dummy = document.createElement("div");
                    dummy.innerHTML = template.innerHTML;

                    // Append each child from the dummy to the frag.
                    for (let i = 0; i < dummy.childElementCount; i++) {
                        frag.appendChild(dummy.children[i]);
                    }
                    
                    clones.push(frag);
                }
            } else if (isHTMLElement(template)) {

                // Create a clone for each tab
                for (let tab of this.tabs) {

                    // Create document fragment.
                    let frag = document.createDocumentFragment();
                    frag.appendChild(template.cloneNode(true));

                    // Clone entire element.
                    clones.push(frag);
                }
            }

            // Append each clone to the tab container
            clones.map((clone, index) => {
                this.getElement().appendChild(clone);
            });
        } else {

            // No template provided, generate tabs.
            d3.select(this.getElement())
                .selectAll("button")
                .data(this.tabs)
                .enter()
                .append("button")
                .attr("data-tabname", function(d) { return d.tabName })
                .classed(this.tabClassName, true)
                .classed(this.activeTabClassName, function(d, i) {
                    return i == self.activeTabIndex;
                })
                .classed(this.inactiveTabClassName, function(d, i) {
                    return i != self.activeTabIndex;
                })
                .each(function(d, i) {

                    let tab = d3.select(this);
                    
                    // Append image element.
                    tab.append("img")
                        .attr("src", d.iconUrl || "");

                    tab.append("div")
                        .text(d.tabName);

                    tab.on("click", function() {
                
                        // Ignore if disabled.
                        if (d != undefined && !d.disabled) {
                            self.switchToTab(i);
                        }
                    })
                });
        }
    }

    public update(): void {
        let self = this;
        d3.selectAll(this.tabsContainer.children)
            .data(this.tabs)
            .classed(self.activeTabClassName, function(d, i) {
                return i == self.activeTabIndex;
            })
            .classed(self.disabledTabClassName, function(d) {
                return d.disabled;
            })
            .classed(self.inactiveTabClassName, function(d, i) {
                return i != self.activeTabIndex;
            })
            .each(function(d) {

                // Update the element pointed to by d
                d3.select(d.tabBodyElement)
                    .classed(self.activeTabElementClassName, function() { 
                        return d.selected;
                    })
                    .classed(self.disabledTabElementClassName, function() { 
                        return d.disabled;
                    })
                    .classed(self.inactiveTabElementClassName, function() { 
                        return !d.selected 
                    });
                
                // Rerun the update template function if it exists
                if (self.tabTemplate) {
                    self.tabTemplate.tabTemplateUpdate(d, this);
                }
            });
    }

    public erase(): void {
        this.getElement().remove();
    }

    public getElement(): HTMLElement {
        return this.tabsContainer;
    }

    public getContainer(): Element {
        return this.container;
    }

    getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}