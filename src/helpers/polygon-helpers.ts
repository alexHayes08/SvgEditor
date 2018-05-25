import { cotangent, toRadians } from "./math-helpers";
import { ICoords2D } from "../services/svg-transform-service";
import { IAngle, Angle } from "../models/angle";
import { getAllGroupsV3 } from "./regex-helper";

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
 * @param pointOffsetAngle - The angle offset applied to the hexagon. 0deg is
 * east, 90deg is north, etc...
 */
export function getHexagonalCenterTiledClosestTo(point: ICoords2D, 
    r: number, 
    angle: IAngle, 
    pointOffsetAngle?: IAngle): ICoords2D {
    let coords: ICoords2D = {
        x: point.x,
        y: point.y
    };
    
    pointOffsetAngle = pointOffsetAngle || Angle.fromDegrees(0);
    let sideLength = calculateSideLength(6, r);
    let apothem = calculateApothem(6, sideLength);

    // let x = Math.cos() * r;

    return coords;
}

/**
 * Parses a points string into an ICoords2D array.
 * @param pointsStr - A valid points string used in the "points" attribute
 * of the polygon element.
 */
export function parsePointsString(pointsStr: string): ICoords2D[] {
    let coords: ICoords2D[] = [];
    let regex = /([\d\.-]+),([\d\.-]+)/g;

    for (let group of getAllGroupsV3(regex, pointsStr)) {
        let x = Number(group[0]);
        let y = Number(group[1]);

        if (Number.isNaN(x)) {
            throw new Error(`Failed to parse "${group[0]}" to a number.`);
        } else if (Number.isNaN(y)) {
            throw new Error(`Failed to parse "${group[1]}" to a number.`);
        }

        coords.push({ x, y });
    }

    return coords;
}

export function coordsToPointsStr(points: ICoords2D[]): string {
    let result = "";

    for (let point of points) {
        result += ` ${point.x},${point.y}`;
    }

    return result.trimLeft();
}

/**
 * http://forumgeom.fau.edu/FG2016volume16/FG201627.pdf
 * @param n - Number of sides
 * @param r - The circumradius or radius from the center of the polygon to each
 * vertex.
 * @param startAngle - This polygon is oriented similar to a unit circle where
 * 0deg is east, 90deg is north, 180deg is west, and 270deg is south.
 * @throws - If n isn't an integer or is less than three.
 * @throws - If r is less than or equal to zero.
 */
export function getPolygonPointsString(n: number, r: number, startAngle?: IAngle): string {
    
    // Validate arguments
    if (!Number.isInteger(n)) {
        throw new Error("The argument 'n' must be an integer.")
    }
    
    if (n < 3) {
        throw new Error("The argument 'n' must be an integer greater than or equal to three");
    }

    if (r <= 0) {
        throw new Error("The argument 'r' must be greater than zero.");
    }
    
    let pointsStr = "";
    let internalAngle_deg = (n - 2) * 180 / n;
    let startAngle_rad = startAngle != undefined ? startAngle.asRadians() : 0;
    
    // This is the angle from center point to two adjacent verticies.
    let angle_rad = toRadians(180 - internalAngle_deg);

    for (let i = 0; i < n; i++) {

        // Calculate the x and y of each point.
        let x = Math.cos(startAngle_rad + (angle_rad * i)) * r;
        let y = Math.sin(startAngle_rad + (angle_rad * i)) * r;

        // Add it to the points string.
        pointsStr += ` ${x},${y}`
    }

    // Remove extra whitespace at start of string and return it.
    return pointsStr.trimLeft();
}
