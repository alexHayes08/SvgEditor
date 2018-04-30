import { SvgItem } from "./svg-item-model";

export interface ISvgHandles {

    getSelectedObjects(): SvgItem[];

    selectObjects(...elements: SvgItem[]): void;

    deselectObjects(): void;
}