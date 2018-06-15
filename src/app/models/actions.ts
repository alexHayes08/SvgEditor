import { EditorSection } from 'src/app/svg-editor/svg-editor.component';

export enum Actions {
    ADD = 'add'
}

export interface ActionType {
    type: string;
}

export class AddActionType implements ActionType {
    public type = Actions.ADD;
    public elements: SVGElement[];
    public editorSection: EditorSection;
}

export function addItems(elements: SVGElement[],
    section: EditorSection): AddActionType {
    return {
        type: Actions.ADD,
        elements: elements,
        editorSection: section
    };
}
