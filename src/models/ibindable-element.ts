import { IDrawable } from './idrawable';
export interface IBindableElement extends IDrawable {
    getElement(): Element;
}

export class CssNumber {
    //#region Fields

    private _isPercentage: boolean;

    //#endregion

    //region Ctor

    public constructor() {
        this._isPercentage = false;
    }

    //#endregion

    //#region Properties

    public get isPercentage(): boolean {
        return this._isPercentage;
    }

    public get isPixel(): boolean {
        return !this._isPercentage
    }

    //#endregion

    //#region Functions

    public toString(): string {
        if (this._isPercentage) {
            return ``;
        } else {
            return ``;
        }
    }
    
    //#endregion
}