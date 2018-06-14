import * as d3 from 'd3';

import { NS } from 'src/app/helpers/namespace-helpers';
import { Coords2D } from 'src/app/models/geometry';

import { toDegrees, toRadians } from '../helpers/math-helpers';
import { getAllGroups, getAllGroupsV2 } from '../helpers/regex-helper';

//#region Element names
/**
 * The tagNames of ALL svg elements, including the deprecated ones.
 */
export const SVGElementTagNames = [
  'a',
  'altGlyph',
  'altGlyphDef',
  'altGlyphItem',
  'animate',
  'animateColor',
  'animateMotion',
  'animateTransform',
  'circle',
  'clipPath',
  'color-profile',
  'cursor',
  'defs',
  'desc',
  'discard',
  'ellipse',
  'feBlend',
  'feColorMatrix',
  'feComponentTransfer',
  'feComposite',
  'feConvolveMatrix',
  'feDiffuseLighting',
  'feDisplacementMap',
  'feDistantLight',
  'feDropShadow',
  'feFlood',
  'feFuncA',
  'feFuncB',
  'feFuncG',
  'feFuncR',
  'feGaussianBlur',
  'feImage',
  'feMerge',
  'feMergeNode',
  'feMorphology',
  'feOffset',
  'fePointLight',
  'feSpecularLighting',
  'feSpotLight',
  'feTile',
  'feTurbulence',
  'filter',
  'font',
  'font-face',
  'font-face-format',
  'font-face-name',
  'font-face-src',
  'font-face-uri',
  'foreignObject',
  'g',
  'glyph',
  'glyphRef',
  'hatch',
  'hatchpath',
  'hkern',
  'image',
  'line',
  'linearGradient',
  'marker',
  'mask',
  'mesh',
  'meshgradient',
  'meshpatch',
  'meshrow',
  'metadata',
  'missing-glyph',
  'mpath',
  'path',
  'pattern',
  'polygon',
  'polyline',
  'radialGradient',
  'rect',
  'script',
  'set',
  'solidcolor',
  'stop',
  'style',
  'svg',
  'switch',
  'symbol',
  'text',
  'textPath',
  'title',
  'tref',
  'tspan',
  'unknown',
  'use',
  'view',
  'vkern'
];

/**
 * https://www.w3.org/TR/SVG2/struct.html#TermGraphicsElement
 */
export const SvgGraphicElements = [
  'audio',
  'canvas',
  'circle',
  'ellipse',
  'foreignObject',
  'iframe',
  'image',
  'line',
  'mesh',
  'path',
  'polygon',
  'polyline',
  'rect',
  'text',
  'textPath',
  'tspan',
  'video',

  // ELements not included in the spec, but inherit from SVGGraphicsElement
  'g'
];

//#endregion
export function convertCoordsRelativeTo(coords: Coords2D,
    originallyRelativeTo: Element,
    makeRelativeTo: Element): Coords2D {
    const result: Coords2D = {
        x: coords.x,
        y: coords.y
    };

    const originallyBcr = originallyRelativeTo.getBoundingClientRect();
    const newlyRelativeBcr = makeRelativeTo.getBoundingClientRect();

    // Make relative to page
    result.x += originallyBcr.left;
    result.y += originallyBcr.top;

    // Make relative to an element
    result.x -= newlyRelativeBcr.left;
    result.y -= newlyRelativeBcr.top;

    return result;
}

export function convertSvgCoordsToScreenCoords(coords: Coords2D,
    canvas: SVGSVGElement): Coords2D {
    const result: Coords2D = {
        x: coords.x,
        y: coords.y
    };

    const canvasBCR = canvas.getBoundingClientRect();
    result.x += canvasBCR.left;
    result.y += canvasBCR.right;

    return result;
}

/**
 * Simplifies the process of creating an element and appending it to another
 * element.
 * @param tagName - Must be a valid svg element name.
 * @param parent - Reference to the parent element, will append element to it
 * if not null.
 * @returns - The created element.
 */
