import { ISvgAction } from '../models/isvg-action';
import { SvgTypeService } from './svg-type-service';
import { SvgUndoManagerService } from './svg-undo-manager-service';
import { Singleton } from 'typescript-ioc';

@Singleton
export default class SvgActionService {
    // [Fields]

    private cached_categories: string[];
    private registeredActions: ISvgAction[];
    private svgTypeService: SvgTypeService;
    private svgUndoManagerService: SvgUndoManagerService;

    // [End Fields]

    // [Ctor]

    constructor() {
        this.cached_categories = [];
        this.registeredActions = [];
        this.svgTypeService = new SvgTypeService();
        this.svgUndoManagerService = new SvgUndoManagerService();
    }

    // [End Ctor]

    // [Properties]

    /**
     * Returns an array of categories
     */
    public get categories() {
        return this.cached_categories;
    }

    // [End Properties]

    // [Functions]

    /**
     * Registers an action.
     * @param action 
     */
    public registerAction(action: ISvgAction): void {
        let unableToRegister = false;
        for (let reg_action of this.registeredActions) {
            
            // Check for same names
            let sameName = reg_action.name == action.name;
            
            // Check for any overlap in categories
            let overlapCategories = false;
            for (let category of action.categories) {
                if (reg_action.categories.indexOf(category) != -1) {
                    overlapCategories = true;
                    break;
                }
            }

            if (sameName && overlapCategories) {
                unableToRegister = true;
                break;
            }
        }

        if (unableToRegister) {
            console.warn(`Already registered action of name ${action.name}`);
            return;
        }

        // We're able to register the action
        // Step 1: Add categories to cached_categories
        this.cached_categories = this.cached_categories.concat(action.categories);

        this.registeredActions.push(action);
    }

    private wrapAction(action: ISvgAction): void {
        function wrappedFunc() {

        }
    }

    // [End Functions]
}