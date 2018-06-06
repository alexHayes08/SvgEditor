export interface EditorAction {
    name: string;
    applyOperation(): void;
    undoOperation(): void;
}