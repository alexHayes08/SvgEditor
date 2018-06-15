import { SvgTransformString } from 'src/app/models/svg-transform-string';
import { TransformType } from 'src/app/models/transformable';

export class SvgItem {
    //#region Fields

    private readonly element: SVGElement;

    public transform: SvgTransformString;
    public displayed: boolean;

    //#endregion

    //#region Constructor

    public constructor(element: SVGElement) {
        this.displayed = true;
        this.element = element;
        this.transform = new SvgTransformString([TransformType.MATRIX]);
    }

    //#endregion

    //#region Properties

    public get transformString(): string {
        return this.transform.toTransformString();
    }

    //#endregion

    //#region Functions

    public getElement(): SVGElement {
        return this.element;
    }

    //#endregion
}
