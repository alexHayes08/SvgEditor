/**
 * Used to store how a node changed before/after an action was applied to it.
 */
export default interface ISvgState {
    
    /**
     * The stringified before version.
     */
    before: string;
    
    /**
     * The stringified after version.
     */
    after: string;
}