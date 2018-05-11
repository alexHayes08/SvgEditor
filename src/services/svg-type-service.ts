import ISvgType from "../models/isvg-type";

/**
 * This service is both able register svg types and check to see if nodes
 * match those types. Checks svg elements to see if they are of a certain type.
 */
export class SvgTypeService {
    //#region Fields

    private _registeredTypes: { [key: string]: ISvgType };

    //#endregion

    //#region Ctor

    constructor() {
        this._registeredTypes = {};
    }

    //#endregion

    //#region Properties

    /**
     * Returns all registered ISvgTypes.
     */
    get registeredTypes(): ISvgType[] {

        // This returns a copy of the array
        return [ ...this.registeredTypes ];
    }

    //#endregion

    //#region Functions

    /**
     * Registers an ISvgType and stores it.
     * @param type
     */
    registerType(type: ISvgType): void {
        
        // Check if the type is already registered
        if (this._registeredTypes[type.name] !== undefined) {
            console.warn(`Already registered type ${type.name}.`);
            return;
        }

        // Register the type
        this._registeredTypes[type.name] = type;
    }

    /**
     * Checks the node against all registered types and only returns the ones
     * matched.
     * @param node 
     */
    getTypes(node: Attr|Element): ISvgType[] {
        let matchedTypes:ISvgType[] = [];

        for (let key in this._registeredTypes) {
            let type = this._registeredTypes[key];

            if (type.isType(node)) {
                matchedTypes.push(type);
            }
        }

        return matchedTypes;
    }

    //#endregion
}