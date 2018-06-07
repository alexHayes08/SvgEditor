import { numberRegex } from '../services/svg-geometry-service';
import { SvgTransformString } from './svg-transform-string';

export class HTMLTransformString extends SvgTransformString {
    private addPxUnitToNumbers(value: string): string {
        return value.replace(numberRegex, substring => {
            return substring += "px";
        });
    }

    public toTransformString(): string {
        return this.addPxUnitToNumbers(super.toTransformString());
    }
}