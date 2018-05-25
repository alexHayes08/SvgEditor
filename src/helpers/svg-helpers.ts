import * as d3 from "d3";

import { getAllGroups, getAllGroupsV2 } from "../helpers/regex-helper";
import { ICoords2D, IBBox, SvgTransformService } from "../services/svg-transform-service";
import { MathServiceSingleton } from "../services/math-service";
import { normalizeAngle, toDegrees, toRadians } from "../helpers/math-helpers";
import { NS } from "../helpers/namespaces-helper";
import { IAngle } from "../models/angle";

/**
 * https://www.w3.org/TR/SVG2/struct.html#TermGraphicsElement
 */
export const GraphicsElements = [
    "audio", 
    "canvas", 
    "circle", 
    "ellipse",
    "foreignObject", 
    "iframe", 
    "image", 
    "line", 
    "mesh", 
    "path", 
    "polygon", 
    "polyline", 
    "rect", 
    "text", 
    "textPath", 
    "tspan",
    "video",

    // ELements not included in the spec, but inherit from SVGGraphicsElement
    "g"
];

/**
 * Converts the element to an SVGElement. Will throw an error if the element
 * isn't an svg element.
 * @param element 
 * @throws - Throws an error if the element isn't an SVGElement.
 */
export function convertToSvgElement(element: Element): SVGGraphicsElement {
    if (isSvgElement(element)) {
        return <SVGGraphicsElement>element;
    } else {
        throw new Error("Failed to convert the element to an SVGElement");
    }
}

/**
 * Converts an Element to an SVGGraphicsElement.
 * @param element 
 * @throws - Throws an error if the element isn't an SVGGraphicsElement.
 */
export function convertToSvgGraphicsElement(element: Element): SVGGraphicsElement {
    if (isSvgGraphicsElement(element)) {
        return <SVGGraphicsElement>element;
    } else {
        throw new Error("Failed to convert the element to an SVGGraphicsElement");
    }
}

//#region Casting

export function isSvgElement(element: any): element is SVGGraphicsElement {
    return element!= undefined && element.ownerSVGElement;
}

export function isSvgGraphicsElement(element: any): element is SVGGraphicsElement {
    return element != undefined 
        && element.transform != undefined
        && GraphicsElements.indexOf(element.tagName) != -1;
}

export function isSvgSvgElement(element: any): element is SVGSVGElement {
    return element != undefined 
        && element.x != undefined
        && element.y != undefined
        && element.viewBox != undefined
        && element.getCurrentTime != undefined
        && element.tagName.toLowerCase() == "svg";
}

// export function isSvgGeometryElement(element: any): element is SVGGeometryElement {
//     return element != undefined
//         && element.pathLength
//         && element.isPointInFill
//         && element.isPointInStroke
//         && element.getTotalLength
//         && element.getPointAtLength;
// }

export function isSvgPathElement(element: any): element is SVGPathElement {
    return element != undefined
        && element.pathLength
        && element.getTotalLength
        && element.getPointAtLength
        && element.tagName.toLowerCase() == "path";
}

//#endregion

export function getAllSubElementWhichInheritColors(parentElement: SVGGraphicsElement) {

    // Get all child nodes
    let sub_elements: SVGGraphicsElement[] = [];

    // First check if the parent element has a fill/stroke

    for (let i = 0; i < parentElement.childElementCount; i++) {
        let element = sub_elements[i];
    }

    return sub_elements;
}

/**
 * Will attempt to locate the element specified in the id.
 * @param element 
 * @param attr - Will check both the attr and xlink:attr.
 */
