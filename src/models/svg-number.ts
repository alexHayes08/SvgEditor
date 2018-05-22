import { getAllGroupsV3, getAllGroupsV2 } from "../helpers/regex-helper";
import { convertToEnum, isKeyOf } from "../helpers/enum-helper";

export enum CssLengthDimension {
    EM = "em",
    EX = "ex",
    CM = "cm",
    CH = "ch",
    IN = "in",
    MM = "mm",
    PC = "pc",
    PERCENT = "%",
    PT = "pt",
    PX = "px",
    Q = "Q",
    REM = "rem",
    VW = "vw",
    VH = "vh",
    VMIN = "vmin",
    VMAX = "vmax"
};

export class SvgNumber {
    //#region Fields

    public units: CssLengthDimension;
    public value: number;    

    //#endregion

    //region Ctor

    public constructor(value?: string) {
        if (value) {
            const regex = /(^[\d\.\-]+)(.*)$/;
            let groups = getAllGroupsV2(regex, value);

            this.value = Number(groups[0]);

            if (Number.isNaN(this.value)) {
                throw new Error(`Failed to parse the number in the string "${value}".`);
            }

            if (isKeyOf(groups[1], CssLengthDimension)) {
                this.units = convertToEnum(groups[1], CssLengthDimension);
            } else {
                this.units = CssLengthDimension.PX;
            }
        } else {
            this.value = 0;
            this.units = CssLengthDimension.PX;
        }
    }

    //#endregion

    //#region Functions

    public toString(): string {
        return `${this.value}${this.units}`;
    }
    
    //#endregion
}