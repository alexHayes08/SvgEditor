const uniqid = require("uniqid");

import { color, ColorSpaceObject } from "d3";
import * as $ from "jquery";

import { ColorValue } from "./color-value";
import { SvgTransformService, SvgTransformServiceSingleton, ICoords2D } from "../services/svg-transform-service";
import { isSvgGraphicsElement } from "../helpers/svg-helpers";

export interface ColorMap {
    element: SVGGraphicsElement;
    colors: SvgColors;
}

export interface SvgColors {
    stroke: ColorValue;
    fill: ColorValue;
}

export const SVGITEM_EVT_NAMES = {
    COLOR_CHANGED: "color-changed"
}

/**
 * This class is responsible for 'normalizing' the element passed in. This
 * includes transforms, colors, etc...
 */
export class SvgItem {
    //#region Fields

    /**
     * The element being wrapped.
     */
    private _element: SVGGraphicsElement;
    private transformService: SvgTransformService;

    /**
     * Maps an element to a ColorMap.
     */
    private mapToColors: Map<SVGGraphicsElement, SvgColors>;

    //#endregion

    //#region Ctor

    public constructor(item: SVGGraphicsElement) {
        this.transformService = SvgTransformServiceSingleton;
        
        let $el = $(item);
        this._element = item;

        // Standardize the elements transforms
        this.transformService.standardizeTransforms(item);

        // Check if this was already called on the element
        if ($el.data()) {

            // Used cached values
            let data = $el.data();
            this.mapToColors = data.mapToColors;
        } else {
            this.mapToColors = new Map();
            this.recalculateColors();

            // Store a reference to 'this' in data
            $el.data(this);
        }
    }

    //#endregion

    //#region Properties

    /**
     * Gets the center of the item (in respect to the upper left corner of the
     * item).
     */
    get center(): ICoords2D {
        return this.transformService.getCenter(this._element);
    }

    /**
     * Retrieves a Map<Element, SvgColors> of itself and each child-element.
     */
    get colors() {
        return this.mapToColors;
    }

    get element() {
        return this._element;
    }

    //#endregion
    
    //#region Functions

    private recalculateColors(): void {
        let colors: ColorMap[] = [];
        this.mapToColors.clear();

        switch(this._element.tagName.toLowerCase()) {
            case "image": {
                colors.concat(SvgItem._GetColorsFromImage(this._element));
                break;
            }
            case "g": {
                colors.concat(SvgItem._GetColorsFromGroup(this._element))
                break;
            }
            case "use": {
                colors.concat(SvgItem._GetColorsFromUse(this._element));
                break;
            }
            case "svg": {
                colors.concat(SvgItem._GetColorsFromUse(this._element));
                break;
            }
            default: {
                colors.concat(SvgItem._GetColorsFromGroup(this._element));
                break;
            }
        }

        colors.map(color => {
            
            // Assert that the color isn't null.
            if (color == null) {
                return;
            }

            let { element, colors: cs } = color;
            this.mapToColors.set(<SVGGraphicsElement>element, cs);
        });
    }

    private static _GetColorsFromImage(element: SVGGraphicsElement): ColorMap[] {
        // TODO: Handle scenario where the image points to another svg. Though
        // I'm not sure how to detect if the image being pointed to is a svg.
        
        return [
            {
                element: element,
                colors: {
                    stroke: null,
                    fill: Number.POSITIVE_INFINITY
                }
            }
        ];
    }

    private static _GetColorsFromUse(element: SVGGraphicsElement): ColorMap[] {
        let colors: ColorMap[] = [];

        return colors;
    }

    private static _GetColorsFromGroup(element: SVGGraphicsElement): ColorMap[] {
        let colors: ColorMap[] = [];

        return colors;
    }

    private static _GetColorsFromPathEl(element: SVGGraphicsElement): ColorMap[] {
        let colors: ColorMap[] = [];
        let c = {
            element: element,
            colors: {
                fill: null,
                stroke: null
            }
        }

        // Check fill

        // Check stroke
        let stroke = $(element).attr("stroke");
        if (stroke != null && stroke != "") {
            let c = color(stroke);

            // Check stroke opacity
            if (c.opacity > 0) {

                // Check if the stroke width is greater than zero
                let strokeWidth = Number($(element).attr("stroke-width") || "");
                if (Number.isNaN(strokeWidth) || strokeWidth > 0) {

                    // Stroke has a color, add it to the array
                }
            }
        }

        // If the element has no fill/stroke ignore it
        if (c.colors.fill != null || c.colors.stroke != null) {
            colors.push(c);
        }

        return colors;
    }
    
    private static _GetColorsFromSvg(element: SVGGraphicsElement): ColorMap[] {
        let colors: ColorMap[] = [];

        return colors;
    }

    //#endregion
}