export function getElementAttrPointsTo(element: JQuery<HTMLElement>, attr: string = "href"): JQuery<HTMLElement>|null {
    let result: JQuery<HTMLElement>|null = null;

    // Checks for a url() in the attribute
    let regex = /url\((#.*)\)/g;

    // Need to check href and xlink:href (not all clipart has been updated
    // to use href yet)
    let matches = regex.exec(element.attr(attr) 
        || element.attr(`xlink:${attr}`) 
        || "");

    if (matches != null && matches.length >= 2) {
        let otherId = matches[1];
        let parentSvg = element.closest("svg").first();
        result = parentSvg.find(otherId);
    }

    return result;
}

/**
 * Retrieves the reference to the element pointed to by a url(#...) string.
 * @param url - Must be in the format 'url(#...)'.
 */
export function getElementUrlPointsTo(url: string): Element {
    
    // Checks for a url() in the attribute
    let regex = /url\((#.*)\)/g;

    let matches = getAllGroupsV2(regex, url);
    let firstMatch = matches[0];

    let node = d3.select<Element, {}>(firstMatch).node();
    if (node == undefined) {
        throw new Error(`Failed to find element matching selector "${firstMatch}".`);
    }

    return node;
}

export interface ISlice {
    degrees: number;
    color: string;
}

export function updateArcs(radius: number, paths: SVGPathElement[]): void {
    for (let path of paths) {
        let data = path.getAttribute("d") || "";
        let reg = /[\d+\.]+/g;
        let matches = getAllGroups(reg, data);

        let start_pt_x = Number(matches[0][0] || 0);
        let start_pt_y = Number(matches[1][0] || 0);
        let rad_x = Number(matches[2][0] || 0);
        let rad_y = Number(matches[3][0] || 0);
        let x_axis_rot = Number(matches[4][0] || 0);
        let large_arg = Number(matches[5][0] || 0);
        let sweep_flag = Number(matches[6][0] || 0);
        let end_pt_x = Number(matches[7][0] || 0);
        let end_pt_y = Number(matches[8][0] || 0);

        rad_x = radius;
        rad_y = radius;
    }
}

export function updateArcsV2(data: IDrawArcConfig, paths: SVGPathElement[]): void {
    let { radius, width = 4, startAngle = 0, slices } = data;
    
    let currentPath: SVGPathElement|null = null;
    for (let slice of slices) {

    }
}

export interface ISliceV2 {
    radius: number;
    endAngle: number;
    startAngle: number;
    width?: number;
    color: string;
}

export interface ID3ArcConfig {
    outerRadius: number;
    innerRadius?: number;
    startAngle?: number;
    endAngle: number;
}

export interface IDrawArcConfig {
    radius: number;
    width?: number;
    startAngle?: number;
    slices: ISlice[];
}

/**
 * Creates a bunch of arcs to form a circle.
 * @param center 
 * @param radius 
 * @param slices - Must have a length greater than one.
 * @param width 
 * @param startAngle 
 */
export function drawCubicBezierArc(data: IDrawArcConfig): SVGPathElement[]
{
    let { radius, width = 4, startAngle = 0, slices } = data;

    if (slices.length <= 1) {
        throw new Error("Must have at least two slices.");
    }

    let circlePaths: SVGPathElement[] = [];

    // Current position
    let curPos = {
        x: 0,
        y: 0
    };

    // Normalize the starting angle
    let currentAngle = normalizeAngle(startAngle);

    // Determine the starting point
    curPos.x = getXCircleCoord(currentAngle, radius);
    curPos.y = getYCircleCoord(currentAngle, radius);

    // Starting point
    let startPt = {
        x: curPos.x,
        y: curPos.y
    };

    for (let slice of slices) {
        let pathStr = `M${curPos.x.toFixed(3)},${curPos.y.toFixed(3)}`;
        // pathStr += ` A ${radius} ${radius} 0 0 0 ${curPos.x} ${curPos.y}`;

        // Update the angle
        currentAngle += normalizeAngle(slice.degrees);

        // Get the x & y coords
        curPos.x = getXCircleCoord(currentAngle, radius);
        curPos.y = getYCircleCoord(currentAngle, radius);

        // A rx ry x-axis-rotation large-arc-flag sweep-flag x y
        let largeFlag = getLargeFlagArc(slice.degrees);
        pathStr += ` A ${radius} ${radius} 0 ${largeFlag} 0 ${curPos.x.toFixed(3)} ${curPos.y.toFixed(3)}`;

        let path = <SVGPathElement>document.createElementNS(NS.SVG, "path");
        $(path).attr({
            d: pathStr,
            fill: "none",
            stroke: slice.color,
            "stroke-width": width
        });

        circlePaths.push(path);
    }

    // Wrap up circle, use black as color
    let remainingDegrees = 360;
    slices.map(value => {
        return remainingDegrees -= value.degrees;
    });
    if (remainingDegrees > 0) {
        let pathStr = `M${curPos.x.toFixed(3)},${curPos.y.toFixed(3)}`;
        let largeFlag = getLargeFlagArc(remainingDegrees);
        pathStr += ` A ${radius} ${radius} 0 ${largeFlag} 0 ${startPt.x.toFixed(3)} ${startPt.y.toFixed(3)}`;

       let path = <SVGPathElement>document.createElementNS(NS.SVG, "path");
       $(path).attr({
           d: pathStr,
           stroke: "black",
           fill: "none",
           "stroke-width": width
       });
       circlePaths.push(path);
    }

    return circlePaths;
}

function getLargeFlagArc(angle: number): number {
    return angle > 180 ? 1 : 0;
}

function getYCircleCoord(currentAngle: number, radius: number): number {
    let y = Math.sin(toRadians(currentAngle)) * radius;

    // Account for offsets
    // if (currentAngle <= 180) {
    //     y = radius - y;
    // } else {
    //     y = radius - y;
    // }

    return radius - y;
}

function getXCircleCoord(currentAngle: number, radius: number): number {
    let x = Math.cos(toRadians(currentAngle)) * radius;

    // if (currentAngle <= 90) {
    //     x += radius;
    // } else if (currentAngle <= 270) {
    //     x = radius + x;
    // } else if (currentAngle <= 360) {
    //     x += radius;
    // }

    return radius + x;
}

/**
 * Cross browser polyfill for 'ownerSvgDocument' which isn't avaiable on IE9.
 * @param element 
 */
export function getFurthestSvgOwner(element: SVGGraphicsElement): SVGSVGElement {
    let parents: Element[] = [];

    // Check if the current element is a svg
    if (isSvgSvgElement(element)) {
        parents.push(element);
    }

    let currentEl = element.parentElement;
    while (currentEl != null) {
        if (currentEl.tagName.toLowerCase() == "svg") {
            parents.push(currentEl);
        }

        currentEl = currentEl.parentElement;
    }

    let lastSvgParent = parents.pop();

    if (isSvgSvgElement(lastSvgParent)) {
        return lastSvgParent;
    } else {
        throw new Error("Failed to cast the last svg parent element to the SVGSVGElement interface.")
    }
}

export interface IPointAlongAngleFromPointData {
    pt_a: ICoords2D;
    pt_b: ICoords2D;
    radius: number;
}

export interface IPointAlongAngleFromAngleData {
    pt_a: ICoords2D;
    angle: number;
    radius: number;
}

export function isIPointAlongAngleFromPointData(data: any): data is IPointAlongAngleFromPointData {
    return (data != undefined
        && data.pt_a != undefined
        && data.pt_b != undefined
        && data.radius != undefined);
}

export function isIPointAlongAngleFromAngleData(data: any): data is IPointAlongAngleFromAngleData {
    return (data != undefined
        && data.pt_a != undefined
        && data.angle != undefined
        && data.radius != undefined);
}

/**
 * Returns a new point along a line between two points that is a 'hyp' amount
 * away from pt_a. The center of the circle is assumed to be pt_a.
 */
export function getNewPointAlongAngle(data: IPointAlongAngleFromAngleData|IPointAlongAngleFromPointData): ICoords2D {
    let result: ICoords2D = {
        x: 0,
        y: 0
    };
    
    if (isIPointAlongAngleFromPointData(data)) {
        let pointData = data as IPointAlongAngleFromPointData;
        let { pt_a, pt_b, radius } = pointData;
        
        let angle = Math.atan2((pt_b.y - pt_a.y), (pt_b.x - pt_a.x));
        result.x = pt_a.x + (Math.cos(angle) * radius);
        result.y = pt_a.y + (Math.sin(angle) * radius);

    } else if (isIPointAlongAngleFromAngleData(data)) {
        let pointData = data as IPointAlongAngleFromAngleData;
        let { pt_a, angle, radius } = pointData;

        result.x = pt_a.x + (Math.cos(angle) * radius);
        result.y = pt_a.y + (Math.sin(angle) * radius);
    } else {
        throw new Error("Could not determine type of 'data'.");
    }

    return result;
}

/**
 * Returns a path string.
 * @param center 
 * @param radius 
 * @param startAngle - Uses degrees
 * @param endAngle - Uses degrees
 */
export function arcPath(radius: number, startAngle: number, endAngle: number): string {
    startAngle = toRadians(startAngle);
    endAngle = toRadians(endAngle);
    
    let arc = d3.arc()({
        innerRadius: 0,
        outerRadius: radius,
        startAngle: startAngle,
        endAngle: endAngle
    }) || "";

    return arc.replace(/L.*/, "");
}

/**
 * Returns the angle in degrees between two points.
 * @param pt_a 
 * @param pt_b 
 */
export function getAngle(pt_a: ICoords2D, pt_b: ICoords2D): number {
    let zeroed_pt_b = {
        x: pt_b.x - pt_a.x,
        y: pt_b.y - pt_a.y
    }

    let angle = Math.atan2(zeroed_pt_b.y, zeroed_pt_b.x);

    return toDegrees(angle);
}
