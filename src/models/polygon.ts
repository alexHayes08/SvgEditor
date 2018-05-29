import { ICoords2D } from "../services/svg-transform-service";
import { IAngle, Angle } from "./angle";
import { InvalidCastError } from "./errors";
import { pythagoreanTheroem } from "../helpers/math-helpers";
import { calculateApothem, calculateSideLength } from "../helpers/polygon-helpers";

export interface PolygonFromVerticiesData {
    center: ICoords2D,
    x0: ICoords2D,
    numberOfSides: number
};

export interface PolygonFromValuesData {
    numberOfSides: number,
    circumRadius: number,
    startAngle?: IAngle
}

export function isPolygonFromVerticiesData(value: any): value is PolygonFromVerticiesData
{
    return value != undefined
        && value.center != undefined
        && value.numberOfSides != undefined
        && value.x0 != undefined;
}

export function isPolygonFromValuesData(value: any): value is PolygonFromValuesData
{
    return value != undefined
        && value.circumRadius != undefined
        && value.numberOfSides != undefined
        && value.startAngle != undefined;
}

export type PolygonData = PolygonFromValuesData|PolygonFromVerticiesData;

/**
 * Full name is regular convex polygon.
 */
export class Polygon {
    //#region Fields

    public readonly apothem: number;
    public readonly center: ICoords2D;
    public readonly circumRadius: number;
    public readonly numberOfSides: number;
    public readonly sideLength: number;
    public readonly startAngle: IAngle;

    //#endregion

    //#region Ctor

    public constructor(data: PolygonData) {
        if (isPolygonFromValuesData(data)) {
            this.center = { x: 0, y: 0 };
            this.circumRadius = data.circumRadius;
            this.numberOfSides = data.numberOfSides;
            this.startAngle = data.startAngle || Angle.fromDegrees(0);
        } else if (isPolygonFromVerticiesData(data)) {
            this.center = data.center;
            this.numberOfSides = data.numberOfSides;

            let dx = data.x0.x - data.center.x;
            let dy = data.x0.y - data.center.y;

            this.circumRadius = pythagoreanTheroem(dx, dy);
            this.startAngle = Angle.fromRadians(Math.atan2(dx, dy))
                .normalizeAngle();
        } else {
            throw new InvalidCastError();
        }

        this.sideLength = calculateSideLength(this.numberOfSides,
            this.circumRadius);
        this.apothem = calculateApothem(this.numberOfSides, this.sideLength);
    }
}