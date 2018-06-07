import { 
    IMatrixMatrix, 
    ITranslationMatrix, 
    IScaleMatrix, 
    IRotationMatrix, 
    TransformType 
} from "./../services/svg-geometry-service";

export interface ITransformable {
    //#region Functions
    hasRotate(): boolean;
    hasScale(): boolean;
    hasSkewX(): boolean;
    hasSkewY(): boolean;
    hasTranslate(): boolean;
    hasMatrix(): boolean;
    getMatrix(index?: number): IMatrixMatrix;
    setMatrix(value: IMatrixMatrix, index?: number): ITransformable;
    incrementMatrix(value: IMatrixMatrix, index?: number): ITransformable;
    getTranslate(index?: number): ITranslationMatrix;
    setTranslate(value: ITranslationMatrix, index?: number): ITransformable;
    incrementTranslate(value: ITranslationMatrix, index?: number): ITransformable;
    getScale(index?: number): IScaleMatrix;
    setScale(value: IScaleMatrix, index?: number): ITransformable;
    incrementScale(value: IScaleMatrix, index?: number): ITransformable;
    getRotation(index?: number): IRotationMatrix;
    setRotation(value: IRotationMatrix, index?: number): ITransformable;
    incrementRotation(value: IRotationMatrix, index?: number): ITransformable;
    getSkewX(index?: number): number;
    setSkewX(value: number, index?: number): ITransformable;
    incrementSkewX(value: number, index?: number): ITransformable;
    getSkewY(index?: number): number;
    setSkewY(value: number, index?: number): ITransformable;
    incrementSkewY(value: number, index?: number): ITransformable;
    append(type: TransformType, value: string): ITransformable;
    prepend(type: TransformType, value: string): ITransformable;
    consolidate(): ITransformable;
    toTransformString(): string;
    //#endregion
}