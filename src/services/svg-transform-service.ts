import { DOMMatrix } from "geometry-interfaces";

import { toDegrees, toRadians } from "../helpers/math-helpers";
import { getAllGroups, replaceNthOccurance, getNthOccurance } from "../helpers/regex-helper";
import { getDOMMatrix } from "../helpers/node-helper";
import { getFurthestSvgOwner } from "../helpers/svg-helpers";
import { NS } from '../helpers/namespaces-helper';

export interface ICoords2D {
    x: number;
    y: number;
}

export interface IBBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type IScaleMatrix = ICoords2D;
export type ITranslationMatrix = ICoords2D;
export type ISkewMatrix = ICoords2D;

export interface IRotationMatrix {
    a: number;
    cx?: number;
    cy?: number;
}

export interface ITransformMatrixData {
    rotation?: IRotationMatrix;
    scale?: IScaleMatrix;
    translation?: ITranslationMatrix;
    skew?: ISkewMatrix;
    matrix?: IMatrixMatrix;
}

export interface ITransformMatrix {
    rotation: IRotationMatrix;
    scale: IScaleMatrix;
    translation: ITranslationMatrix;
    skew: ISkewMatrix;
}

export interface IMatrixMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

/**
 * Default implementation of ITransformMatrix
 */
export class DefaultTransformMatrix implements ITransformMatrix {
    public rotation: IRotationMatrix;
    public scale: IScaleMatrix;
    public skew: ISkewMatrix;
    public translation: ITranslationMatrix;
    
    constructor() {
        this.rotation = {
            a: 0,
            cx: 0,
            cy: 0
        };

        this.scale = {
            x: 1,
            y: 1
        }

        this.skew = {
            x: 0,
            y: 0
        }

        this.translation = {
            x: 0,
            y: 0
        }
    }
}

export enum TransformType {
    ROTATE,
    SCALE,
    SKEW_X,
    SKEW_Y,
    TRANSLATE,
    MATRIX
}

export interface ISvgTransformServiceData {
    order?: TransformType[];
}

const translateRegex = /translate\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
const rotateRegex = /rotate\(\s*([\-\d\.]+)\s*,?([\-\d\.]+)?,?([\-\d\.]+)?\)/g;
const scaleRegex = /scale\(\s*([\-\d\.]+)\s*,([\-\d\.]+)\)/g;
const matrixRegex = /matrix\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
const skewXRegex = /skewX\(\s*([\-\d\.]+)\s*\)/g;
const skewYRegex = /skewY\(\s*([\-\d\.]+)\s*\)/g;

/**
 * Responsible for applying and retrieving transformations from an element.
 */
export class SvgTransformService {
    //#region Fields

    private readonly transformsRegex: RegExp;
    private readonly translateRegex: RegExp;
    private readonly rotateRegex: RegExp;
    private readonly scaleRegex: RegExp;
    private readonly matrixRegex: RegExp;
    private readonly skewXRegex: RegExp;
    private readonly skewYRegex: RegExp;
    private readonly _defaultTransformString: string;

    private _canRotate: boolean;
    private _canScale: boolean;
    private _canSkew: boolean;
    private _canTranslate: boolean;

    //#endregion

    //#region Ctor

    constructor(data: ISvgTransformServiceData = {}) {
        this.translateRegex = /translate\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
        this.rotateRegex = /rotate\(\s*([\-\d\.]+)\s*,?([\-\d\.]+)?,?([\-\d\.]+)?\)/g;
        this.scaleRegex = /scale\(\s*([\-\d\.]+)\s*,([\-\d\.]+)\)/g;
        this.matrixRegex = /matrix\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/g;
        this.skewXRegex = /skewX\(\s*([\-\d\.]+)\s*\)/g;
        this.skewYRegex = /skewY\(\s*([\-\d\.]+)\s*\)/g;
        this._canRotate = false;
        this._canScale = false;
        this._canSkew = false;
        this._canTranslate = false;

        if (data.order) {
            let str = "";
            let reg = "";
            data.order.map(t => {
                switch(t) {
                    case TransformType.ROTATE:
                        str += " rotate(0,0,0)";
                        reg += ` ${this.regexToString(this.rotateRegex)}`;
                        this._canRotate = true;
                        break;
                    case TransformType.SCALE:
                        str += " scale(1,1)";
                        reg += ` ${this.regexToString(this.scaleRegex)}`;
                        this._canScale = true;
                        break;
                    case TransformType.SKEW_X:
                        str += " skewX(0)";
                        reg += ` ${this.regexToString(this.skewXRegex)}`;
                        this._canSkew = true;
                        break;
                    case TransformType.SKEW_Y:
                        str += " skewY(0)";
                        reg += ` ${this.regexToString(this.skewYRegex)}`;
                        this._canSkew = true;
                        break;
                    case TransformType.TRANSLATE:
                        str += " translate(0,0)";
                        reg += ` ${this.regexToString(this.translateRegex)}`
                        this._canTranslate = true;
                        break; 
                    default:
                        throw new Error("Transform type not yet supported.");
                }
            });

            this.transformsRegex = RegExp(reg.trimLeft());
            this._defaultTransformString = str.trimLeft();
        } else {
            this._defaultTransformString = "translate(0,0) rotate(0,0,0) scale(1,1) skewX(0) skewY(0)";
            this.transformsRegex = /translate[^a-z]+ rotate[^a-z]+ scale[^a-z/]+ skewX[^a-z]+ skewY[^a-z]+/;
            this._canRotate = true;
            this._canScale = true;
            this._canSkew = true;
            this._canTranslate = true;
        }
    }

