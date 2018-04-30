/**
 * Helper functions for Math
 */
export function toDegrees(value: number) {
    return value * 180 / Math.PI;
}

export function toRadians(value: number) {
    return value / 180 * Math.PI;
}

export function normalizeAngle(angle: number): number {
    if (!Number.isFinite(angle)) {
        throw new Error("Number must be finite.");
    }

    while (angle >= 360) {
        angle -= 360;
    }

    while (angle <= -360) {
        angle += 360;
    }

    return angle;
}