export function createSvgEl<T extends SVGElement>(tagName: string,
    parent?: Element): T {
    // Check that tagName is a valid name.
    if (SVGElementTagNames.indexOf(tagName) === -1) {
        throw new Error('The argument \'tagName\' was not a recognized svg element.');
    }

    const el = <T>document.createElementNS(NS.SVG, tagName);

    if (parent) {
        parent.appendChild(el);
    }

    return el;
}

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
        throw new Error('Failed to convert the element to an SVGElement');
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
        throw new Error('Failed to convert the element to an SVGGraphicsElement');
    }
}

//#region Casting
export function isSvgElement(element: any): element is SVGGraphicsElement {
    return element !== undefined && element.ownerSVGElement;
}

export function isSvgGraphicsElement(element: any): element is SVGGraphicsElement {
    return element !== undefined
        && element.transform !== undefined
        && SvgGraphicElements.indexOf(element.tagName) !== -1;
}

export function isSvgDefsElement(element: any): element is SVGDefsElement {
    return element !== undefined
        && isSvgElement(element)
        && element.tagName === 'DEFS';
}

export function isSvgSvgElement(element: any): element is SVGSVGElement {
    return element !== undefined
        && element.x !== undefined
        && element.y !== undefined
        && element.viewBox !== undefined
        && element.getCurrentTime !== undefined
        && element.tagName.toLowerCase() === 'svg';
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
    return element !== undefined
        && element.pathLength
        && element.getTotalLength
        && element.getPointAtLength
        && element.tagName.toLowerCase() === 'path';
}

//#endregion
export function getAllSubElementWhichInheritColors(parentElement: SVGGraphicsElement) {

    // Get all child nodes
    const sub_elements: SVGGraphicsElement[] = [];

    if (parentElement.tagName === 'g') {

        // First check if the parent element has a fill/stroke
        for (let i = 0; i < parentElement.childElementCount; i++) {
            const element = sub_elements[i];

            const fill = element.getAttribute('fill');
            const stroke = element.getAttribute('stroke');

            if (fill === undefined
                || fill === 'inherit'
                || stroke === undefined
                || stroke === 'inherit') {
                sub_elements.push(element);
            }
        }
    }

    return sub_elements;
}

function parents(element: Element, selector: string): Element[] {
    const allMatches = Array.from(document.querySelectorAll(selector));
    const matches: Element[] = [];
    for (let currentEl = element.parentElement;
        currentEl !== undefined;
        currentEl = currentEl.parentElement) {
        if (allMatches.find(el => el === currentEl)) {
            matches.push(currentEl);
        }
    }

    return matches;
}

function closest(element: Element, selector: string): Element {
    const allMatches = Array.from(document.querySelectorAll(selector));
    let match: Element;
    for (let currentEl = element.parentElement;
        currentEl !== undefined;
        currentEl = currentEl.parentElement) {
        if (allMatches.find(el => el === currentEl)) {
            match = currentEl;
            break;
        }
    }

    if (match === undefined) {
        throw new Error();
    }

    return match;
}

function farthest(element: Element, selector: string): Element {
    const allMatches = Array.from(document.querySelectorAll(selector));
    let match: Element;
    for (let currentEl = element.parentElement;
        currentEl !== undefined;
        currentEl = currentEl.parentElement) {
        if (allMatches.find(el => el === currentEl)) {
            match = currentEl;
            break;
        }
    }

    if (match === undefined) {
        throw new Error();
    }

    return match;
}

/**
 * Will attempt to locate the element specified in the id.
 * @param element
 * @param attr - Will check both the attr and xlink:attr.
 */
