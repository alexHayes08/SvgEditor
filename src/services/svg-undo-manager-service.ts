// import { AutoWired, Singleton } from "typescript-ioc";

import { ISvgAction } from "../models/isvg-action";
import ISvgState from "../models/isvg-state";
import * as NodeHelper from "../helpers/node-helper";

export interface IStorableAction {
    action: ISvgAction;
    nodes: Array<{
        node: Element,
        state: ISvgState
    }>
}

// @Singleton
export class SvgUndoManagerService {
    // [Fields]

    private actions: IStorableAction[];
    private currentActionIndex: number;
    private _maxNumberOfActionsToStore: number;

    // [End Fields]

    // [Ctor]

    // [End Ctor]

    constructor() {
        this.actions = [];
        this.currentActionIndex = 0;
        this._maxNumberOfActionsToStore = 10; // TODO: Make this configurable.
    }

    // [Properties]

    public get canRedo(): boolean {
        return this.currentActionIndex < this.actions.length - 1;
    }

    public get canUndo(): boolean {
        return this.currentActionIndex > 0 && this.actions.length > 0;
    }

    public set maxNumberOfActionsToStore(value: number) {

        // Assert non-negative value
        if (value < 0) {
            throw new Error(`The value must be greater than zero. value = ${value}`);
        }

        this._maxNumberOfActionsToStore = value;
    }

    public get maxNumberOfActionsToStore() {
        return this._maxNumberOfActionsToStore;
    }

    // [End Properties]

    // [Functions]

    /**
     * Removes the oldest actions that exceed the maxNumberOfActions
     */
    private trimActions() {
        while ((this.actions.length - 1) >= this._maxNumberOfActionsToStore) {
            this.actions.shift();
        }
    }

    /**
     * Will only apply the action to elements matching the 'operatesOn'
     * property of the action.
     * @param action 
     * @param elements 
     */
    public actionApplied(action: ISvgAction, elements: Element[]): void {
        
        // First filter out all elements that the action doesn't apply to
        let filteredElements = elements.filter(element => {
            
            let matches = false;
            for (var type of action.operatesOn) {
                if (type.isType(element)) {
                    matches = true;
                    break;
                }
            }

            return matches;
        });

        let storableAction:IStorableAction = {
            action: action,
            nodes: []
        };

        filteredElements.forEach(element => {
            let nodeRef = element;
            let before: string;
            let after: string;

            before = NodeHelper.stringifyNode(element);
            action.applyOperation(element);
            after = NodeHelper.stringifyNode(element);

            // Store this action
            storableAction.nodes.push({
                node: nodeRef,
                state: {
                    before,
                    after
                }
            });
        });

        this.actions.push(storableAction);
        this.currentActionIndex++;
        this.trimActions();
    }

    public redo(): void {
        
        // Check that a redo operation is possible
        if (!this.canRedo) {
            return;
        }

        
    }

    public undo(): void {
        if (!this.canUndo) {
            return;
        }
    }

    private isOutOfBounds(svgElement: SVGElement): boolean {
        return false;
    }

    // [End Functions]
}