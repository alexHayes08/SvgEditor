import { SvgItem } from "./svg-item-model";

export interface ISvgHandles {

    getSelectedObjects(): SvgItem[];

    selectObjects(...elements: SvgItem[]): void;

    deselectObjects(): void;

    onBeforeItemAdded(item: SvgItem): void;

    onAfterItemAdded(item: SvgItem): void;

    onBeforeItemRemoved(item: SvgItem): void;

    onAfterItemRemoved(item: SvgItem): void;

    onAddedToEditor(): void;

    onRemovedFromEditor(): void;
}