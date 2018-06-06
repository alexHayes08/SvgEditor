import { EditorAction } from "./editor-action";
import { SvgItem } from "./svg-item";

export interface Handles {
    getSelectedObjects(): ReadonlyArray<SvgItem>;
    selectObjects(...elements: SvgItem[]): void;
    deselectObjects(...elements: SvgItem[]): void;
    highlightObjects(...elements: SvgItem[]): void;
    unhighlightObjects(...elements: SvgItem[]): void;
    onAction(action: EditorAction): void;
}