import * as d3 from "d3-color";
import * as $ from "jquery";

/**
 * Used for setting/getting the colors used in an SVGGraphicsElement
 */
export class SvgColorService {

    public constructor(private svgEls: JQuery<HTMLElement>) {}

    get fill() {
        let result: d3.ColorSpaceObject|null = null;

        let attrVal = this.svgEls.attr("fill");
        if (attrVal != null) {
            result = d3.color(attrVal);
        }

        return result;
    }

    set fill(color: d3.ColorSpaceObject|null) {
        if (color == null) {
            this.svgEls.removeAttr("fill");
        } else {
            this.svgEls.attr("fill", color.toString());
        }
    }

    get stroke() {
        let result: d3.ColorSpaceObject|null = null;

        let attrVal = this.svgEls.attr("stroke");
        if (attrVal != null) {
            result = d3.color(attrVal);
        }

        // If there was no stroke on the element check if it's a use element
        let pointsToId = this.svgEls.attr("href") || this.svgEls.attr("xlink:href");
        if (result == null && pointsToId != null) {
            let pointsTo = this.getElementAttrPointsTo(this.svgEls);
        }

        return result;
    }

    set stroke(color: d3.ColorSpaceObject|null) {
        if (color == null) {
            this.svgEls.removeAttr("stroke");
        } else {
            this.svgEls.attr("stroke", color.toString());
        }
    }

    private getElementAttrPointsTo(element: JQuery<HTMLElement>): JQuery<HTMLElement>|null {
        let result: JQuery<HTMLElement>|null = null;

        // Checks for a url() in the attribute
        let regex = /url\(#(.*)\)/;

        // Need to check href and xlink:href (not all clipart has been updated
        // to use href yet)
        let otherId = regex.exec(element.attr("href") 
            || element.attr("xlink:href") 
            || "");

        if (otherId != null) {
            let parentSvg = this.svgEls.closest("svg").first();
            result = parentSvg.find(`#${otherId}`);
        }

        return result;
    }
}
