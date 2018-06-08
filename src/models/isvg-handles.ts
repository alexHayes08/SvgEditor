import { SvgItem } from "./svg-item-model";

export interface ISvgHandles {

    getSelectedObjects(): ReadonlyArray<SvgItem>;

    selectObjects(...elements: SvgItem[]): void;

    highlightObjects(...elements: SVGGraphicsElement[]): void;

    deselectObjects(): void;

    onBeforeItemsAdded(items: SvgItem[]): void;

    onAfterItemsAdded(items: SvgItem[]): void;

    onBeforeItemsRemoved(items: SvgItem[]): void;

    onAfterItemsRemoved(items: SvgItem[]): void;

    onAddedToEditor(): void;

    onRemovedFromEditor(): void;
}
