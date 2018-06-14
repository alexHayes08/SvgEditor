import { Injectable } from '@angular/core';
import { getFurthestSvgOwner } from 'src/app/helpers/svg-helpers';
import { BBox } from 'src/app/models/geometry';

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
      if (elements.length == 0) {
          throw new Error("No elements were passed in.");
      }

      let parentSvgBBox = getFurthestSvgOwner(elements[0])
          .getBoundingClientRect();

      let firstElBBox = elements[0].getBoundingClientRect();

      let bbox = {
          top: firstElBBox.top,
          bottom: firstElBBox.bottom,
          left: firstElBBox.left,
          right: firstElBBox.right
      };

      for (let i = 1; i < elements.length; i++) {
          let element = elements[i];
          let elBBox = element.getBoundingClientRect();

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

  //#endregion
}
