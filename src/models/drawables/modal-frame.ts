import * as d3 from "d3";

import { IDOMDrawable } from "../idom-drawable";
import { createEl } from "../../helpers/html-helpers";

export class ModalFrame implements IDOMDrawable<HTMLElement> {
    //#region Fields

    private readonly container: Element;
    private readonly element: HTMLElement;
    private readonly emitter: d3.Dispatch<EventTarget>;

    private readonly bodyElement: HTMLElement;
    private readonly footerElement: HTMLElement;
    private readonly headerElement: HTMLElement;

    //#endregion

    //#region Constructor

    public constructor(container: Element) {
        this.container = container;
        this.emitter = d3.dispatch();

        // Create element.
        this.element = document.createElement("div");
        this.element.classList.add("modal-frame");

        // Create header element.
        this.headerElement = createEl("div", this.element);
        this.headerElement.classList.add("header")

        this.bodyElement = createEl("div", this.element);
        this.footerElement = createEl("div", this.element);
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public draw(): void {
        this.getContainer().appendChild(this.getElement());
    }

    public update(): void {

    }

    public erase(): void {
        this.getElement().remove;
    }

    public getElement(): HTMLElement {
        return this.element;
    }

    public getContainer(): Element {
        return this.container;
    }

    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}