    //#endregion

    //#region Properties

    get canRotate() {
        return this._canRotate;
    }

    get canScale() {
        return this._canScale;
    }

    get canSkew() {
        return this._canSkew;
    }

    get canTranslate() {
        return this._canTranslate;
    }

    get defaultTransformString() {
        return this._defaultTransformString;
    }

    //#endregion

    //#region Functions

    private regexToString(regex: RegExp): string {
        let stringified = regex.toString();
        return stringified.substr(1, stringified.length - 2);
    }

    public extractTransformProperties(matrix: DOMMatrix|string): ITransformMatrixData {

        let transformMatrix = new DefaultTransformMatrix();

        if (matrix instanceof DOMMatrix) {
            transformMatrix.rotation = {
                // Convert to degrees as well
                a: toDegrees(Math.acos(matrix.a)),
                cx: 0,
                cy: 0
            };

            transformMatrix.scale = {
                x: matrix.a,
                y: matrix.d
            };

            transformMatrix.skew = {
                x: toDegrees(Math.atan(matrix.c)),
                y: toDegrees(Math.atan(matrix.b))
            };

            transformMatrix.translation = {
                x: matrix.e,
                y: matrix.f
            };
        } else {

            // // Determine which is the correct regex to use
            // let regexToUse: RegExp;
            // switch(transformType) {
            //     case SVGTransform.SVG_TRANSFORM_MATRIX:
            //         regexToUse = this.matrixRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_ROTATE:
            //         regexToUse = this.rotateRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_SCALE:
            //         regexToUse = this.scaleRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_SKEWX:
            //         regexToUse = this.skewXRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_SKEWY:
            //         regexToUse = this.skewYRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_TRANSLATE:
            //         regexToUse = this.translateRegex;
            //         break;
            //     case SVGTransform.SVG_TRANSFORM_UNKNOWN:
            //     default:
            //         throw new Error(`TransformType '${transformType}' is not supported.`)
            // }

            let matches = getAllGroups(this.rotateRegex, matrix);

            // Handle rotation
            for (let match of matches) {

                // Make sure that the match contains at least one entry.
                if (match.length >= 1) {
                    let m_a = Number(match[0]);

                    // Verify the number is valid
                    if (!Number.isNaN(m_a)) {
                        transformMatrix.rotation.a += m_a;
                    }

                    // Check if there are other values
                    if (match.length == 3) {
                        let m_cx = Number(match[1]);
                        let m_cy = Number(match[2]);

                        // Check if valid number
                        if (!Number.isNaN(m_cx)) {

                            // Check for undefined
                            if (transformMatrix.rotation.cx == undefined) {
                                transformMatrix.rotation.cx = m_cx;
                            } else {
                                transformMatrix.rotation.cx += m_cx;
                            }
                        }

                        // Check if valid number
                        if (!Number.isNaN(m_cy)) {

                            // Check for undefined
                            if (transformMatrix.rotation.cy == undefined) {
                                transformMatrix.rotation.cy = m_cy;
                            } else {
                                transformMatrix.rotation.cy += m_cy;
                            }
                        }
                    }
                }
            }

            matches = getAllGroups(this.scaleRegex, matrix);

            // Handle scale
            for (let match of matches) {

                // Make sure each result has only two entries
                if (match.length == 2) {
                    let m_x = Number(match[0]);
                    let m_y = Number(match[1]);

                    // Check if valid number
                    if (!Number.isNaN(m_x)) {
                        transformMatrix.scale.x += m_x;
                    }

                    // Check if valid number
                    if (!Number.isNaN(m_y)) {
                        transformMatrix.scale.y += m_y;
                    }
                }
            }



            matches = getAllGroups(this.skewXRegex, matrix);

            // Handle skewX
            for (let match of matches) {

                // Make sure each result has only one entry
                if (match.length == 1) {
                    let m_x = Number(match[0]);

                    // Check if valid number
                    if (!Number.isNaN(m_x)) {
                        transformMatrix.skew.x += m_x;
                    }
                }
            }

            matches = getAllGroups(this.skewYRegex, matrix);

            // Handle skewY
            for (let match of matches) {
                
                // Make sure each result has only one entry
                if (match.length == 1) {
                    let m_y = Number(match[0]);

                    // Check if valid number
                    if (!Number.isNaN(m_y)) {
                        transformMatrix.skew.y += m_y;
                    }
                }
            }

            // Find all translations
            matches = getAllGroups(this.translateRegex, matrix);
            
            // Sum up translations
            for (let match of matches) {

                // Make sure the number of results is only two.
                if (match.length == 2) {
                    let m_x = Number(match[0]);
                    let m_y = Number(match[1]);
                
                    // Check that the parsed number is valid
                    if (!Number.isNaN(m_x)) {
                        transformMatrix.translation.x += m_x
                    }

                    if (!Number.isNaN(m_y)) {
                        transformMatrix.translation.y += m_y;
                    }
                }
            }
        }

        return transformMatrix;
    }

