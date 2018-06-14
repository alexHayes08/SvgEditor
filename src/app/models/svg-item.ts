import { SvgTransformString } from 'src/app/models/svg-transform-string';
import { TransformType } from 'src/app/models/transformable';

export class SvgItem {
    //#region Fields

    public transform: SvgTransformString
    public displayed: boolean;

    //#endregion

    //#region Constructor

    public constructor() {
        this.displayed = true;
        this.transform = new SvgTransformString([TransformType.MATRIX]);
    }

    //#endregion
    
    //#region Properties

    public get transformString(): string {
        return this.transform.toTransformString();
    }

    //#endregion

    //#region Functions

    //#endregion
}