import { IDrawable } from './idrawable';

/**
 * Represents an element that is added to the DOM by calling draw(), updated by
 * calling update(), and removed from the DOM with erase(). Classes
 * implementing this interface should add a SINGLE element to the DOM. However
 * this element may contain child elements.
 */
export interface IDOMDrawable<T extends Element> extends IDrawable 
{
    
    /**
     * Returns the IDrawables 'main' node. The IDrawable should ONLY modify
     * this element when calling draw/update/erase.
     */
    getElement(): T;

    /**
     * The element that will have this element appended to it when draw() is
     * called.
     */
    getContainer(): Element;

    /**
     * Retreives the event emitter object.
     */
    getEventEmitter(): d3.Dispatch<EventTarget>;
}
