import * as $ from "jquery";
import { AutoWired, Singleton } from "typescript-ioc";

export const ActivatableServiceNames = {
    CLASS_NAME: "activatable",
    ACTIVE_CLASS_NAME: "activated",
    INACTIVE_CLASS_NAME: "deactivated"
}

export interface IActivatableService {
    getElements(): Element[];
    getActiveElements(): Element[];
    getInactiveElements(): Element[];
    register(element: Element): void;
    unregister(element: Element): void;
    activate(element: Element): void;
    deactivate(element: Element): void;
}

export class ActivatableService implements IActivatableService  {
    //#region Fields

    private _elements: Element[];

    //#endregion

    //#region Ctor

    public constructor() {

        // Create local variable of _elements
        let _elements: Element[] = [];

        // Get all elements on the page that contain the base class name
        $(ActivatableServiceNames.CLASS_NAME).each(function() {
            _elements.push(this);
        });

        this._elements = _elements;
    }

    //#endregion

    /**
     * Returns a list of all registered elements.
     */
    public getElements(): Element[] {

        // This is to return a copy of the list
        return this._elements;
    }

    public getActiveElements(): Element[] {
        return this._elements.filter(el => el.classList
            .contains(ActivatableServiceNames.ACTIVE_CLASS_NAME));
    }

    public getInactiveElements(): Element[] {
        return this._elements.filter(el => el.classList
            .contains(ActivatableServiceNames.INACTIVE_CLASS_NAME));
    }

    //#region Functions

    private isRegistered(element: Element): boolean {
        return this._elements.indexOf(element) !== -1;
    }

    /**
     * Registers an element as an 'Activatable'.
     * @param element 
     */
    public register(element: Element, activated: boolean = true): void {
        
        // Check if already registered
        if (this.isRegistered(element)) {
            return;
        }

        // Add the default class
        element.classList.add(ActivatableServiceNames.CLASS_NAME);

        // Assign either the active or inactive class and make sure the other
        // class isn't present on it.
        if (activated) {
            element.classList.add(ActivatableServiceNames.ACTIVE_CLASS_NAME);
            element.classList.remove(ActivatableServiceNames.INACTIVE_CLASS_NAME);
        } else {
            element.classList.add(ActivatableServiceNames.INACTIVE_CLASS_NAME);
            element.classList.remove(ActivatableServiceNames.ACTIVE_CLASS_NAME);
        }

        // Add to _elements
        this._elements.push(element);
    }

    /**
     * Unregisters an element as 'Activatable' and removes all classes
     * and attributes that are unique to this class.
     * @param element 
     */
    public unregister(element: Element): void {

        // Check if not registered
        if (!this.isRegistered(element)) {
            return;
        }

        // Remove all added attributes/class
        element.classList.remove(ActivatableServiceNames.CLASS_NAME);
        element.classList.remove(ActivatableServiceNames.ACTIVE_CLASS_NAME);
        element.classList.remove(ActivatableServiceNames.INACTIVE_CLASS_NAME);

        // Remove the element from the array
        this._elements = this._elements.filter(el => el !== element);
    }

    public deactivate(element: Element): void {
        
        // Check if registered
        if (!this.isRegistered(element)) {
            return;
        }

        // Add evt listener to add the inactive class once the transition is done.
        $(element).one("transitionend", function(e) {
            element.classList.add(ActivatableServiceNames.INACTIVE_CLASS_NAME);
        });

        // Remove active class
        element.classList.remove(ActivatableServiceNames.ACTIVE_CLASS_NAME);
    }

    public activate(element: Element): void {

        // Check if registered
        if (!this.isRegistered(element)) {
            return;
        }

        // Remove active class, add inactive class
        element.classList.remove(ActivatableServiceNames.INACTIVE_CLASS_NAME);
        element.classList.add(ActivatableServiceNames.ACTIVE_CLASS_NAME);
    }

    //#endregion
}

// Export singleton
let ActivatableServiceSingleton = new ActivatableService();
export { ActivatableServiceSingleton };