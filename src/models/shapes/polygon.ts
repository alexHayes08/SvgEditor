import { ICoords2D } from "../../services/svg-transform-service";
import { IAngle, Angle } from "./../angle";
import { InvalidCastError } from "./../errors";
import { pythagoreanTheroem } from "../../helpers/math-helpers";
import { 
    calcApothem, 
    calcSideLength, 
    calcPolygonVerticies, 
    calcCoordsOfPointInPolygon 
} from "../../helpers/geometry-helpers";

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

export interface PolygonFromSideLength {
    center: ICoords2D;
    x0: ICoords2D;
    sideLength: number;
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

export function isPolygonFromSideLength(value: any): value is PolygonFromSideLength
{
    return value != undefined
        && value.center != undefined
        && value.x0 != undefined
        && value.sideLength != undefined;
}

export type PolygonData = PolygonFromValuesData
    |PolygonFromVerticiesData
    |PolygonFromSideLength;

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
    public readonly verticies: ICoords2D[];

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
        } else if (isPolygonFromSideLength) {
            this.center = data.center;
            let dx_0 = data.x0.x - this.center.x;
            let dy_0 = data.x0.y - this.center.y;
            this.startAngle = Angle.fromRadians(Math.atan2(dx_0, dy_0));
            this.circumRadius = pythagoreanTheroem(dx_0, dy_0);
            this.numberOfSides = 
                Math.PI / (Math.asin((2 * this.circumRadius)/ data.sideLength));
        } else {
            throw new InvalidCastError();
        }

        this.sideLength = calcSideLength(this.numberOfSides,
            this.circumRadius);
        this.apothem = calcApothem(this.numberOfSides, this.sideLength);
        
        let x0 = calcCoordsOfPointInPolygon(this.numberOfSides, 0,
            this.circumRadius,
            this.center,
            this.startAngle);

        // Populate verticies
        this.verticies = calcPolygonVerticies(this.center, x0, this.numberOfSides);
    }
}