    /**
     * A cross browser polyfill for SVGGraphicsElement.getBBox(). This assumes
     * that all elements passed in have the same furthest svg parent.
     * @param elements 
     * @throws - Throws an error if the element has no parent svg element.
     */
    public getBBox(...elements: SVGGraphicsElement[]): IBBox {
        
        // Check for any elements.
        if (elements.length == 0) {
            throw new Error("No elements were passed in.");
        }

        let parentSvgBBox = getFurthestSvgOwner(elements[0])
            .getBoundingClientRect();

        let firstElBBox = elements[0].getBoundingClientRect();

        let bbox = {
            top: firstElBBox.top,
            bottom: firstElBBox.bottom,
            left: firstElBBox.left,
            right: firstElBBox.right
        };

        for (let i = 1; i < elements.length; i++) {
            let element = elements[i];
            let elBBox = element.getBoundingClientRect();

            // Check the top
            if (elBBox.top < bbox.top) {
                bbox.top = elBBox.top;
            }

            // Check the bottom
            if (elBBox.bottom > bbox.bottom) {
                bbox.bottom = elBBox.bottom;
            }

            // Check the left
            if (elBBox.left < bbox.left) {
                bbox.left = elBBox.left;
            }

            // Check right
            if (elBBox.right > bbox.right) {
                bbox.right = elBBox.right;
            }
        }

        return {
            x: bbox.left - parentSvgBBox.left,
            y: bbox.top - parentSvgBBox.top,
            width: (bbox.right - parentSvgBBox.left) - (bbox.left - parentSvgBBox.left),
            height: (bbox.bottom - parentSvgBBox.top) - (bbox.top - parentSvgBBox.top)
        };
    }

    /**
     * Gets the center of an element relative to another element.
     * @param relativeEl 
     * @param elements 
     */
    public getBBoxRelativeTo(relativeEl: SVGGraphicsElement, ...elements: SVGGraphicsElement[]): IBBox {
        let parentBCR = relativeEl.getBoundingClientRect();
        let firstElBCR = elements[0].getBoundingClientRect();

        let pointsRelativeTo = {
            x: parentBCR.left,
            y: parentBCR.top
        };

        let bbox = this.getBBox(...elements);
        bbox.x -= pointsRelativeTo.x;
        bbox.y -= pointsRelativeTo.y;

        if (bbox == null) {
            return {
                x: 0,
                y: 0,
                width: 0,
                height: 0
            };
        } else {
            return bbox;
        }
    }

    /**
     * Gets the center of an element relative to it's parent svg element.
     * @param elements 
     * @return {ICoords2D}
     */
    public getCenter(...elements: SVGGraphicsElement[]): ICoords2D {
        let bbox = this.getBBox(...elements);

        return {
            x: bbox.x + (bbox.width / 2),
            y: bbox.y + (bbox.height / 2)
        };
    }

    /**
     * Gets the center of elements relative to the x and y coords of the
     * relative element.
     * @param relativeEl
     * @param elements
     */
    public getCenterRelativeToElement(relativeEl: SVGGraphicsElement, ...elements: SVGGraphicsElement[]): ICoords2D {
        let parentBBox = this.getBBox(relativeEl);
        let centerOfEls = this.getCenter(...elements);

        return {
            x: centerOfEls.x - parentBBox.x,
            y: centerOfEls.y - parentBBox.y
        };
    }

    public getCenterRelativeToPoint(point: ICoords2D, ...elements: SVGGraphicsElement[]): ICoords2D {
        let centerOfEls = this.getCenter(...elements);

        return {
            x: centerOfEls.x - point.x,
            y: centerOfEls.y - point.y
        };
    }

