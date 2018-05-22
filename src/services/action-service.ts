import { ISvgAction } from '../models/isvg-action';
import { ISvgActionService } from './isvg-action-service';
import { SvgTypeService } from './svg-type-service';
// import { Singleton } from 'typescript-ioc';

// @Singleton
export class SvgActionService implements ISvgActionService {
    //#region Fields

    private actions: ISvgAction[];
    private actionLimit: number;
    private index: number;

    //#endregion

    //#region Ctor

    constructor() {
        this.actions = [];
        this.actionLimit = 3;
        this.index = -1;
    }

    //#endregion

    //#region Functions

    private trimActions(): void {
        while (this.actions.length > this.getActionLimit()) {
            this.actions.shift();
            this.index--;
        }

        if (this.index < -1) {
            this.index = -1;
        } else if (this.index >= this.actions.length) {
            this.index = this.actions.length - 1;
        }
    }

    public setActionLimit(value: number): void {
        if (value < 0) {
            throw new Error("Argument 'value' cannot be less than zero.");
        }

        this.actionLimit = value;
        this.trimActions()
    }

    public getActionLimit(): number {
        return this.actionLimit;
    }

    public getCurrentActionIndex(): number {
        return this.index;
    }

    public applyAction(action: ISvgAction): void {

        // Remove all operations after the current index.
        this.actions.splice(this.getCurrentActionIndex() + 1)

        // Increment index, add action, and execute it.
        this.index++;
        this.actions.push(action);
        this.trimActions();
        this.actions[this.index].applyOperation();
    }

    public undoAction(): boolean {
        
        // Check that the current index isn't -1 (no more actions to undo).
        if (this.getCurrentActionIndex() < 0) {
            return false;
        }

        // Undo operation, then increment
        this.actions[this.index--].undoOperation();
        return true;
    }

    redoAction(): boolean {

        // Check that there are actions to redo
        if (this.getCurrentActionIndex() == (this.actions.length - 1)
            || this.actions.length == 0)
        {
            return false;
        }

        // Increment index then apply operation
        this.index++;
        this.actions[this.getCurrentActionIndex()].applyOperation();
        return true;
    }

    //#endregion
}