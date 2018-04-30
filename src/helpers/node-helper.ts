import { DOMMatrix } from "geometry-interfaces";

export function getDOMMatrix(element: SVGGraphicsElement): DOMMatrix {
    let { a, b, c, d, e, f } = element.transform.baseVal.consolidate().matrix;
    return new DOMMatrix([a, b, c, d, e, f]);
}

export function isAttr(node: any): node is Attr {
    return (<Attr>node).value !== undefined;
}

export function isNode(node: any): node is Element {
    return (<Node>node).textContent !== undefined;
}
    
export function isElement(node: any): node is Element {
    return (<Element>node).attributes !== undefined;
}

/**
 * Retrieves the tagname of the element or the name of the attribute.
 * @param node
 * @returns {string} - The tagname of the element or the name of the attribute.
 */
export function getNameOfNode(node: Attr|Element): string {
    let name = '';
    
    if (isAttr(node)) {
        let attr = <Attr>node;
        name = attr.nodeName.toLowerCase();
    } else if (isElement(node)) {
        let element = <Element>node;
        name = element.tagName.toLowerCase();
    }

    return name;
}

/**
 * Creates an array of all attributes and child elements of an element.
 * @param node 
 */
export function getChildNodesArray(node: Element): Array<Attr|Element> {
    let nodes:Array<Attr|Element> = [];

    if (isElement(node)) {
        let element = <Element>node;
        
        for (let i = 0; i < element.attributes.length; i++) {
            let attribute = element.attributes[i];
            nodes.push(attribute);
        }

        for (let i = 0; i < element.children.length; i++) {
            let subElement = element.children.item(i);
            nodes.push(subElement);
        }
    }

    return nodes;
}

/**
 * Returns the stringified node.
 * @param node
 */
export function stringifyNode(node: Attr|Element): string {
    let stringified = '';

    if (isAttr(node)) {
        let attr = <Attr>node;
        stringified = `${attr.nodeName}="${attr.nodeValue}"`;
    } else if (isElement(node)) {
        let element = <Element>node;
        stringified = element.outerHTML;
    }

    return stringified;
}

/**
 * Converts a NodeList into a more dev friendly array of elements.
 * @param nodeList 
 */
export function nodeListToArray(nodeList: NodeList): Element[] {
    let elements: Element[] = [];

    for (let i = 0; i < nodeList.length; i++) {
        let node = nodeList.item(i);
        if (isElement(node)) {
            elements.push(node);   
        }
    }

    return elements;
}