    /**
     * Returns an array containing the bounding boxes of all intersections
     * between the passed elements.
     * @param elements 
     */
    public getIntersectionOfItems(...elements: SVGGraphicsElement[]): IBBox[] {

        // Store all intersections in bbox objects
        let intersections: IBBox[] = [];

        // Check that at least two elements were passed in
        if (elements.length < 2) {
            return intersections;
        }

        // Copy array to prevent any modifications to it.
        let copyOfEls = [ ...elements ];

        // Two nested for loops, compare each element against every other
        // element and create
        while (copyOfEls.length > 0) {

            // No need for a null check here, just cast as SVGElement
            let targetedEl = <SVGGraphicsElement>copyOfEls.shift();
            let targetBBox = this.getBBox(targetedEl);
            
            for (let otherEl of copyOfEls) {

                // Get bbox of otherEl
                let otherBBox: IBBox = this.getBBox(otherEl);

                // Check for any height overlap
                if ((targetBBox.y + targetBBox.height) >= otherBBox.y) {
                    
                    // Not possible for any overlap, ignore this one
                    continue;
                }

                // Check for any width overlap
                if ((targetBBox.x + targetBBox.width) <= otherBBox.x) {

                    // Not possible for any overlap, ignore this one
                    continue;
                }

                let overlapRect: IBBox = {
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0
                };

                // Check which one is more left
                if (targetBBox.x >= otherBBox.x) {
                    overlapRect.x = otherBBox.x;
                } else {
                    overlapRect.x = targetBBox.x;
                }

                // Check which one is more right
                if ((targetBBox.x + targetBBox.width) 
                    >= (otherBBox.x + otherBBox.width))
                {
                    overlapRect.width = otherBBox.x + otherBBox.width;
                } else {
                    overlapRect.width = targetBBox.x + targetBBox.width;
                }

                // Check which one is higher
                if (targetBBox.y <= otherBBox.y) {
                    overlapRect.y = otherBBox.y;
                } else {
                    overlapRect.y = targetBBox.y;
                }

                // Check which one is lower
                if ((targetBBox.y + targetBBox.height) 
                    <= (otherBBox.y + otherBBox.height))
                {
                    overlapRect.height = targetBBox.height;
                } else {
                    overlapRect.height = otherBBox.height;
                }

                // Store the intersection
                intersections.push(overlapRect);
            }
        }

        return intersections;
    }

    public convertScreenCoordsToSvgCoords(point: ICoords2D, svgEl: SVGSVGElement): ICoords2D {
        let svgBBox = svgEl.getBoundingClientRect();

        return {
            x: point.x - svgBBox.left,
            y: point.y - svgBBox.top
        };
    }

    /**
     * Updates the transforms of an element to follow a more standard
     * approach. This allows for a smoother experience when applying multiple
     * transformations instead of dealing with the messes that occur when 
     * mixing attributes & transforms. This will not remove the x/y or cx/cy
     * attributes from an element (This feature is a WIP).
     * @param element 
     */
    public standardizeTransforms(element: SVGGraphicsElement): void {
        let transforms = element.getAttribute("transform");
        let xAttr = element.getAttribute("x");
        let yAttr = element.getAttribute("y");
        let cxAttr = element.getAttribute("cx");
        let cyAttr = element.getAttribute("cy");

        let transformStr = this._defaultTransformString;

        // Set the x/y/cx/cy attributes to zero
        if (xAttr != null || yAttr != null) {
            element.setAttribute("x", "0");
            element.setAttribute("y", "0");
            transformStr = transformStr.replace(this.translateRegex,
                `translate(${xAttr || "0"},${yAttr || "0"})`);
        }

        if (cxAttr != null || cyAttr != null) {
            element.setAttribute("cx", "0");
            element.setAttribute("cy", "0");
            transformStr = transformStr.replace(this.translateRegex,
                `translate(${cxAttr || "0"},${cyAttr || "0"})`);
        }

        // If no transforms are applied setup standard transforms
        if (transforms == null || transforms.length == 0) {
            let xOffset = Number(xAttr || 0) + Number(cxAttr || 0);
            let yOffset = Number(yAttr || 0) + Number(cyAttr || 0);

            transformStr = transformStr.replace(this.translateRegex, `translate(${xOffset},${yOffset})`);
            element.setAttribute("transform", transformStr);
        } else {

            // Try and extract all existing translations, rotations, scales,
            // and matricies.
            let totalTransforms = element.transform.baseVal.consolidate();
        }
    }

    public areTransformsStandardized(element: SVGGraphicsElement): boolean {
        let transforms = element.getAttribute("transform");
        
        // Check for null/empty values
        if (transforms == null || transforms.length == 0) {
            return false;
        }

        let matches = transforms.match(this.transformsRegex);
        
        // Check for null again
        if (matches == null) {
            return false;
        }

        return matches.length == 1;
    }

    public setScale(element: SVGGraphicsElement, matrix: IScaleMatrix, index: number = 1): void {
        let transformStr = element.getAttribute("transform") || "";
        let currentIndex = 1;
        transformStr = transformStr.replace(this.rotateRegex, function(match: string, ...matches: string[]) {
            let result = "";

            if (currentIndex == index) {
                result = `rotate(${matrix.x},${matrix.y})`;
            } else {
                result = match;
            }
            
            currentIndex++;
            return result;
        });
        element.setAttribute("transform", transformStr);
    }

