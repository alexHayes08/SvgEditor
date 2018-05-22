import { IDrawable } from './idrawable';
export interface IBindableElement extends IDrawable {
    getElement(): Element;
}
