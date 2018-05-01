import { ICoords2D } from "../services/svg-transform-service";
import { normalizeAngle, toDegrees, toRadians } from "../helpers/math-helpers";
import { NS } from "../helpers/namespaces-helper";
import { getAllGroups } from "../helpers/regex-helper";

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
    "video"
];

export function isSvgElement(element: any): element is SVGElement {
    return element!= undefined && element.ownerSVGElement;
}

export function isSvgGraphicsElement(element: any): element is SVGGraphicsElement {
    return element.transform != undefined;
}

export function getAllSubElementWhichInheritColors(parentElement: SVGElement) {

    // Get all child nodes
    let sub_elements: SVGElement[] = [];

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
    let regex = /url\((#.*)\)/;

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


export function drawCircle(): void {

}

export function updateCircle(): void {

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
