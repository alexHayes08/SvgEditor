/**
 * Helper objects for Math
 */

import { ICoords2D, IBBox } from "../services/svg-transform-service";
import { CacheService } from "../services/cache-service";
import { isKeyOf, convertToEnum } from "./enum-helper";

export enum CardinalDirections {
    EAST,
    NORTH,
    SOUTH,
    WEST
};

export function roundToSigFig(value: number, sigFig: number): number {
    return Number(value.toPrecision(sigFig));
}

/**
 * sqrt(a^2 + b^2)
 * @param a 
 * @param b 
 */
export function pythagoreanTheroem(a: number, b: number): number {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
}

export function toDegrees(value: number) {
    return value * 180 / Math.PI;
}

export function toRadians(value: number) {
    return value / 180 * Math.PI;
}

/**
 * Returns the angle in degrees within the range 0deg-359deg.
 * @param angle - In degrees.
 */
export function normalizeAngle(angle: number): number {
    if (!Number.isFinite(angle)) {
        throw new Error("Number must be finite.");
    }

    let multiplesOf360 = Number(Number(Math.floor(angle/360)).toFixed(0));
    angle -= 360 * multiplesOf360;
    
    return angle;
}

/**
 * Helper function for the cotangent.
 * @param value 
 */
export function cotangent(value: number) {
    return 1 / Math.tan(value);
}

/**
 * Helper function for the arc-cotangent.
 * @param value 
 */
export function arcCotangent(value: number) {
    return (Math.PI / 2) - Math.atan(value);
}

interface TempData {
    angle: number;
    circle_cx: number;
    circle_cy: number;
    point_x: number;
    point_y: number;
}

export function sortByPointsClosestToCircumfrence(r: number, 
    cx: number, 
    cy: number,
    points: ICoords2D[]): ICoords2D[]
{
    let cache = new CacheService<ICoords2D, TempData>();
    return points.sort((a, b) => {
        let tempData_a = cache.get(a, () => {
            let angle_rad = Math.atan2(a.x, a.y);

            return {
                angle: 0,
                circle_cx: 0,
                circle_cy: 0,
                point_x: 0,
                point_y: 0
            };
        });

        let tempData_b = cache.get(b, () => {
            return {
                angle: 0,
                circle_cx: 0,
                circle_cy: 0,
                point_x: 0,
                point_y: 0
            };
        });

        // Calculate angle relative to circle center
        let angle_a_rads = Math.atan2(a.x, a.y);
        let angle_b_rads = Math.atan2(b.x, b.y);

        
        
        return 1;
    })
}

export enum SymmetryGroup {
    CENTERED = "c",
    PRIMITIVE = "p"
}

export type OrderOfRotationalSymmetry = 1|2|3|4|6;

export enum AxisReflections {
    MIRROR = "m",
    GLIDE = "g",
    NONE = "1"
}

export class SymmetryNotation {
    //#region Fields

    private readonly iuc_notation: string;
    private readonly _symmetryGroup: SymmetryGroup;
    private readonly _highestOrderOfRotationalSymmetry: OrderOfRotationalSymmetry;
    private readonly _firstReflection: AxisReflections;
    private readonly _secondReflection: AxisReflections;

    //#endregion

    //#region Ctor

    public constructor(iuc_notation: string) {
        this.iuc_notation = iuc_notation.toLowerCase();

        // Assign if p. or c. group
        if (this.iuc_notation[0] == "p") {
            this._symmetryGroup = SymmetryGroup.PRIMITIVE;
        } else if (this.iuc_notation[0] == "c") {
            this._symmetryGroup = SymmetryGroup.CENTERED;
        } else {
            throw new Error();
        }
        
        // Assign highest order of rot. symmetry
        let n = Number(this.iuc_notation[1]);

        if (n == 1
            || n == 2
            || n == 3
            || n == 4
            || n == 6)
        {
            this._highestOrderOfRotationalSymmetry = n;
        } else {
            throw new Error();
        }

        // Assign the first transform
        if (this.iuc_notation.length >= 3) {
            let firstRefl = this.iuc_notation[2];
            if (isKeyOf(firstRefl, AxisReflections)) {
                this._firstReflection = convertToEnum(firstRefl, AxisReflections);
            } else {
                throw new Error();
            }
        } else {
            this._firstReflection = AxisReflections.NONE;
        }

        // Assign the second transform
        if (this.iuc_notation.length == 4) {
            let secondRefl = this.iuc_notation[3];
            if (isKeyOf(secondRefl, AxisReflections)) {
                this._secondReflection = convertToEnum(secondRefl, AxisReflections);
            } else {
                throw new Error();
            }
        } else {
            this._secondReflection = AxisReflections.NONE;
        }
    }

    //#endregion

    //#region Properties

    public get symmetryGroup(): SymmetryGroup {
        return this._symmetryGroup;
    }

    public get highestOrderOfRotationalSymmetry(): OrderOfRotationalSymmetry {
        return this._highestOrderOfRotationalSymmetry;
    }

    //#endregion

    //#region Functions

    //#endregion
}

export interface Tileable {
    getSymmetryNotation(): SymmetryNotation;
    getCellWidth(): number;
    getCellHeight(): number;
}

export interface TileIndex {
    row: number;
    col: number;
}

export class TilePatternService {
    
    // FIXME: This needs to be updated
    private compareFunction(a: ICoords2D, b: ICoords2D): number {
        return 1;
    }

    public getCenterPointOfTile(tile: Tileable, row: number, col: number): ICoords2D {
        let tileCenterPoint = { x: 0, y: 0 };

        return tileCenterPoint;
    }

    public getTileIndexClosestToPoint(point: ICoords2D): TileIndex {
        let tileIndex = { row: 0, col: 0 };

        return tileIndex;
    }
}