import { SvgItem } from "./svg-item-model";

export interface ISvgHandles {

    getSelectedObjects(): SvgItem[];

    selectObjects(...elements: SvgItem[]): void;

    deselectObjects(): void;

    onBeforeItemsAdded(items: SvgItem[]): void;

    onAfterItemsAdded(items: SvgItem[]): void;

    onBeforeItemsRemoved(items: SvgItem[]): void;

    onAfterItemsRemoved(items: SvgItem[]): void;

    onAddedToEditor(): void;

    onRemovedFromEditor(): void;
}