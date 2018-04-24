import { DOMMatrix } from "geometry-interfaces";

import { toDegrees, toRadians } from "../helpers/math-helpers";
import { getAllGroups } from "../helpers/regex-helper";
import { getDOMMatrix } from "../helpers/node-helper";

export interface IScaleMatrix {
    x: number;
    y: number;
}

export interface IRotationMatrix {
    a: number;
    cx?: number;
    cy?: number;
}

export interface ITranslationMatrix {
    x: number;
    y: number;
}

export interface ISkewMatrix {
    x: number;
    y: number;
}

export interface ITransformMatrix {
    rotation?: IRotationMatrix;
    scale?: IScaleMatrix;
    translation?: ITranslationMatrix;
    skew?: ISkewMatrix;
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

/**
 * Responsible for applying and retrieving transformations from an element.
 */
export class SvgTransformService {
    // [Fields]

    private readonly transformsRegex: RegExp;
    private readonly translateRegex: RegExp;
    private readonly rotateRegex: RegExp;
    private readonly scaleRegex: RegExp;
    private readonly matrixRegex: RegExp;
    private readonly skewXRegex: RegExp;
    private readonly skewYRegex: RegExp;
    private readonly defaultTransformString: string;

    // [End Fields]

    // [Ctor]

    constructor() {
        this.transformsRegex = /^translate[^a-z]+ rotate[^a-z]+ scale[^a-z/]+ skewX[^a-z]+ skewY[^a-z]+$/;
        this.translateRegex = /translate\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/g;
        this.rotateRegex = /rotate\(\s*([\d\.]+)\s*,?([\d\.]+)?,?([\d\.]+)?\)/g;
        this.scaleRegex = /scale\(\s*([\d\.]+)\s*,([\d\.]+)\)/g;
        this.matrixRegex = /matrix\(\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*,\s*([\d\.]+)\s*\)/g;
        this.skewXRegex = /skewX\(\s*([\d\.]+)\s*\)/g;
        this.skewYRegex = /skewY\(\s*([\d\.]+)\s*\)/g;
        this.defaultTransformString = "translate(0,0) rotate(0,0,0) scale(1,1) skewX(0) skewY(0)";
    }

    // [End Ctor]

    // [Properties]

    // [End Properties]

    // [Functions]

    public extractTransformProperties(matrix: DOMMatrix|string): ITransformMatrix {

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
     * Updates the transforms of an element to follow a more standard
     * approach. This allows for a smoother experience when applying multiple
     * transformations instead of dealing with the messes that occur when 
     * mixing attributes & transforms. This will not remove the x/y or cx/cy
     * attributes from an element (This feature is a WIP).
     * @param element 
     */
    public standardizeTransforms(element: SVGGraphicsElement): void {
        let transforms = element.getAttribute("transforms");
        let xAttr = element.getAttribute("x");
        let yAttr = element.getAttribute("y");
        let cxAttr = element.getAttribute("cx");
        let cyAttr = element.getAttribute("cy");

        let transformStr = this.defaultTransformString;

        // Set the x/y/cx/cy attributes to zero
        if (xAttr != null) {
            element.setAttribute("x", "0");
            transformStr = transformStr.replace(this.translateRegex, `translate(${xAttr})`)
        }

        if (yAttr != null) {
            element.setAttribute("y", "0");
        }

        if (cxAttr != null) {
            element.setAttribute("cx", "0");
        }

        if (cyAttr != null) {
            element.setAttribute("cy", "0");
        }

        // If no transforms are applied setup standard transforms
        if (transforms == null || transforms.length == 0) {
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

    public setScale(element: SVGGraphicsElement, matrix: IScaleMatrix): void {

    }

    public getScale(element: SVGGraphicsElement): IScaleMatrix {
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

    public setRotation(element: SVGGraphicsElement, matrix: IRotationMatrix): void {
        
    }

    public getRotation(element: SVGGraphicsElement): IRotationMatrix {
        let transformMatrix = this.extractTransformProperties(getDOMMatrix(element));
        if (transformMatrix.rotation != undefined) {
            return transformMatrix.rotation;
        } else {
            throw new Error();
        }
    }

    public setTranslation(element: SVGGraphicsElement, matrix: ITranslationMatrix): void {

    }

    public getTranslation(element: SVGGraphicsElement): ITranslationMatrix {
        let transformMatrix = this.extractTransformProperties(getDOMMatrix(element));
        if (transformMatrix.translation != undefined) {
            return transformMatrix.translation;
        } else {
            throw new Error();
        }
    }

    public setTransform(element: SVGGraphicsElement, transform: ITransformMatrix): void {

    }

    // [End Functions]
}