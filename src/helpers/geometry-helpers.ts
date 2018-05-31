import { cotangent, toRadians, pythagoreanTheroem } from "./math-helpers";
import { ICoords2D } from "../services/svg-transform-service";
import { IAngle, Angle } from "../models/angle";
import { getAllGroupsV3 } from "./regex-helper";
import { Polygon } from "../models/shapes/polygon";

/**
 * Subset of math-helpers.ts
 */

export const SQRT_OF_2 = Math.sqrt(2);
export const SQRT_OF_3 = Math.sqrt(3);

/**
 * Calculates concentric polygons where each circumradius is incremented by
 * (2 * s) where the inner most polygons circumradius is the min amount to
 * evenly fit the sidelengths into a regular polygon. If there are any left
 * over verticies that cannot fit onto the initial polygon, concentric polygons
 * will be generated until all verticies are accounted for.
 * @param numberOfVerticies 
 * @param sideLength 
 * @param minCircumRadius 
 * @param center 
 */
export function calculateConcentricPolygons(
    numberOfVerticies: number,
    sideLength: number,
    minCircumRadius: number = 0,
    startAngle: IAngle = Angle.fromDegrees(0),
    center: ICoords2D = {x: 0, y: 0}): Polygon[]
{
    let polygons: Polygon[] = [];
    
    // Caculate the minimum possible value for the circumradius.
    let minValidCircumradius = sideLength * (2 * SQRT_OF_3);
    let currentRadius = minCircumRadius > minValidCircumradius 
        ? minCircumRadius
        : minValidCircumradius;

    // Round up
    let startingNumberOfSides = Math.ceil(calculateNumberOfSides(sideLength,
        currentRadius));

    // Recalculate circumradius
    currentRadius = getCircumradius(startingNumberOfSides, sideLength)
        - (2 * sideLength);

    let remainingVerticies = numberOfVerticies;
    do {
        
        // Increment currentRadius by 2 * sideLength
        currentRadius += (2 * sideLength);

        // Create polygon
        let polygon = new Polygon({
            center: center,
            x0: getCoordsOfPointInPolygon(startingNumberOfSides, 0, 
                currentRadius, 
                center, 
                startAngle),
            numberOfSides: startingNumberOfSides
        });
        polygons.push(polygon);

        remainingVerticies -= polygon.verticies.length;

    } while (remainingVerticies > 0);

    return polygons;
}

export function calculateNumberOfSides(sideLength: number,
    circumradius: number): number
{
    return Math.PI / (Math.asin(sideLength / (2 * circumradius)));
}

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
 * @param index - The nth point to draw. 0 <= index < (sides + 1).
 * @param circumradius - The circumradius of the polygon.
 * @param center - Center of the polygon.
 * @param offsetAngle - If the polygon isn't centered where 0deg is east, 90deg
 * is is north, etc...
 */
export function getCoordsOfPointInPolygon(sides: number,
    index: number,
    circumradius: number,
    center?: ICoords2D,
    offsetAngle?: IAngle): ICoords2D 
{
    let result: ICoords2D = {
        x: center ? center.x : 0,
        y: center ? center.y : 0
    };

    offsetAngle = offsetAngle || Angle.fromRadians(0);
    let halved_internal_angle = getInternalAngle(sides);

    result.x += Math.cos(offsetAngle.asRadians() 
        + (halved_internal_angle * index)) * circumradius;
    result.y += Math.cos(offsetAngle.asRadians() 
        + (halved_internal_angle * index)) * circumradius;

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
 * Returns an array of argument 'n' length containing all verticies in an
 * n-polygon.
 * @param center - The coordinates of the center of the polygon.
 * @param x0 - The coordinates of the first vertex.
 * @param n - Number of sides.
 */
export function calculatePolygonVerticies(center: ICoords2D, 
    x0: ICoords2D, 
    n: number): ICoords2D[] 
{
    // Validate arguments
    if (!Number.isInteger(n)) {
        throw new Error("The argument 'n' must be an integer.")
    }
    
    if (n < 3) {
        throw new Error("The argument 'n' must be an integer greater than or equal to three");
    }

    if (center.x == x0.x
        && center.y == x0.y) 
    {
        throw new Error("The arguments 'center' and 'x0' cannot use the same point.");
    }

    let coords: ICoords2D[] = [ x0 ];
    let dx_0 = (x0.x - center.x);
    let dy_0 = (x0.y - center.y);
    let R = pythagoreanTheroem((x0.x - center.x), (x0.y - center.y));
    let offsetAngle = Angle.fromRadians(Math.atan2(dx_0, dy_0));

    for (let i = 1; i < n; i++) {
        let x_n: ICoords2D = {
            x: center.x,
            y: center.y
        };

        let incrementAngle = Angle.fromDegrees((60 * i) 
            + offsetAngle.asDegrees());
        x_n.x += Math.cos(incrementAngle.asRadians());
        x_n.y += Math.sin(incrementAngle.asRadians());

        coords.push(x_n);
    }

    return coords;
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

/**
 * Returns the center of a hexagon adjacent to the hexagon centered around c1.
 * @param c1 - Center of the initial hexagon.
 * @param x1 - One of the verticies which is connected to both hexagons.
 * @param x2_IsClockwise - Whether x2 is +-60deg from x1. 
 */
export function getCenterOfAdjacentHexagon(c1: ICoords2D, 
    x1: ICoords2D, 
    x2_IsClockwise: boolean): ICoords2D 
{
    let c2: ICoords2D = {
        x: c1.x,
        y: c1.y
    };

    let dx_1 = x1.x - c1.x;
    let dy_1 = x1.y - c1.y;

    let double_R = pythagoreanTheroem(dx_1, dy_1) * 2;
    let a_x1 = Angle.fromRadians(Math.atan2(dy_1, dx_1))
        .normalizeAngle();
    let a_c2 = Angle.fromDegrees(((x2_IsClockwise ? -30 : 30))
            + a_x1.asDegrees())
        .normalizeAngle();

    c2.x += Math.cos(a_c2.asRadians()) * double_R;
    c2.y += Math.sin(a_c2.asRadians()) * double_R;

    return c2;
}