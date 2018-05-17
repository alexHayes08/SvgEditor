const uniqid = require("uniqid");

import * as d3 from "d3";
// import { color, ColorSpaceObject, Color } from "d3";
import * as $ from "jquery";

import { ColorValue } from "./color-value";
import { SvgTransformService, SvgTransformServiceSingleton, ICoords2D, ITransformable } from "../services/svg-transform-service";
import { isSvgGraphicsElement } from "../helpers/svg-helpers";
import { IDrawable } from "./idrawable";
import { isSvgElement } from "../helpers/svg-helpers";

export interface ISvgItemV2 {

    /**
     * Returns a percentage of how close it is to finishing parsing an element.
     * This is the 'constructor' which is used to populate the other fields.
     * @param element 
     */
    parseElement(element: SVGElement): Iterable<number>;

    getElement(): SVGElement;

    /**
     * Returns the colors present in an element
     */
    getColors(): Map<SVGElement, d3.ColorSpaceObject[]>;

    getTransforms(): ITransformable;
}

export class SvgItemV2 {
    //#region Fields

    private colorMap: WeakMap<Element, d3.ColorSpaceObject[]>;
    private element?: SVGElement;
    private _isGraphicsElement: boolean;

    //#endregion

    //#region Ctor

    public constructor() {
        this.colorMap = new WeakMap();
        this._isGraphicsElement = false;
    }

    //#endregion

    //#region Properties

    get isGraphicsElement() {
        return this._isGraphicsElement;
    }

    //#endregion

    //#region Functions

    private parseOnlyElement(element: SVGElement) {

        // Check if it's a graphics element
        if (isSvgGraphicsElement(element)) {
            this._isGraphicsElement = true;

            // Get stroke, stroke-width, and fill
            let stroke: d3.ColorSpaceObject;
            let strokeWidth: d3.ColorSpaceObject;
            this.colorMap.set(element, []);
        }
    }

    public getElement(): SVGElement {
        if (this.element == undefined) {
            throw new Error("Cannot return the element as it hasn't been set yet.");
        }

        return this.element;
    }

    public *parseElement(element: SVGElement): Iterable<number> {
        this.element = element;
        let elementsToBeParsed: SVGElement[] = [this.element];

        // Also need to parse ALL child elements
        let childElements = this.element.querySelectorAll("*");
        for (let i = 0; i < childElements.length; i++) {
            let childItem = childElements.item(i);

            if (isSvgElement(childItem)) {
                elementsToBeParsed.push(childItem);
            }
        }


        let progress = 0;
        let progressIncrement = 100 / elementsToBeParsed.length;

        // Starting to parse
        yield progress;

        for (let el of elementsToBeParsed) {
            this.parseOnlyElement(el);

            progress += progressIncrement;
            yield progress;
        }
    }

    public *update(): Iterable<number> {
        yield 0;
    }

    //#endregion
}