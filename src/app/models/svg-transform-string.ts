import {
    matrixRegex,
    rotateRegex,
    translateRegex,
    scaleRegex,
    skewXRegex,
    skewYRegex,
    getNthOccurance,
    replaceNthOccurance
} from 'src/app/helpers/regex-helper';
import { 
    Transformable, 
    TransformType 
} from "src/app/models/transformable";
import { NS } from "src/app/helpers/namespace-helpers";
import { NotImplementedError } from "src/app/models/errors";
import { Matrix3x3, RotationData, ScaleData, TranslationData } from './matricies';

export class SvgTransformString implements Transformable {
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

    //#region Constructor

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
            this.transformString.trim();
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

    //#region Properties

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
    public getMatrix(index: number = 0): Matrix3x3 {
        let matrix: Matrix3x3 = {
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
    public setMatrix(value: Matrix3x3, index: number = 0): Transformable {
        let matrixStr = `matrix(${value.a.toFixed(6)},${value.b.toFixed(6)},${value.c.toFixed(6)},${value.d.toFixed(6)},${value.e.toFixed(6)},${value.f.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, matrixRegex, matrixStr, index);
        return this;
    }
    public incrementMatrix(value: Matrix3x3, index: number = 0): Transformable {
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
    public getRotation(index: number = 0): RotationData {
        let matrix: RotationData = {
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
    public setRotation(value: RotationData, index: number = 0): Transformable {
        let rotationStr = `rotate(${value.a.toFixed(6)},${(value.cx || 0).toFixed(6)},${(value.cy || 0).toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, rotateRegex, rotationStr, index);
        return this;
    }
    public incrementRotation(value: RotationData, index: number = 0): Transformable {
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
    public getScale(index: number = 0): ScaleData {
        let matrix: ScaleData = {
            x: 1,
            y: 1
        };

        let skewMatch =
            getNthOccurance(this.transformString, scaleRegex, index);
        
        matrix.x = Number(skewMatch[1]);
        matrix.y = Number(skewMatch[2]);

        return matrix;
    }
    public setScale(value: ScaleData, index: number = 0): Transformable {
        let scaleStr = `scale(${value.x.toFixed(6)},${value.y.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, scaleRegex, scaleStr, index);
        return this;
    }
    public incrementScale(value: ScaleData, index: number = 0): Transformable {
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
    public setSkewX(value: number, index: number = 0): Transformable {
        let skewXStr = `skewX(${value.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, skewXRegex, skewXStr, index);
        return this;
    }
    public incrementSkewX(value: number, index: number = 0): Transformable {
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
    public setSkewY(value: number, index: number = 0): Transformable {
        let skewYStr = `skewY(${value.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, skewYRegex, skewYStr, index);
        return this;
    }
    public incrementSkewY(value: number, index: number = 0): Transformable {
        let skewX = this.getSkewY(index);
        skewX += value;
        this.setSkewX(skewX);
        return this;
    }
    public getTranslate(index: number = 0): TranslationData {
        let matrix: TranslationData = {
            x: 0,
            y: 0
        };

        let translateMatch = 
            getNthOccurance(this.transformString, translateRegex, index);

        matrix.x = Number(translateMatch[1]);
        matrix.y = Number(translateMatch[2]);

        return matrix;
    }
    public setTranslate(value: TranslationData, index: number = 0): Transformable {
        let translateStr = `translate(${value.x.toFixed(6)},${value.y.toFixed(6)})`;
        this.transformString = replaceNthOccurance(this.transformString, translateRegex, translateStr, index);
        return this;
    }
    public incrementTranslate(value: TranslationData, index: number = 0): Transformable {
        let translation = this.getTranslate(index);
        translation.x += value.x;
        translation.y += value.y;
        this.setTranslate(translation, index);
        return this;
    }
    public append(type: TransformType, value: string): Transformable {
        let isValid = false;
        
        switch(type) {
            case TransformType.MATRIX:
                this._hasMatrix = true;
                isValid = matrixRegex.test(value);
                break;
            case TransformType.ROTATE:
                this._hasRotate = true;
                isValid = rotateRegex.test(value);
                break;
            case TransformType.SCALE:
                this._hasScale = true;
                isValid = scaleRegex.test(value);
                break;
            case TransformType.SKEW_X:
                this._hasSkewX = true;
                isValid = skewXRegex.test(value);
                break;
            case TransformType.SKEW_Y:
                this._hasSkewY = true;
                isValid = skewYRegex.test(value);
                break;
            case TransformType.TRANSLATE:
                this._hasTranslate = true;
                isValid = translateRegex.test(value);
                break;
            default:
                throw new NotImplementedError();
        }

        if (!isValid) {
            throw new Error("Failed to parse the transform string passed in.");
        }

        // Append the type.
        this.data.push(type);
        this.transformString += ` ${value}`;

        return this;
    }
    public prepend(type: TransformType, value: string): Transformable {
        let isValid = false;
        
        switch(type) {
            case TransformType.MATRIX:
                this._hasMatrix = true;
                isValid = matrixRegex.test(value);
                break;
            case TransformType.ROTATE:
                this._hasRotate = true;
                isValid = rotateRegex.test(value);
                break;
            case TransformType.SCALE:
                this._hasScale = true;
                isValid = scaleRegex.test(value);
                break;
            case TransformType.SKEW_X:
                this._hasSkewX = true;
                isValid = skewXRegex.test(value);
                break;
            case TransformType.SKEW_Y:
                this._hasSkewY = true;
                isValid = skewYRegex.test(value);
                break;
            case TransformType.TRANSLATE:
                this._hasTranslate = true;
                isValid = translateRegex.test(value);
                break;
            default:
                throw new NotImplementedError();
        }

        if (!isValid) {
            throw new Error("Failed to parse the transform string passed in.");
        }

        // Prepend the type.
        this.data.unshift(type);
        this.transformString = `${value} ${this.transformString}`;

        return this;
    }
    public consolidate(): Transformable {
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
    public static CreateDefaultTransform(): Transformable {
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