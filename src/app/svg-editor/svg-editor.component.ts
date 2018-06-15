import { Component, OnInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { SvgItem } from 'src/app/models/svg-item';
import { UniqueIDService } from 'src/app/services/unique-id.service';
import { NotImplementedError } from 'src/app/models/errors';
import {} from 'redux';

export enum EditorSection {
  UNDER_EDITOR = 0,
  EDITOR = 1,
  OVER_EDITOR = 2
}

export interface Layer {
  name: string;
  items: SvgItem[];
}

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[svg-editor]',
  templateUrl: './svg-editor.component.html',
  styleUrls: ['./svg-editor.component.css']
})
export class SvgEditorComponent implements OnInit {
  //#region Fields

  private readonly _editorAreaMaskID: string;
  private readonly _editorID: string;
  private readonly _overEditorID: string;
  private readonly _underEditorID: string;

  @ViewChildren('.layer')
  private _layerEls: QueryList<ElementRef>;

  private _maskUrl?: string;

  public layers: Layer[];

  //#endregion

  //#region Constructor

  public constructor(private uniqueIDService: UniqueIDService) {
    this._editorAreaMaskID = this.uniqueIDService.generateUUID();
    this._editorID = this.uniqueIDService.generateUUID();
    this._overEditorID = this.uniqueIDService.generateUUID();
    this._underEditorID = this.uniqueIDService.generateUUID();
    this.layers = [{
      name: 'default',
      items: []
    }];
  }

  //#endregion

  //#region Properties

  public get mask() {
    return this._maskUrl;
  }

  public set mask(id: string|undefined) {
    if (id === undefined) {
      this._maskUrl = id;
    } else {

      // Verify the id points to a valid element.
      const maskEl = document.getElementById(id);
      if (maskEl === undefined) {
        this._maskUrl = undefined;
        return;
      }

      // Check if the mask contains more than one element.
      const children = Array.from(maskEl.querySelectorAll('*'));
      // TODO: Finish this...

      children.map(c => c.attributes);

      // Check if the mask contains elements
      this._maskUrl = `url(${id})`;
    }
  }

  //#endregion

  //#region Functions

  private getLayerElement(index: number = 0): Element {
    return this._layerEls[index];
  }

  public addLayer(name: string): void {
    throw new NotImplementedError();
  }

  public removeLayer(name: string): void {
    throw new NotImplementedError();
  }

  public addItem(element: SVGElement, layer: string|number = 0): void {
    const layerIndex = this.layers.findIndex(
      (l, index) => layer === l.name || layer === index);

    // Check that the layer was found.
    if (layerIndex === -1) {
      throw new Error('No layer found matching that name or index.');
    }

    const item = new SvgItem(element);
    // const itemIndex = this.layers[layerIndex].items.push(item);
    // this.layers[layerIndex].items[itemIndex].displayed = true;
  }

  public ngOnInit() { }

  //#endregion

}
