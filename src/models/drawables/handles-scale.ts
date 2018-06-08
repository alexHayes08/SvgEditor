import { NS } from '../../helpers/namespaces-helper';
import { IDOMDrawable } from '../idom-drawable';

const uniqid = require("uniqid");

export class HandlesScaleOverlay implements IDOMDrawable<SVGGElement> {
    //#region Fields

    private container: SVGGElement;
    private element: SVGGElement;

    //#endregion

    //#region Ctor

    public constructor(container: SVGGElement) {
        this.container = container;
        this.element = <SVGGElement>document.createElementNS(NS.SVG, "g");
        this.element.id = uniqid();
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

    //#endregion
}