import ISvgType from "./isvg-type";
import { SvgCanvas } from "./svg-canvas-model";

/**
 * Defines an 'action' that can only be applied to nodes matching the ISvgTypes
 * listed in 'operatesOn'. These 'actions' can modify the nodes in any fashion,
 * such as removing the node, changing attributes, adding child nodes, etc...
 */
export interface ISvgAction {
    
    /**
     * A list of categories the action falls under. IE: An 'export' action
     * might fall under a 'File' category while a 'scale' action might fall
     * under a 'Transform' category.
     */
    readonly categories: string[];

    /**
     * A user friendly name of the action. IE: 'drag', 'cut', 'rotate', etc...
     */
    readonly name: string;

    /**
     * Defines which ISvgTypes this operation can work on.
     */
    operatesOn: Array<ISvgType>;

    /**
     * An action that mutates the node in some fashion.
     * @param node 
     */
    applyOperation(node: Element): void;

    /**
     * @param node 
     */
    undoOperation(node: Element): void;
}

export enum ActionType {
    ADD,
    REMOVE,
    UPDATE
}

export interface ISvgActionV2 {
    type(): ActionType;
    targets(): SVGElement[];
    beforeOperation(editor: SvgCanvas): void;
    operation(editor: SvgCanvas): void;
    afterOperation(editor: SvgCanvas): void;
}