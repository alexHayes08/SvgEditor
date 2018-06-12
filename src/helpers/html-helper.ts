/**
 * Creates and optionally appends an element.
 * @param tagName - Name of the element.
 * @param parent - Optionally append the created element to this parent element.
 * @returns - The created element.
 */
export function createEl<T extends HTMLElement>(tagName: string, parent?: Element): T {
    let el = <T>document.createElement(tagName);
    if (parent) {
        parent.appendChild(el);
    }
    return el;
}