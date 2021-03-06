import { ITransformable } from "../models/itransformable";

import { DOMMatrix } from "geometry-interfaces";

import { toDegrees, toRadians } from "../helpers/math-helpers";
import { getAllGroups, replaceNthOccurance, getNthOccurance } from "../helpers/regex-helper";
import { getDOMMatrix } from "../helpers/node-helper";
import { getFurthestSvgOwner } from "../helpers/svg-helpers";
import { NS } from '../helpers/namespaces-helper';
import { NotImplementedError } from "../models/errors";

export interface ICoords2D {
    x: number;
    y: number;
}

export function isICoords2D(value: any): value is ICoords2D {
    return value != undefined
        && value.x != undefined
        && value.y != undefined;
}

export interface IBBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function isIBBox(value: any): value is IBBox {
    return value != undefined
        && value.x != undefined
        && value.y != undefined
        && value.width != undefined
        && value.height != undefined;
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

export const numberRegex = /([\d\.\-]+)/g;
export const translateRegex = /translate\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
export const rotateRegex = /rotate\(\s*([\-\d\.]+)\s*,?([\-\d\.]+)?,?([\-\d\.]+)?\)/g;
export const scaleRegex = /scale\(\s*([\-\d\.]+)\s*,([\-\d\.]+)\)/g;
export const matrixRegex = /matrix\(\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*,\s*([\-\d\.]+)\s*\)/g;
export const skewXRegex = /skewX\(\s*([\-\d\.]+)\s*\)/g;
export const skewYRegex = /skewY\(\s*([\-\d\.]+)\s*\)/g;

/**
 * Responsible for applying and retrieving transformations from an element.
 */
export class SvgGeometryService {
    //#region Fields

    //#endregion

    //#region Ctor

    constructor() { }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

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

            let matches = getAllGroups(rotateRegex, matrix);

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

            matches = getAllGroups(scaleRegex, matrix);

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



            matches = getAllGroups(skewXRegex, matrix);

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

            matches = getAllGroups(skewYRegex, matrix);

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
            matches = getAllGroups(translateRegex, matrix);
            
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

//     /**
//      * Updates the transforms of an element to follow a more standard
//      * approach. This allows for a smoother experience when applying multiple
//      * transformations instead of dealing with the messes that occur when 
//      * mixing attributes & transforms. This will not remove the x/y or cx/cy
//      * attributes from an element (This feature is a WIP).
//      * @param element 
//      */
//     public standardizeTransforms(element: SVGGraphicsElement): void {
//         let transforms = element.getAttribute("transform");
//         let xAttr = element.getAttribute("x");
//         let yAttr = element.getAttribute("y");
//         let cxAttr = element.getAttribute("cx");
//         let cyAttr = element.getAttribute("cy");

//         let transformStr = this._defaultTransformString;

//         // Set the x/y/cx/cy attributes to zero
//         if (xAttr != null || yAttr != null) {
//             element.setAttribute("x", "0");
//             element.setAttribute("y", "0");
//             transformStr = transformStr.replace(this.translateRegex,
//                 `translate(${xAttr || "0"},${yAttr || "0"})`);
//         }

//         if (cxAttr != null || cyAttr != null) {
//             element.setAttribute("cx", "0");
//             element.setAttribute("cy", "0");
//             transformStr = transformStr.replace(this.translateRegex,
//                 `translate(${cxAttr || "0"},${cyAttr || "0"})`);
//         }

//         // If no transforms are applied setup standard transforms
//         if (transforms == null || transforms.length == 0) {
//             let xOffset = Number(xAttr || 0) + Number(cxAttr || 0);
//             let yOffset = Number(yAttr || 0) + Number(cyAttr || 0);

//             transformStr = transformStr.replace(this.translateRegex, `translate(${xOffset},${yOffset})`);
//             element.setAttribute("transform", transformStr);
//         } else {

//             // Try and extract all existing translations, rotations, scales,
//             // and matricies.
//             let totalTransforms = element.transform.baseVal.consolidate();
//         }
//     }

//     public areTransformsStandardized(element: SVGGraphicsElement): boolean {
//         let transforms = element.getAttribute("transform");
        
//         // Check for null/empty values
//         if (transforms == null || transforms.length == 0) {
//             return false;
//         }

//         let matches = transforms.match(this.transformsRegex);
        
//         // Check for null again
//         if (matches == null) {
//             return false;
//         }

//         return matches.length == 1;
//     }

    //#endregion
}

// Export singleton
let SvgGeometryServiceSingleton = new SvgGeometryService();
export { SvgGeometryServiceSingleton };