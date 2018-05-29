import { toDegrees, toRadians, normalizeAngle } from "../helpers/math-helpers";

export interface IAngle {
    asDegrees(): number;
    asRadians(): number;
    setWithDegrees(value: number): IAngle;
    setWithRadians(value: number): IAngle;
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

    public setWithDegrees(value: number): IAngle {
        this.degrees = value;
        this.radians = toRadians(value);
        return this;
    }

    public setWithRadians(value: number): IAngle {
        this.degrees = toDegrees(value);
        this.radians = value;
        return this;
    }

    normalizeAngle(): IAngle {
        this.setWithDegrees(normalizeAngle(this.asDegrees()));
        return this;
    }

    public static fromDegrees(angle: number) {
        return new Angle().setWithDegrees(angle);
    }

    public static fromRadians(angle: number) {
        return new Angle().setWithRadians(angle);
    }

    //#endregion
}