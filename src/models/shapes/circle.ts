import { ICoords2D } from "../../services/svg-transform-service";

export interface CircleData {
    radius: number;
}

export class Circle {
    //#region Fields

    private _radius: number;

    //#endregion

    //#region Ctor

    public constructor(data: CircleData) {
        this._radius = data.radius;
    }

    //#endregion

    //#region Properties

    public get area():number {
        return Math.PI * Math.pow(this.radius, 2);
    }

    public get diameter():number {
        return this._radius * 2;
    }

    public get radius():number {
        return this._radius;
    }

    //#endregion

    //#region Functions

    //#endregion
}