    public getScale(element: SVGGraphicsElement, index: number = 1): IScaleMatrix {
        let result: IScaleMatrix = {
            x: 1,
            y: 1
        };

        if (!this.areTransformsStandardized(element)) {
            return {
                x: 1,
                y: 1
            }
        }

        return result;
    }

    public incrementScale(element: SVGGraphicsElement, matrix: IScaleMatrix, index: number = 1): void {
        let scale = this.getScale(element);
        this.setScale(element, {
            x: scale.x + matrix.x,
            y: scale.y + matrix.y
        });
    }

    public setRotation(element: SVGGraphicsElement, matrix: IRotationMatrix, index: number = 1): void {
        let transformStr = element.getAttribute("transform") || "";
        let currentIndex = 1;
        let currentRotation = this.getRotation(element);
        transformStr = transformStr.replace(this.rotateRegex, function(match: string, ...matches: string[]) {
            let result = "";

            if (currentIndex == index) {
                result = `rotate(${matrix.a},${matrix.cx || currentRotation.cx || 0},${matrix.cy || currentRotation.cy || 0})`;
            } else {
                result = match;
            }
            
            currentIndex++;
            return result;
        });
        element.setAttribute("transform", transformStr);
    }

    public getRotation(element: SVGGraphicsElement, index: number = 1): IRotationMatrix {
        let transformMatrix = this.extractTransformProperties(getDOMMatrix(element));
        if (transformMatrix.rotation != undefined) {
            return transformMatrix.rotation;
        } else {
            throw new Error();
        }
    }

    public incrementRotation(element: SVGGraphicsElement, matrix: IRotationMatrix, index: number = 1): void {
        let rot = this.getRotation(element);
        this.setRotation(element, {
            cx: (rot.cx || 0) + (matrix.cx || 0),
            cy: (rot.cy || 0) + (matrix.cy || 0),
            a: rot.a + matrix.a
        });
    }

    public setTranslation(element: SVGGraphicsElement, matrix: ITranslationMatrix, index: number = 1): void {
        let transformStr = element.getAttribute("transform") || "";
        let currentIndex = 1;
        transformStr = transformStr.replace(this.translateRegex, function(match: string, ...matches: string[]) {
            let result = "";

            if (currentIndex == index) {
                result = `translate(${matrix.x.toFixed(3)},${matrix.y.toFixed(3)})`;
            } else {
                result = match;
            }
            
            currentIndex++;
            return result;
        });
        element.setAttribute("transform", transformStr);
    }

    public getTranslation(element: SVGGraphicsElement, index: number = 1): ITranslationMatrix {
        let transformMatrix = this.extractTransformProperties(getDOMMatrix(element));
        if (transformMatrix.translation != undefined) {
            return transformMatrix.translation;
        } else {
            throw new Error();
        }
    }

    public incrementTranslation(element: SVGGraphicsElement, matrix: ITranslationMatrix, index: number = 1): void {
        let translate = this.getTranslation(element);
        this.setTranslation(element, {
            x: translate.x + matrix.x,
            y: translate.y + matrix.y
        });
    }

    public setTransform(element: SVGGraphicsElement, transform: ITransformMatrixData, index: number = 1): void {
        if (transform.scale)
            this.setScale(element, transform.scale)

        if (transform.rotation)
            this.setRotation(element, transform.rotation);

        if (transform.translation)
            this.setTranslation(element, transform.translation);
    }

    //#endregion
}

// Export singleton
let SvgTransformServiceSingleton = new SvgTransformService();
export { SvgTransformServiceSingleton };

export class TransformStringService {
    //#region Fields

    private readonly transformsRegex: RegExp;
    private readonly translateRegex: RegExp;
    private readonly rotateRegex: RegExp;
    private readonly scaleRegex: RegExp;
    private readonly matrixRegex: RegExp;
    private readonly skewXRegex: RegExp;
    private readonly skewYRegex: RegExp;
    private readonly _defaultTransformString: string;

    private _canRotate: boolean;
    private _canScale: boolean;
    private _canSkewX: boolean;
    private _canSkewY: boolean;
    private _canTranslate: boolean;

    //#endregion

    //#region Ctor

