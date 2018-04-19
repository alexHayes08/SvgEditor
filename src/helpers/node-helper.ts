export default class NodeHelper {
    static isAttr(node: any): node is Attr {
        return (<Attr>node).value !== undefined;
    }
    
    static isNode(node: any): node is Element {
        return (<Node>node).textContent !== undefined;
    }
    
    static isElement(node: any): node is Element {
        return (<Element>node).attributes !== undefined;
    }
    
    /**
     * Retrieves the tagname of the element or the name of the attribute.
     * @param node
     * @returns {string} - The tagname of the element or the name of the attribute.
     */
    static getNameOfNode(node: Attr|Element): string {
        let name = '';
        
        if (NodeHelper.isAttr(node)) {
            let attr = <Attr>node;
            name = attr.name;
        } else if (NodeHelper.isElement(node)) {
            let element = <Element>node;
            name = element.tagName;
        }
    
        return name;
    }
    
    /**
     * Creates an array of all attributes and child elements of an element.
     * @param node 
     */
    static getChildNodesArray(node: Element): Array<Attr|Element> {
        let nodes:Array<Attr|Element> = [];
    
        if (NodeHelper.isElement(node)) {
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
}