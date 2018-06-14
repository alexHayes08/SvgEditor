export enum CardinalDirections {
    EAST,
    NORTH,
    SOUTH,
    WEST
}

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
        throw new Error('Number must be finite.');
    }

    const multiplesOf360 = Number(Number(Math.floor(angle / 360)).toFixed(0));
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

