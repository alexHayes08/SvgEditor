import { Component, OnInit } from '@angular/core';
import { UniqueIDService } from 'src/app/services/unique-id.service';

@Component({
  selector: 'app-svg-defs',
  templateUrl: './svg-defs.component.html',
  styleUrls: ['./svg-defs.component.css']
})
export class SvgDefsComponent implements OnInit {
  //#region Fields

  protected readonly defsElement: SVGDefsElement;

  public id: string;

  //#endregion

  //#region constructor

  constructor(defs: SVGDefsElement, private uniqueIdService: UniqueIDService) {
    this.defsElement = defs;
    this.id = uniqueIdService.generateUUID();
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  ngOnInit() {
  }

  //#endregion
}
