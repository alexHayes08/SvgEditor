import { cotangent, toRadians } from "./math-helpers";
import { ICoords2D } from "../services/svg-transform-service";
import { IAngle, Angle } from "../models/angle";

/**
 * Subset of math-helpers.ts
 */

/**
 * Calculates the internal angle of a regular convex polygon.
 * @param n - Number of sides.
 */
export function getInternalAngle(n: number): number {
    return ((180 * (n - 2)) / 2);
}

/**
 * Calculates the diameter of the inscribed circle diamter for a regular convex
 * polygon.
 * @param n - Number of sides.
 * @param s - Side length.
 */
export function getInscribedCircleDiameter(n: number, s: number): number {
    return s * cotangent(Math.PI / n);
}

/**
 * Calculates the circumradius (from the center of the polygon to any of the
 * verticies).
 * @param n - Number of sides.
 * @param s - Side length.
 */
export function getCircumradius(n: number, s: number): number {
    return (s / (2 * Math.sin(Math.PI / n)));
}

/**
 * Calculates the area of a regular convex polygon.
 * @param n - Number of sides.
 * @param s - Side length.
 */
export function getAreaOfRegularConvexPolygon(n: number, s: number): number {
    return (1/4 * n * Math.pow(s, 2) * cotangent(Math.PI / n));
}

export function calculateApothem(n: number, s: number): number {
    return (s / (2 * Math.tan(Math.PI / n)));
}

/**
 * Calculates the side length of a regular convex polygon.
 * @param n - Number of sides
 * @param r - Circumradius.
 */
export function calculateSideLength(n: number, r: number): number {
    return (r * 2 * Math.sin(Math.PI / n));
}

/**
 * 
 * @param sides - Number of sides
 * @param index - The nth point to draw. 0 <= index < sides.
 * @param radius - The circumradius of the polygon.
 * @param center - Center of the polygon.
 * @param offsetAngle - If the polygon isn't centered where 0deg is east, 90deg
 * is is north, etc...
 */
export function getCoordsOfPointInPolygon(sides: number,
    index: number,
    radius: number,
    center?: ICoords2D,
    offsetAngle?: IAngle): ICoords2D 
{
    let result: ICoords2D = {
        x: 0,
        y: 0
    };

    center = center || { x: 0, y: 0 };
    offsetAngle = offsetAngle || Angle.fromRadians(0);
    let halved_internal_angle = getInternalAngle(sides);

    result.x = Math.cos(offsetAngle.asRadians() 
        + (halved_internal_angle * index)) * radius;
    result.y = Math.cos(offsetAngle.asRadians() 
        + (halved_internal_angle * index)) * radius;

    // Apply center offset
    

    return result;
}

/**
 * Returns the center hexagon tile closest to the angle while not overlapping
 * the original hexagon.
 * @param point - Center of the hexagon
 * @param r - Circumradius of the hexagon (center to verticies).
 * @param angle - (Degrees) Where zero is east, 90 is north, etc...
 */
export function getHexagonalCenterTiledClosestTo(point: ICoords2D, r: number, angle: number): ICoords2D {
    let coords: ICoords2D = {
        x: point.x,
        y: point.y
    };

    return coords;
}