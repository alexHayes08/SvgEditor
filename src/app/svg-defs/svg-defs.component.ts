import { Component, OnInit } from '@angular/core';
import { NS } from '../../helpers/namespace-helpers';

@Component({
  selector: 'app-svg-defs',
  templateUrl: './svg-defs.component.html',
  styleUrls: ['./svg-defs.component.css']
})
export class SvgDefsComponent implements OnInit {
  //#region Fields

  protected readonly defsElement: SVGDefsElement;

  //#endregion

  //#region constructor

  constructor(defs: SVGDefsElement) {
    this.defsElement = defs;
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  ngOnInit() {
  }

  //#endregion
}
