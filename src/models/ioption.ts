import * as NodeHelper from '../helpers/node-helper';

/**
 * All options must implement this interface.
 */
export interface IOption<T> extends IFromNode {
    readonly name: string;
    value?: T;
}

export interface IFromNode {

    /**
     * Should initialize the class that implements this from the properties of
     * a node.
     * @param node 
     */
    parseNode(node: Attr|Element): void;
}

/**
 * Default IOption<string> implementation.
 */
export class StringOption implements IOption<string> {
    public readonly name: string;
    public value?: string;

    public constructor(name: string) {
        this.name = name;
    }

    public parseNode(node: Attr|Element): void {
        if (NodeHelper.isAttr(node)) {
            let attr = <Attr>node;
            this.value = attr.nodeValue || undefined;
        } else if (NodeHelper.isElement(node)) {
            let element = <Element>node;
            this.value = element.innerHTML;
        }
    }
}

/**
 * Default IOption<number> implementation.
 */
export class NumberOption implements IOption<number> {
    public readonly name: string;
    public value?: number;

    public constructor(name: string) {
        this.name = name;
    }

    public parseNode(node: Attr|Element): void {
        if (NodeHelper.isAttr(node)) {
            let attr = <Attr>node;
            this.value = Number(attr.value);
        } else if (NodeHelper.isElement(node)) {
            let element = <Element>node;
            this.value = Number(element.textContent) || undefined;
        }
    }
}

/**
 * Default IOption<boolean> implementation.
 */
export class BooleanOption implements IOption<boolean> {
    public readonly name: string;
    public value?: boolean;

    public constructor(name: string) {
        this.name = name;
    }

    public parseNode(node: Attr|Element): void {
        if (NodeHelper.isAttr(node)) {
            let attr = <Attr>node;
            this.value = Boolean(attr.value);
        } else if (NodeHelper.isElement(node)) {
            let element = <Element>node;
            this.value = Boolean(element.textContent) || undefined;
        }
    }
}