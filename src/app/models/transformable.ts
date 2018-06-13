import { 
    MatrixData,
    TranslationData,
    ScaleData,
    RotationData
} from './matricies';

export enum TransformType {
    ROTATE,
    SCALE,
    SKEW_X,
    SKEW_Y,
    TRANSLATE,
    MATRIX
}

export interface Transformable {
    //#region Functions
    hasRotate(): boolean;
    hasScale(): boolean;
    hasSkewX(): boolean;
    hasSkewY(): boolean;
    hasTranslate(): boolean;
    hasMatrix(): boolean;
    getMatrix(index?: number): MatrixData;
    setMatrix(value: MatrixData, index?: number): Transformable;
    incrementMatrix(value: MatrixData, index?: number): Transformable;
    getTranslate(index?: number): TranslationData;
    setTranslate(value: TranslationData, index?: number): Transformable;
    incrementTranslate(value: TranslationData, index?: number): Transformable;
    getScale(index?: number): ScaleData;
    setScale(value: ScaleData, index?: number): Transformable;
    incrementScale(value: ScaleData, index?: number): Transformable;
    getRotation(index?: number): RotationData;
    setRotation(value: RotationData, index?: number): Transformable;
    incrementRotation(value: RotationData, index?: number): Transformable;
    getSkewX(index?: number): number;
    setSkewX(value: number, index?: number): Transformable;
    incrementSkewX(value: number, index?: number): Transformable;
    getSkewY(index?: number): number;
    setSkewY(value: number, index?: number): Transformable;
    incrementSkewY(value: number, index?: number): Transformable;
    append(type: TransformType, value: string): Transformable;
    prepend(type: TransformType, value: string): Transformable;
    consolidate(): Transformable;
    toTransformString(): string;
    //#endregion
}