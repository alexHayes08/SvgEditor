import { Injectable } from '@angular/core';
import { Coords2D, BBox } from 'src/app/models/geometry';
import { getFurthestSvgOwner } from 'src/app/helpers/svg-helpers';

@Injectable({
  providedIn: 'root'
})
export class SvgGeometryService {
  //#region Fields

  //#endregion

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  /**
   * A cross browser polyfill for SVGGraphicsElement.getBBox(). This assumes
   * that all elements passed in have the same furthest svg parent.
   * @param elements
   * @throws - Throws an error if the element has no parent svg element.
   */
  public getBBox(...elements: SVGGraphicsElement[]): BBox {

    // Check for any elements.
    if (elements.length === 0) {
      throw new Error('No elements were passed in.');
    }

    const parentSvgBBox = getFurthestSvgOwner(elements[0])
      .getBoundingClientRect();

    const firstElBBox = elements[0].getBoundingClientRect();

    const bbox = {
      top: firstElBBox.top,
      bottom: firstElBBox.bottom,
      left: firstElBBox.left,
      right: firstElBBox.right
    };

    for (let i = 1; i < elements.length; i++) {
      const element = elements[i];
      const elBBox = element.getBoundingClientRect();

      // Check the top
      if (elBBox.top < bbox.top) {
        bbox.top = elBBox.top;
      }

      // Check the bottom
      if (elBBox.bottom > bbox.bottom) {
        bbox.bottom = elBBox.bottom;
      }

      // Check the left
      if (elBBox.left < bbox.left) {
        bbox.left = elBBox.left;
      }

      // Check right
      if (elBBox.right > bbox.right) {
        bbox.right = elBBox.right;
      }
    }

    return {
      x: bbox.left - parentSvgBBox.left,
      y: bbox.top - parentSvgBBox.top,
      width: (bbox.right - parentSvgBBox.left) - (bbox.left - parentSvgBBox.left),
      height: (bbox.bottom - parentSvgBBox.top) - (bbox.top - parentSvgBBox.top)
    };
  }

  /**
   * Gets the center of an element relative to another element.
   * @param relativeEl
   * @param elements
   */
  public getBBoxRelativeTo(relativeEl: SVGGraphicsElement,
    ...elements: SVGGraphicsElement[]): BBox {
    const parentBCR = relativeEl.getBoundingClientRect();

    const pointsRelativeTo = {
      x: parentBCR.left,
      y: parentBCR.top
    };

    const bbox = this.getBBox(...elements);
    bbox.x -= pointsRelativeTo.x;
    bbox.y -= pointsRelativeTo.y;

    if (bbox == null) {
      return {
        x: 0,
        y: 0,
        width: 0,
        height: 0
      };
    } else {
      return bbox;
    }
  }

  /**
   * Gets the center of an element relative to it's parent svg element.
   * @param elements
   * @return {ICoords2D}
   */
  public getCenter(...elements: SVGGraphicsElement[]): Coords2D {
    const bbox = this.getBBox(...elements);

    return {
      x: bbox.x + (bbox.width / 2),
      y: bbox.y + (bbox.height / 2)
    };
  }

  /**
   * Gets the center of elements relative to the x and y coords of the
   * relative element.
   * @param relativeEl
   * @param elements
   */
  public getCenterRelativeToElement(relativeEl: SVGGraphicsElement,
    ...elements: SVGGraphicsElement[]): Coords2D {
    const parentBBox = this.getBBox(relativeEl);
    const centerOfEls = this.getCenter(...elements);

    return {
      x: centerOfEls.x - parentBBox.x,
      y: centerOfEls.y - parentBBox.y
    };
  }

  public getCenterRelativeToPoint(point: Coords2D,
    ...elements: SVGGraphicsElement[]): Coords2D {
    const centerOfEls = this.getCenter(...elements);

    return {
      x: centerOfEls.x - point.x,
      y: centerOfEls.y - point.y
    };
  }

  /**
   * Returns an array containing the bounding boxes of all intersections
   * between the passed elements.
   * @param elements
   */
  public getIntersectionOfItems(...elements: SVGGraphicsElement[]): BBox[] {

    // Store all intersections in bbox objects
    const intersections: BBox[] = [];

    // Check that at least two elements were passed in
    if (elements.length < 2) {
        return intersections;
    }

    // Copy array to prevent any modifications to it.
    const copyOfEls = [ ...elements ];

    // Two nested for loops, compare each element against every other
    // element and create
    while (copyOfEls.length > 0) {

      // No need for a null check here, just cast as SVGElement
      const targetedEl = <SVGGraphicsElement>copyOfEls.shift();
      const targetBBox = this.getBBox(targetedEl);

      for (const otherEl of copyOfEls) {

        // Get bbox of otherEl
        const otherBBox: BBox = this.getBBox(otherEl);

        // Check for any height overlap
        if ((targetBBox.y + targetBBox.height) >= otherBBox.y) {

          // Not possible for any overlap, ignore this one
          continue;
        }

        // Check for any width overlap
        if ((targetBBox.x + targetBBox.width) <= otherBBox.x) {

          // Not possible for any overlap, ignore this one
          continue;
        }

        const overlapRect: BBox = {
          x: 0,
          y: 0,
          width: 0,
          height: 0
        };

        // Check which one is more left
        if (targetBBox.x >= otherBBox.x) {
          overlapRect.x = otherBBox.x;
        } else {
          overlapRect.x = targetBBox.x;
        }

        // Check which one is more right
        if ((targetBBox.x + targetBBox.width)
          >= (otherBBox.x + otherBBox.width)) {
          overlapRect.width = otherBBox.x + otherBBox.width;
        } else {
          overlapRect.width = targetBBox.x + targetBBox.width;
        }

        // Check which one is higher
        if (targetBBox.y <= otherBBox.y) {
          overlapRect.y = otherBBox.y;
        } else {
          overlapRect.y = targetBBox.y;
        }

        // Check which one is lower
        if ((targetBBox.y + targetBBox.height)
          <= (otherBBox.y + otherBBox.height)) {
          overlapRect.height = targetBBox.height;
        } else {
          overlapRect.height = otherBBox.height;
        }

        // Store the intersection
        intersections.push(overlapRect);
      }
    }

    return intersections;
  }

  public convertScreenCoordsToSvgCoords(point: Coords2D, svgEl: SVGSVGElement): Coords2D {
    const svgBBox = svgEl.getBoundingClientRect();

    return {
      x: point.x - svgBBox.left,
      y: point.y - svgBBox.top
    };
  }

  //#endregion
}
