import { Component, OnInit } from '@angular/core';
import { SvgItem } from 'src/app/models/svg-item';
import { UniqueIDService } from 'src/app/services/unique-id.service';

export interface Layer {
  name: string;
  items: SvgItem[];
}

@Component({
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
      name: "default",
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
      let maskEl = document.getElementById(id);
      if (maskEl === undefined) {
        this._maskUrl = undefined;
        return;
      }

      // Check if the mask contains more than one element.
      let children = Array.from(maskEl.querySelectorAll("*"));
      // TODO: Finish this...

      // Check if the mask contains elements
      this._maskUrl = `url(${id})`;
    }
  }

  //#endregion

  //#region Functions

  public addItem(svgItem: SVGElement, layer: string|number = 0): void {
    const layerIndex = this.layers.findIndex(
      (l, index) => layer === l.name || layer === index);

    // Check that the layer was found.
    if (layerIndex === -1) {
      throw new Error("No layer found matching that name or index.");
    }

    const item = new SvgItem();
    this.layers[layerIndex].items.push(item);
  }

  public ngOnInit() { }

  //#endregion

}
