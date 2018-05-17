import { toDegrees, toRadians } from "../helpers/math-helpers";

export interface IAngle {
    asDegrees(): number;
    asRadians(): number;
    setWithDegrees(value: number): void;
    setWithRadians(value: number): void;
    normalizeAngle(): IAngle;
}

export class Angle implements IAngle {
    //#region Fields

    private degrees: number;
    private radians: number;

    //#endregion

    //#region Ctor

    public constructor(angle?: IAngle) {
        this.degrees = 0;
        this.radians = 0;

        if (angle) {
            this.degrees = angle.asDegrees();
            this.radians = angle.asRadians();
        }
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    public asDegrees(): number {
        return this.degrees;
    }

    public asRadians(): number {
        return this.radians;
    }

    public setWithDegrees(value: number): void {
        this.degrees = value;
        this.radians = toRadians(value);
    }

    public setWithRadians(value: number): void {
        this.degrees = toDegrees(value);
        this.radians = value;
    }

    normalizeAngle(): IAngle {
        let multiples = Number((this.asDegrees() / 360).toFixed(0));

        // Check for positive multiples
        if (multiples >= 1) {
            let newDeg = this.asDegrees() - (multiples * 360);
            this.setWithDegrees(newDeg);

        // Check for negative multiples
        } else if (multiples <= -1) {
            let newDeg = this.asDegrees() + (multiples * 360);
            this.setWithDegrees(newDeg);
        }

        return this;
    }

    //#endregion
}