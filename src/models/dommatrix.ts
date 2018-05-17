/**
 * This file isn't suppose to replace the new DOMMatrix object but polyfill it.
 */

export interface ISvgTransformMatrix {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;

    isIdentity(): boolean;
}

export class SvgTransformMatrix implements ISvgTransformMatrix {
    public a: number;
    public b: number;
    public c: number;
    public d: number;
    public e: number;
    public f: number;

    public constructor(matrix?: ISvgTransformMatrix) {
        if (matrix != undefined) {
            this.a = matrix.a;
            this.b = matrix.b;
            this.c = matrix.c;
            this.d = matrix.d;
            this.e = matrix.e;
            this.f = matrix.f;
        } else {
            this.a = 1;
            this.b = 0;
            this.c = 0;
            this.d = 1;
            this.e = 0;
            this.f = 0;
        }
    }

    public isIdentity(): boolean {
        return this.a == 1
            && this.b == 0
            && this.c == 0
            && this.d == 1
            && this.e == 0
            && this.f == 0;
    }
}

export class TransformList {
    //#region Fields

    private transforms: ISvgTransformMatrix[];

    //#endregion
    
    //#region Ctor

    public constructor(transformList?: ISvgTransformMatrix[]) {
        this.transforms = transformList || [];
    }

    //#endregion

    //#region Properties

    public get length(): number {
        return this.transforms.length;
    }

    //#endregion

    //#region Functions

    public add(item: ISvgTransformMatrix): void {
        this.transforms.push(item);
    }

    public insert(item: ISvgTransformMatrix, at: number): void {
        this.transforms = this.transforms.splice(at, 0, item);
    }

    public remove(index: number) {
        this.transforms = this.transforms.filter((t, i) => i != index);
    }

    public item(index: number): ISvgTransformMatrix {
        return this.transforms[index];
    }

    public getItems(): ISvgTransformMatrix[] {
        return [...this.transforms];
    }

    public consolidate(): TransformList {
        return new TransformList();
    }

    //#endregion
}

export class DOMMatrixFactory {
    //#region Fields

    //#endregion

    //#region Ctor

    public constructor() {

    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    //#endregion
}

export class DOMMatrix {
    //#region Fields

    //#endregion

    //#region Ctor

    public constructor() {

    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    //#endregion
}