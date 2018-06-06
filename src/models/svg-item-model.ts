const uniqid = require("uniqid");

import * as d3 from "d3";
import * as $ from "jquery";

import { ColorValue } from "./color-value";
import { 
    SvgGeometryService, 
    SvgGeometryServiceSingleton, 
    ICoords2D, 
    ITransformable, 
    SvgTransformString 
} from "../services/svg-geometry-service";
import { isSvgGraphicsElement } from "../helpers/svg-helpers";

export interface ColorMap {
    element: SVGGraphicsElement;
    colors: SvgColors;
}

export function isColorMap(value: any): value is ColorMap {
    return (value != undefined
        && value.element != undefined
        && value.colors != undefined);
}

export interface SvgColors {
    stroke?: ColorValue;
    strokeWidth?: number;
    fill?: ColorValue;
}

export const SVGITEM_EVT_NAMES = {
    COLOR_CHANGED: "color-changed"
}

export interface IRestriction {
    on: string;
    validator: (value: any) => boolean;
}

export interface ICircleBBox {
    r: number;
    cx: number;
    cy: number;
}

/**
 * This class is responsible for 'normalizing' the element passed in. This
 * includes transforms, colors, etc...
 */
export class SvgItem {
    //#region Fields

    private readonly element: SVGGraphicsElement;

    private _circleBBox: ICircleBBox;
    private _originalTransformMatrix: string;
    private _restrictions: IRestriction[];
    private mapToColors: WeakMap<SVGGraphicsElement, SvgColors>;

    public angle: number;
    public scale: number;
    public transforms: ITransformable;

    //#endregion

    //#region Ctor

    public constructor(element: SVGGraphicsElement) {
        this.element = element;

        this._circleBBox = { r: 0, cx: 0, cy: 0 };
        this._originalTransformMatrix = "";
        this._restrictions = [];

        this.angle = 0;
        this.mapToColors = new WeakMap();
        this.scale = 1;
        this.transforms = SvgTransformString.CreateDefaultTransform();

        this.recalculateColors();
    }

    //#endregion

    //#region Properties

    /**
     * Returns a bounding circle around the element, the cx and cy properties
     * are relative to the elements center, not the canvas.
     */
    public get circleBBox() {
        return this._circleBBox;
    }

    /**
     * Retrieves a Map<Element, SvgColors> of itself and each child-element.
     */
    public get colors(): ColorMap[] {
        let colorMapArr: ColorMap[] = [];

        this.getAllElements()
            .map(el => {
                let color = this.mapToColors.get(el);
                if (color != undefined) {
                    colorMapArr.push({
                        colors: color,
                        element: el
                    });
                }
            });

        return colorMapArr;
    }

    public get originalTransformMatrix() {
        return this._originalTransformMatrix;
    }

    //#endregion
    
    //#region Functions

    private getAllElements(): SVGGraphicsElement[] {
        let els = [ this.getElement() ];

        d3.select(els[0])
            .selectAll<SVGGraphicsElement, {}>("*")
            .nodes()
            .map(node => {
                els.push(node)
            });

        return els;
    }

    /**
     * Try to NOT modify the attributes of the returned element.
     */
    public getElement(): SVGGraphicsElement {
        return this.element;
    }

    /**
     * Updates the element.
     */
    public update(): void {
        let self = this;

        let el = d3.select(this.element);
        el.attr("transform", this.transforms.toTransformString());

        // Update ALL colors... this may be expensive
        d3.select(this.element)
            .selectAll<SVGGraphicsElement, null>("*")
            .each(function() {
                
                /**
                 * Update the following properties IF it has an entry in the
                 * color map:
                 * - fill
                 * - stroke
                 * - stroke-width
                 */
                let colorData = self.mapToColors.get(this);
                if (colorData != undefined) {

                    if (colorData.fill) {
                        this.setAttribute("fill", colorData.fill.toString());
                    }

                    if (colorData.stroke) {
                        this.setAttribute("stroke", colorData.stroke.toString())
                    }

                    if (colorData.strokeWidth) {
                        this.setAttribute("stroke-width", colorData.strokeWidth.toString());
                    }
                }
            });
    }

    /**
     * This method is static only to prevent modifying the element the data is
     * pointing to instead of modifying the data used to represent it.
     * @param item 
     */
    public static GetElementOfSvgItem(item: SvgItem): SVGGraphicsElement {
        return item.element;
    }

    private recalculateColors(): void {
        let colors: ColorMap[] = [];
        let els = this.getAllElements();
        els.map(el => colors = colors.concat(SvgItem._GetColorsFromElement(el)));
        // colors.concat(SvgItem._GetColorsFromElement(this.element))

        // switch(this.element.tagName.toLowerCase()) {
        //     case "image": {
        //         colors.concat(SvgItem._GetColorsFromImage(this.element));
        //         break;
        //     }
        //     case "g": {
        //         colors.concat(SvgItem._GetColorsFromElement(this.element))
        //         break;
        //     }
        //     case "use": {
        //         colors.concat(SvgItem._GetColorsFromUse(this.element));
        //         break;
        //     }
        //     case "svg": {
        //         colors.concat(SvgItem._GetColorsFromUse(this.element));
        //         break;
        //     }
        //     default: {
        //         colors.concat(SvgItem._GetColorsFromElement(this.element));
        //         break;
        //     }
        // }

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

    private static _GetColorsFromElement(element: SVGGraphicsElement): ColorMap[] {
        // let colors: ColorMap[] = [];
        let colors: SvgColors = {};

        if (element.hasAttribute("fill")) {
            let fill = element.getAttribute("fill") || "";
            colors.fill = d3.color(fill);
        } else {
            colors.fill = undefined;
        }

        if (element.hasAttribute("stroke")) {
            let stroke = element.getAttribute("stroke") || "";
            colors.stroke = d3.color(stroke);
        } else {
            colors.stroke = undefined;
        }

        if (element.hasAttribute("stroke-width")) {
            let strokeWidth = element.getAttribute("stroke-width") || "1";
            colors.strokeWidth = Number(strokeWidth);
        } else {
            colors.strokeWidth = colors.stroke ? 1 : 0;
        }

        return [{ element,colors }];
    }

    private static _GetColorsFromPathEl(element: SVGGraphicsElement): ColorMap[] {
        let colors: ColorMap[] = [];
        let c = {
            element: element,
            colors: {
                fill: null,
                stroke: null,
                element: element
            }
        }

        // Check fill

        // Check stroke
        let stroke = $(element).attr("stroke");
        if (stroke != null && stroke != "") {
            let c = d3.color(stroke);

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