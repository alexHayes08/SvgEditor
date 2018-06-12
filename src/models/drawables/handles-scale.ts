import * as d3 from "d3";

import { NS } from '../../helpers/namespaces-helper';
import { IDOMDrawable } from '../idom-drawable';

const uniqid = require("uniqid");

export class HandlesScaleOverlay implements IDOMDrawable<SVGGElement> {
    //#region Fields

    private readonly container: SVGGElement;
    private readonly element: SVGGElement;
    private readonly emitter: d3.Dispatch<EventTarget>;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement) {
        this.container = container;
        this.element = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.element.id = uniqid();
        this.emitter = d3.dispatch("change");
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
        this.getElement().remove();
    }

    public getContainer(): Element {
        return this.container;
    }

    public getElement(): SVGGElement {
        return this.element;
    }

    public getEventEmitter(): d3.Dispatch<EventTarget> {
        return this.emitter;
    }

    //#endregion
}