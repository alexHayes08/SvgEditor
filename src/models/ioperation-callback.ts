export interface IOperationCallbacks<T> {
    onBefore?: (context: T) => void;
    onDuring?: (context: T) => void;
    onAfter?: (context: T) => void;
}
