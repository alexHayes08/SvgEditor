import ISvgType from "./isvg-type";

/**
 * Defines an 'action' that can only be applied to nodes matching the ISvgTypes
 * listed in 'operatesOn'. These 'actions' can modify the nodes in any fashion,
 * such as removing the node, changing attributes, adding child nodes, etc...
 */
export default interface ISvgAction {
    
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