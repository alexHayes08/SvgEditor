import { Coords2D } from './geometry';

export type MatrixData = Matrix3x3;
export type TranslationData = Coords2D;
export type ScaleData = Coords2D;
export interface RotationData {
    a: number;
    cx: number;
    cy: number;
}

/**
 * A class for 2D transformations.
 */
export class Matrix3x3 {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
}

/**
 * A class for 3D transformations.
 */
export class Matrix4x4 {
    //#region Fields

    m11: number;
    m12: number;
    m13: number;
    m14: number;
    m21: number;
    m22: number;
    m23: number;
    m24: number;
    m31: number;
    m32: number;
    m33: number;
    m34: number;
    m41: number;
    m42: number;
    m43: number;
    m44: number;

    //#endregion

    //#region Constructor

    public constructor(data?: number[]) {

        // Populate values from data.
        if (data !== undefined) {

            // Check if the array contains six elements.
            if (data.length === 6) {
                this.m11 = data[0];
                this.m12 = data[1];
                this.m13 = 0;
                this.m14 = 0;
                this.m21 = data[2];
                this.m22 = data[3];
                this.m23 = 0;
                this.m24 = 0;
                this.m31 = 0;
                this.m32 = 0;
                this.m33 = 1;
                this.m34 = 0;
                this.m41 = data[4];
                this.m42 = data[5];
                this.m43 = 0;
                this.m44 = 1;
            } else if (data.length === 16) {
                this.m11 = data[0];
                this.m12 = data[1];
                this.m13 = data[2];
                this.m14 = data[3];
                this.m21 = data[4];
                this.m22 = data[5];
                this.m23 = data[6];
                this.m24 = data[7];
                this.m31 = data[8];
                this.m32 = data[9];
                this.m33 = data[10];
                this.m34 = data[11];
                this.m41 = data[12];
                this.m42 = data[13];
                this.m43 = data[14];
                this.m44 = data[15];
            } else {
                throw new Error('Failed to construct matrix. The sequence'
                    + ' must conatin 6 elements for a 2D matrix or 16 elements'
                    + ' for a 3D matrix.');
            }

        } else {

            // Populate data as identity.
            this.m11 = 1;
            this.m12 = 0;
            this.m13 = 0;
            this.m14 = 0;
            this.m21 = 0;
            this.m22 = 1;
            this.m23 = 0;
            this.m24 = 0;
            this.m31 = 0;
            this.m32 = 0;
            this.m33 = 1;
            this.m34 = 0;
            this.m41 = 0;
            this.m42 = 0;
            this.m43 = 0;
            this.m44 = 1;
        }
    }

    //#endregion

    //#region Properties

    public get a(): number {
        return this.m11;
    }

    public set a(value: number) {
        this.m11 = value;
    }

    public get b(): number {
        return this.m12;
    }

    public set b(value: number) {
        this.m12 = value;
    }

    public get c(): number {
        return this.m21;
    }

    public set c(value: number) {
        this.m21 = value;
    }

    public get d(): number {
        return this.m22;
    }

    public set d(value: number) {
        this.m22 = value;
    }

    public get e(): number {
        return this.m41;
    }

    public set e(value: number) {
        this.m41 = value;
    }

    public get f(): number {
        return this.m42;
    }

    public set f(value: number) {
        this.m42 = value;
    }

    public get is2D(): boolean {
        return this.m13 === 0
            && this.m14 === 0
            && this.m23 === 0
            && this.m24 === 1
            && this.m41 === 0
            && this.m42 === 0;
    }

    public get isIdentity(): boolean {
        return this.m11 === 1
            && this.m12 === 0
            && this.m13 === 0
            && this.m14 === 0
            && this.m21 === 0
            && this.m22 === 1
            && this.m23 === 0
            && this.m24 === 0
            && this.m31 === 0
            && this.m32 === 0
            && this.m33 === 1
            && this.m34 === 0
            && this.m41 === 0
            && this.m42 === 0
            && this.m43 === 0
            && this.m44 === 1;
    }

    //#endregion
}
