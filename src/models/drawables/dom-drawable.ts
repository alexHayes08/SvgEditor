import * as d3 from "d3";
import { IDrawable } from "../idrawable";

export interface DOMDrawableData<T extends Element> {
    element: T;
    dataType: string;
    eventTypes?: string[];
}

/**
 * Just testing an idea.
 */
export class DOMDrawable<T extends Element> implements IDrawable, EventTarget {
    //#region Fields

    protected readonly element: T;
    protected readonly emitter: d3.Dispatch<EventTarget>;
    protected readonly _dataType: string;
    protected readonly eventTypes: string[];
    protected container?: Element;

    //#endregion

    //#region Constructor

    public constructor(data: DOMDrawableData<T>) {
        this._dataType = data.dataType;
        this.element = data.element;
        this.eventTypes = [
            "ondraw",
            "onupdated",
            "onerase"
        ].concat(data.eventTypes || []);
        this.emitter = d3.dispatch(...this.getEventTypes());

        // Setup element.
        this.element.setAttribute("data-type", this.dataType);
    }

    //#endregion

    //#region Properties

    public get dataType(): string {
        return this._dataType;
    }

    //#endregion

    //#region Functions

    public draw(): void {
        let container = this.getContainer();
        if (container == undefined) {
            throw new Error("Cannot draw as the container hasn't been set!")
        }
    }

    public update(): void {
        this.element.setAttribute("data-type", this.dataType);
    }

    public erase(): void {
        this.getElement().remove();
    }

    public getElement(): T {
        return this.element;
    }

    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    public getEventTypes(): string[] {
        return this.eventTypes;
    }

    public getContainer(): Element|undefined {
        return this.container;
    }

    public setContainer(container: Element|undefined): void {
        this.container = container;
    }

    public addEventListener(type: string,
        callback: (evt: Event) => void): void
    {
        this.getEventEmitter().on(type, callback);
    }

    public removeEventListener(type: string): void {
        this.getEventEmitter().on(type, null);
    }

    public dispatchEvent(event: Event): boolean {
        this.getEventEmitter().call(event.type, this);
        return true;
    }

    //#endregion
}