import { SvgItem } from "../models/svg-item-model";
import { InternalError } from "../models/errors";

/**
 * Responsible for retrieving the data associated with an element.
 * 
 * NOTE: Might not need this as the editor only retrieves data of its direct
 * descendants.
 */
export class DataMapService {
    //#region Fields

    /**
     * This field will create a 'scope' for a container element.
     */
    private scopes: WeakMap<Element, WeakMap<Element, SvgItem>>;

    //#endregion

    //#region Ctor

    public constructor() {
        this.scopes = new WeakMap();
    }

    //#endregion

    //#region Properties

    //#endregion

    //#region Functions

    /**
     * Returns a scope. If a scope previously didn't exist a new one is
     * created.
     * @param element  
     */
    public getScope(element: Element): WeakMap<Element, SvgItem> {
        
        // Create scope if one doens't exist
        if (!this.scopes.has(element)) {
            let wm = new WeakMap();
            this.scopes.set(element, wm);
        }

        let wm = this.scopes.get(element);

        // This shouldn't happen, but you never know.
        if (wm == undefined) {
            throw InternalError;
        }

        return wm;
    }

    //#endregion
}