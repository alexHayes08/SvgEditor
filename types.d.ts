declare module "geometry-interfaces" {
    export class DOMMatrixReadonly {
        public a: number;
        public b: number;
        public c: number;
        public d: number;
        public e: number;
        public f: number;

        public m11: number;
        public m12: number;
        public m13: number;
        public m14: number;

        public m21: number;
        public m22: number;
        public m23: number;
        public m24: number;

        public m31: number;
        public m32: number;
        public m33: number;
        public m34: number;

        public m41: number;
        public m42: number;
        public m43: number;
        public m44: number;

        public is2D: boolean;
        public isIdentity: boolean;

        public constructor(numberSequence: number[]);

        public translate(tx: number, ty: number, tz?: number): DOMMatrix;
        public scale(scale: number, originX?: number, originY?: number): DOMMatrix;
        public scale3d(scale: number, originX?: number, originY?: number): DOMMatrix;
        public scaleNonUniform(scaleX: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix;
        public rotate(angle: number, originX?: number, originY?: number): DOMMatrix;
        public rotateFromVector(x: number, y: number): DOMMatrix;
        public rotateAxisAngle(x: number, y: number, z: number, angle: number): DOMMatrix;
        public skewX(sx: number): DOMMatrix;
        public skewY(sy: number): DOMMatrix;
        public multiply(other: DOMMatrixReadonly): DOMMatrix;
        public flipX(): DOMMatrix;
        public flipY(): DOMMatrix;
        public inverse(): DOMMatrix;
        public transformPoint(point?: DOMPoint): DOMPoint;
        public toFloat32Array(): Float32Array;
        public toFloat64Array(): Float64Array;
    }
    export class DOMMatrix extends DOMMatrixReadonly {
        public constructor(arg?: string|Float32Array|Float64Array|number[]);

        public multiplySelf(other: DOMMatrix): DOMMatrix;
        public preMultiplySelf(other: DOMMatrix): DOMMatrix;
        public translateSelf(tx?: number, ty?: number, tz?: number): DOMMatrix;
        public scaleSelf(scale: number, originX?: number, originY?: number): DOMMatrix;
        public scale3dSelf(scale: number, originX?: number, originY?: number, originZ?: number): DOMMatrix;
        public scaleNonUniformSelf(scaleX: number, scaleY?: number, scaleZ?: number, originX?: number, originY?: number, originZ?: number): DOMMatrix;
        public rotateSelf(angle: number, originX?: number, originY?: number): DOMMatrix;
        public rotateFromVectorSelf(x: number, y: number): DOMMatrix;
        public rotateAxisAngleSelf(x: number, y: number, z: number, angle: number): DOMMatrix;
        public skewXSelf(sx: number): DOMMatrix;
        public skewYSelf(sy: number): DOMMatrix;
        public invertSelf(): DOMMatrix;
        public setMatrixValue(): DOMMatrix;
    }
    export class DOMPointReadonly {
        public readonly x: number
        public readonly y: number
        public readonly z: number
        public readonly w: number

        public constructor();

        public matrixTransform(matrix: DOMMatrix): DOMPointReadonly;
        public static fromPoint(other: DOMPointReadonly): DOMPointReadonly;
    }
    export class DOMPoint extends DOMPointReadonly {
        public x: number
        public y: number
        public z: number
        public w: number
    }
}