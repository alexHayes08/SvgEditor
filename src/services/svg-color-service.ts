import * as d3 from "d3-color";
import * as $ from "jquery";

import { getElementAttrPointsTo } from "../helpers/svg-helpers";

/**
 * Used for setting/getting the colors used in an SVGGraphicsElement
 */
export class SvgColorService {

    private readonly colors: string[] = [
        "red",
        "orange",
        "yellow",
        "green",
        "blue",
        "indigo",
        "violet"
    ];

    public constructor() {}

    get randomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)]
    }

    public getfill(svgEls: JQuery<HTMLElement>) {
        let result: d3.ColorSpaceObject|null = null;

        let attrVal = svgEls.attr("fill");
        if (attrVal != null) {
            result = d3.color(attrVal);
        }

        return result;
    }

    public setfill(svgEls: JQuery<HTMLElement>, color: d3.ColorSpaceObject|null) {
        if (color == null) {
            svgEls.removeAttr("fill");
        } else {
            svgEls.attr("fill", color.toString());
        }
    }

    public getStroke(svgEls: JQuery<HTMLElement>) {
        let result: d3.ColorSpaceObject|null = null;

        let attrVal = svgEls.attr("stroke");
        if (attrVal != null) {
            result = d3.color(attrVal);
        }

        // If there was no stroke on the element check if it's a use element
        let pointsToId = svgEls.attr("href") || svgEls.attr("xlink:href");
        if (result == null && pointsToId != null) {
            let pointsTo = getElementAttrPointsTo(svgEls);
        }

        return result;
    }

    public setstroke(svgEls: JQuery<HTMLElement>, color: d3.ColorSpaceObject|null) {
        if (color == null) {
            svgEls.removeAttr("stroke");
        } else {
            svgEls.attr("stroke", color.toString());
        }
    }
}
