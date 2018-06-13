import { Component, ViewChild } from '@angular/core';
import { SvgDefsComponent } from './svg-defs/svg-defs.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  //#region Fields

  public title = 'SvgEditor';

  @ViewChild('.editableArea')
  private _editableAreaEl!: SVGClipPathElement;

  @ViewChild(".handles")
  private _handlesEl!: SVGGElement;
  
  @ViewChild("defs")
  private _defsEl!: SVGDefsElement;
  // public defs: SvgDefsComponent;

  //#endregion

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  //#endregion
}
