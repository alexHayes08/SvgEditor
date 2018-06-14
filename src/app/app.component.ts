import { Component, ElementRef, ViewChild } from '@angular/core';
import { isSvgDefsElement } from 'src/app/helpers/svg-helpers';
import { SvgDefsComponent } from './svg-defs/svg-defs.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  //#region Fields

  public title = 'SvgEditor';
  public defs: SvgDefsComponent;

  @ViewChild('.editableArea')
  private _editableAreaEl: ElementRef<SVGGElement>;

  @ViewChild('.handles')
  private _handlesEl: ElementRef<SVGGElement>;

  @ViewChild('defs')
  private _defsEl: ElementRef;

  //#endregion

  //#region Constructor

  constructor() {

    // Verify the element is a defs element.
    if (isSvgDefsElement(this._defsEl)) {
      this.defs = new SvgDefsComponent(this._defsEl);
    }
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  //#endregion
}