    public constructor(data: ISvgTransformServiceData = {}) {
        this.translateRegex = /translate\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
        this.rotateRegex = /rotate\(\s*([\-\d\.]+)\s*,?([\-\d\.]+)?,?([\-\d\.]+)?\)/g;
        this.scaleRegex = /scale\(\s*([\-\d\.]+)\s*,([\-\d\.]+)\)/g;
        this.matrixRegex = /matrix\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/g;
        this.skewXRegex = /skewX\(\s*([\-\d\.]+)\s*\)/g;
        this.skewYRegex = /skewY\(\s*([\-\d\.]+)\s*\)/g;
        this._canRotate = false;
        this._canScale = false;
        this._canSkewX = false;
        this._canSkewY = false;
        this._canTranslate = false;

        if (data.order) {
            let str = "";
            let reg = "";
            data.order.map(t => {
                switch(t) {
                    case TransformType.ROTATE:
                        str += " rotate(0,0,0)";
                        reg += ` ${this.regexToString(this.rotateRegex)}`;
                        this._canRotate = true;
                        break;
                    case TransformType.SCALE:
                        str += " scale(1,1)";
                        reg += ` ${this.regexToString(this.scaleRegex)}`;
                        this._canScale = true;
                        break;
                    case TransformType.SKEW_X:
                        str += " skewX(0)";
                        reg += ` ${this.regexToString(this.skewXRegex)}`;
                        this._canSkewX = true;
                        break;
                    case TransformType.SKEW_Y:
                        str += " skewY(0)";
                        reg += ` ${this.regexToString(this.skewYRegex)}`;
                        this._canSkewY = true;
                        break;
                    case TransformType.TRANSLATE:
                        str += " translate(0,0)";
                        reg += ` ${this.regexToString(this.translateRegex)}`
                        this._canTranslate = true;
                        break; 
                    default:
                        throw new Error("Transform type not yet supported.");
                }
            });

            this.transformsRegex = RegExp(`${reg.trimLeft()}`);
            this._defaultTransformString = str.trimLeft();
        } else {
            this._defaultTransformString = "translate(0,0) rotate(0,0,0) scale(1,1) skewX(0) skewY(0)";
            this.transformsRegex = /translate[^a-z]+ rotate[^a-z]+ scale[^a-z/]+ skewX[^a-z]+ skewY[^a-z]+/;
            this._canRotate = true;
            this._canScale = true;
            this._canSkewX = true;
            this._canSkewY = true;
            this._canTranslate = true;
        }
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    private regexToString(regex: RegExp): string {
        let stringified = regex.toString();
        return stringified.substr(1, stringified.length - 2);
    }

    //#endregion
}

export interface ITransformable {
    //#region Functions
    hasRotate(): boolean;
    hasScale(): boolean;
    hasSkewX(): boolean;
    hasSkewY(): boolean;
    hasTranslate(): boolean;
    hasMatrix(): boolean;
    getMatrix(index?: number): IMatrixMatrix;
    setMatrix(value: IMatrixMatrix, index?: number): ITransformable;
    incrementMatrix(value: IMatrixMatrix, index?: number): ITransformable;
    getTranslate(index?: number): ITranslationMatrix;
    setTranslate(value: ITranslationMatrix, index?: number): ITransformable;
    incrementTranslate(value: ITranslationMatrix, index?: number): ITransformable;
    getScale(index?: number): IScaleMatrix;
    setScale(value: IScaleMatrix, index?: number): ITransformable;
    incrementScale(value: IScaleMatrix, index?: number): ITransformable;
    getRotation(index?: number): IRotationMatrix;
    setRotation(value: IRotationMatrix, index?: number): ITransformable;
    incrementRotation(value: IRotationMatrix, index?: number): ITransformable;
    getSkewX(index?: number): number;
    setSkewX(value: number, index?: number): ITransformable;
    incrementSkewX(value: number, index?: number): ITransformable;
    getSkewY(index?: number): number;
    setSkewY(value: number, index?: number): ITransformable;
    incrementSkewY(value: number, index?: number): ITransformable;
    consolidate(): ITransformable;
    toTransformString(): string;
    //#endregion
}

export class SvgTransformString implements ITransformable {
    //#region Fields

    private static SVGCanvasElement: SVGSVGElement
        = <SVGSVGElement>document.createElementNS(NS.SVG, "svg");

    private transformString: string;
    private data: TransformType[];
    private _hasMatrix: boolean;
    private _hasRotate: boolean;
    private _hasScale: boolean;
    private _hasSkewX: boolean;
    private _hasSkewY: boolean;
    private _hasTranslate: boolean;

    //#endregion

    //#region Ctor

    public constructor(svgTransform: string|TransformType[]) {        
        if (Array.isArray(svgTransform)) {
            this.data = svgTransform;
            this.transformString = "";
            for (let transform of this.data) {
                switch (transform) {
                    case TransformType.MATRIX:
                        this.transformString += " matrix(1,0,0,1,0,0)";
                        break;
                    case TransformType.ROTATE:
                        this.transformString += " rotate(0,0,0)";
                        break;
                    case TransformType.SCALE:
                        this.transformString += " scale(1,1)";
                        break;
                    case TransformType.SKEW_X:
                        this.transformString += " skewX(0)";
                        break;
                    case TransformType.SKEW_Y:
                        this.transformString += " skewY(0)";
                        break;
                    case TransformType.TRANSLATE:
                        this.transformString += " translate(0,0)";
                        break;
                    default:
                        throw new Error();
                }
            }
            this.transformString.trimLeft();
        } else {
            this.data = this.parseTransformString(svgTransform);
            this.transformString = svgTransform;
        }
        this._hasMatrix = this.data.indexOf(TransformType.MATRIX) != -1;
        this._hasRotate = this.data.indexOf(TransformType.ROTATE) != -1;
        this._hasScale = this.data.indexOf(TransformType.SCALE) != -1;
        this._hasSkewX = this.data.indexOf(TransformType.SKEW_X) != -1;
        this._hasSkewY = this.data.indexOf(TransformType.SKEW_Y) != -1;
        this._hasTranslate = this.data.indexOf(TransformType.TRANSLATE) != -1;
    }