export function getElementAttrPointsTo(element: Element,
    attr: string = 'href'): Element|undefined {
    let result: Element|undefined;

    // Checks for a url() in the attribute
    const regex = /url\((#.*)\)/g;

    // Need to check href and xlink:href (not all clipart has been updated
    // to use href yet)
    const matches = regex.exec(element.getAttribute(attr)
        || element.getAttribute(`xlink:${attr}`)
        || '');

    if (matches != null && matches.length >= 2) {
        const otherId = matches[1];
        const parentSvg = closest(element, 'svg');
        result = parentSvg.querySelector(`#${otherId}`);
    }

    return result;
}

/**
 * Retrieves the reference to the element pointed to by a url(#...) string.
 * @param url - Must be in the format 'url(#...)'.
 */
export function getElementUrlPointsTo(url: string): Element {

    // Checks for a url() in the attribute
    const regex = /url\((#.*)\)/g;

    const matches = getAllGroupsV2(regex, url);
    const firstMatch = matches[0];

    const node = d3.select<Element, {}>(firstMatch).node();
    if (node === undefined) {
        throw new Error(`Failed to find element matching selector "${firstMatch}".`);
    }

    return node;
}

function getLargeFlagArc(angle: number): number {
    return angle > 180 ? 1 : 0;
}

function getYCircleCoord(currentAngle: number, radius: number): number {
    const y = Math.sin(toRadians(currentAngle)) * radius;

    // Account for offsets
    // if (currentAngle <= 180) {
    //     y = radius - y;
    // } else {
    //     y = radius - y;
    // }
    return radius - y;
}

function getXCircleCoord(currentAngle: number, radius: number): number {
    const x = Math.cos(toRadians(currentAngle)) * radius;

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
    const parentEls: Element[] = [];

    // Check if the current element is a svg
    if (isSvgSvgElement(element)) {
        parentEls.push(element);
    }

    let currentEl = element.parentElement;
    while (currentEl != null) {
        if (currentEl.tagName.toLowerCase() === 'svg') {
            parentEls.push(currentEl);
        }

        currentEl = currentEl.parentElement;
    }

    const lastSvgParent = parentEls.pop();

    if (isSvgSvgElement(lastSvgParent)) {
        return lastSvgParent;
    } else {
        throw new Error('Failed to cast the last svg parent element to the SVGSVGElement interface.');
    }
}

export interface PointAlongAngleFromPointData {
    pt_a: Coords2D;
    pt_b: Coords2D;
    radius: number;
}

export interface PointAlongAngleFromAngleData {
    pt_a: Coords2D;
    angle: number;
    radius: number;
}

export function isPointAlongAngleFromPointData(data: any): data is PointAlongAngleFromPointData {
    return (data !== undefined
        && data.pt_a !== undefined
        && data.pt_b !== undefined
        && data.radius !== undefined);
}

export function isPointAlongAngleFromAngleData(data: any): data is PointAlongAngleFromAngleData {
    return (data !== undefined
        && data.pt_a !== undefined
        && data.angle !== undefined
        && data.radius !== undefined);
}

/**
 * Returns a new point along a line between two points that is a 'hyp' amount
 * away from pt_a. The center of the circle is assumed to be pt_a.
 */
export function getNewPointAlongAngle(data: PointAlongAngleFromAngleData|PointAlongAngleFromPointData): Coords2D {
    const result: Coords2D = {
        x: 0,
        y: 0
    };

    if (isPointAlongAngleFromPointData(data)) {
        const pointData = data as PointAlongAngleFromPointData;
        const { pt_a, pt_b, radius } = pointData;

        const angle = Math.atan2((pt_b.y - pt_a.y), (pt_b.x - pt_a.x));
        result.x = pt_a.x + (Math.cos(angle) * radius);
        result.y = pt_a.y + (Math.sin(angle) * radius);

    } else if (isPointAlongAngleFromAngleData(data)) {
        const pointData = data as PointAlongAngleFromAngleData;
        const { pt_a, angle, radius } = pointData;

        result.x = pt_a.x + (Math.cos(angle) * radius);
        result.y = pt_a.y + (Math.sin(angle) * radius);
    } else {
        throw new Error('Could not determine type of \'data\'.');
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

    const arc = d3.arc()({
        innerRadius: 0,
        outerRadius: radius,
        startAngle: startAngle,
        endAngle: endAngle
    }) || '';

    return arc.replace(/L.*/, '');
}

/**
 * Returns the angle in degrees between two points.
 * @param pt_a
 * @param pt_b
 */
export function getAngle(pt_a: Coords2D, pt_b: Coords2D): number {
    const zeroed_pt_b = {
        x: pt_b.x - pt_a.x,
        y: pt_b.y - pt_a.y
    };

    const angle = Math.atan2(zeroed_pt_b.y, zeroed_pt_b.x);

    return toDegrees(angle);
}