    //#endregion

    //#region Functions
    private parseTransformString(transformStr: string): TransformType[] {
        let t_data: TransformType[] = [];

        let groups = transformStr.split(" ").filter(str => str != "");
        for (let group of groups) {
            do {
                // Check if rotate
                if (rotateRegex.test(group)) {
                    t_data.push(TransformType.ROTATE);
                    break;
                }

                // Check if scale
                if (scaleRegex.test(group)) {
                    t_data.push(TransformType.SCALE);
                    break;
                }

                // Check if translate
                if (translateRegex.test(group)) {
                    t_data.push(TransformType.SCALE);
                    break;
                }

                // Check if matrix
                if (matrixRegex.test(group)) {
                    t_data.push(TransformType.MATRIX);
                    break;
                }

                // Check if skew x
                if (skewXRegex.test(group)) {
                    t_data.push(TransformType.SKEW_X);
                    break;
                }

                // Check if skew y
                if (skewYRegex.test(group)) {
                    t_data.push(TransformType.SKEW_Y);
                    break;
                }
            } while(false);
        }

        return t_data;
    }
    public hasMatrix(): boolean {
        return this._hasMatrix;
    }
    public hasRotate(): boolean {
        return this._hasRotate;
    }
    public hasScale(): boolean {
        return this._hasScale;
    }
    public hasSkewX(): boolean {
        return this._hasSkewX;
    }
    public hasSkewY(): boolean {
        return this._hasSkewY;
    }
    public hasTranslate(): boolean {
        return this._hasTranslate;
    }
    public getMatrix(index: number = 0): IMatrixMatrix {
        let matrix: IMatrixMatrix = {
            a: 1,
            b: 0,
            c: 0,
            d: 1,
            e: 0,
            f: 0
        };

        let matrixMatch =
            getNthOccurance(this.transformString, matrixRegex, index);

        matrix.a = Number(matrixMatch[1]);
        matrix.b = Number(matrixMatch[2]);
        matrix.c = Number(matrixMatch[3]);
        matrix.d = Number(matrixMatch[4]);
        matrix.e = Number(matrixMatch[5]);
        matrix.f = Number(matrixMatch[6]);

        return matrix;
    }
    public setMatrix(value: IMatrixMatrix, index: number = 0): ITransformable {
        let matrixStr = `matrix(${value.a.toFixed(6)},${value.b.toFixed(6)},${value.c.toFixed(6)},${value.d.toFixed(6)},${value.e.toFixed(6)},${value.f.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, matrixRegex, matrixStr, index);
        return this;
    }
    public incrementMatrix(value: IMatrixMatrix, index: number = 0): ITransformable {
        let matrix = this.getMatrix();
        matrix.a += value.a;
        matrix.b += value.b;
        matrix.c += value.c;
        matrix.d += value.d;
        matrix.e += value.e;
        matrix.f += value.f;
        this.setMatrix(matrix);
        return this;
    }
    public getRotation(index: number = 0): IRotationMatrix {
        let matrix: IRotationMatrix = {
            a: 0,
            cx: 0,
            cy: 0
        };

        let rotationMatch = 
            getNthOccurance(this.transformString, rotateRegex, index);
        
        matrix.a = Number(rotationMatch[1]);
        matrix.cx = Number(rotationMatch[2]) || 0;
        matrix.cy = Number(rotationMatch[2]) || 0;

        return matrix;
    }
    public setRotation(value: IRotationMatrix, index: number = 0): ITransformable {
        let rotationStr = `rotate(${value.a.toFixed(6)},${(value.cx || 0).toFixed(6)},${(value.cy || 0).toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, rotateRegex, rotationStr, index);
        return this;
    }
    public incrementRotation(value: IRotationMatrix, index: number = 0): ITransformable {
        let rotation = this.getRotation();
        rotation.a += value.a;
        rotation.cx = rotation.cx || 0;
        rotation.cy = rotation.cy || 0;
        
        if (value.cx) {
            rotation.cx += value.cx;
        }

        if (value.cy) {
            rotation.cy += value.cy;
        }

        this.setRotation(rotation);
        return this;
    }
    public getScale(index: number = 0): IScaleMatrix {
        let matrix: IScaleMatrix = {
            x: 1,
            y: 1
        };

        let skewMatch =
            getNthOccurance(this.transformString, scaleRegex, index);
        
        matrix.x = Number(skewMatch[1]);
        matrix.y = Number(skewMatch[2]);

        return matrix;
    }
    public setScale(value: IScaleMatrix, index: number = 0): ITransformable {
        let scaleStr = `scale(${value.x.toFixed(6)},${value.y.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, scaleRegex, scaleStr, index);
        return this;
    }
    public incrementScale(value: IScaleMatrix, index: number = 0): ITransformable {
        let scale = this.getScale(index);
        scale.x += value.x;
        scale.y += value.y;
        this.setScale(scale);
        return this;
    }
    public getSkewX(index: number = 0): number {
        let skewXMatch = 
            getNthOccurance(this.transformString, skewXRegex, index);

        return Number(skewXMatch[1]);
    }
    public setSkewX(value: number, index: number = 0): ITransformable {
        let skewXStr = `skewX(${value.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, skewXRegex, skewXStr, index);
        return this;
    }
    public incrementSkewX(value: number, index: number = 0): ITransformable {
        let skewX = this.getSkewX(index);
        skewX += value;
        this.setSkewX(skewX);
        return this;
    }
    public getSkewY(index: number = 0): number {
        let skewXMatch = 
            getNthOccurance(this.transformString, skewYRegex, index);

        return Number(skewXMatch[1]);
    }
    public setSkewY(value: number, index: number = 0): ITransformable {
        let skewYStr = `skewY(${value.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, skewYRegex, skewYStr, index);
        return this;
    }
    public incrementSkewY(value: number, index: number = 0): ITransformable {
        let skewX = this.getSkewY(index);
        skewX += value;
        this.setSkewX(skewX);
        return this;
    }
    public getTranslate(index: number = 0): ITranslationMatrix {
        let matrix: ITranslationMatrix = {
            x: 0,
            y: 0
        };

        let translateMatch = 
            getNthOccurance(this.transformString, translateRegex, index);

        matrix.x = Number(translateMatch[1]);
        matrix.y = Number(translateMatch[2]);

        return matrix;
    }
    public setTranslate(value: ITranslationMatrix, index: number = 0): ITransformable {
        let translateStr = `translate(${value.x.toFixed(6)},${value.y.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, translateRegex, translateStr, index);
        return this;
    }
    public incrementTranslate(value: ITranslationMatrix, index: number = 0): ITransformable {
        let translation = this.getTranslate(index);
        translation.x += value.x;
        translation.y += value.y;
        this.setTranslate(translation, index);
        return this;
    }
    public consolidate(): ITransformable {
        let svgcanvasEl = SvgTransformString.SVGCanvasElement;
        let matrix = svgcanvasEl.createSVGMatrix();

        let matrixCount = 0;
        let rotationCount = 0;
        let scaleCount = 0;
        let skewXCount = 0;
        let skewYCount = 0;
        let translateCount = 0;
        
        for (let type of this.data) {
            switch (type) {
                case TransformType.MATRIX: {
                    let { a,b,c,d,e,f } = this.getMatrix(matrixCount++);
                    let secondMatrix = svgcanvasEl.createSVGMatrix();
                    secondMatrix.a = a;
                    secondMatrix.b = b;
                    secondMatrix.c = c;
                    secondMatrix.d = d;
                    secondMatrix.e = e;
                    secondMatrix.f = f;
                    matrix = matrix.multiply(secondMatrix);
                    break;
                }
                case TransformType.ROTATE: {
                    let { a, cx = 0, cy = 0 } = this.getRotation(rotationCount++);
                    matrix = matrix
                        .translate(cx, cy)
                        .rotate(a)
                        .translate(-1 * cx, -1 * cy);
                    break;
                }
                case TransformType.SCALE: {
                    let { x, y } = this.getScale(scaleCount++);
                    matrix = matrix.scaleNonUniform(x, y);
                    break;
                }
                case TransformType.SKEW_X: {
                    let x = this.getSkewX(skewXCount++);
                    matrix = matrix.skewX(x);
                    break;
                }
                case TransformType.SKEW_Y: {
                    let x = this.getSkewY(skewYCount++);
                    matrix = matrix.skewY(x);
                    break;
                }
                case TransformType.TRANSLATE: {
                    let { x, y } = this.getTranslate(translateCount++);
                    matrix = matrix.translate(x, y);
                }
            }
        }

        this.data = [ TransformType.MATRIX ];
        this._hasMatrix = true;
        this._hasRotate = false;
        this._hasScale = false;
        this._hasScale = false;
        this._hasSkewX = false;
        this._hasSkewY = false;
        this._hasTranslate = false;
        this.data = [ TransformType.MATRIX ];
        let { a, b, c, d, e, f } = matrix;
        this.transformString = `matrix(${a},${b},${c},${d},${e},${f})`;        

        return this;
    }
    public toTransformString(): string {
        return this.transformString;
    }
    public static CreateDefaultTransform(): ITransformable {
        return new SvgTransformString([
            TransformType.MATRIX,
            TransformType.TRANSLATE,
            TransformType.ROTATE,
            TransformType.SKEW_X,
            TransformType.SKEW_Y,
            TransformType.SCALE
        ]);
    }
    //#endregion
}