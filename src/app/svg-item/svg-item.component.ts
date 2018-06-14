import { Component, OnInit } from '@angular/core';
import { UniqueIDService } from '../services/unique-id.service';
import { SvgTransformString } from 'src/app/models/svg-transform-string';
import { TransformType } from '../models/transformable';

@Component({
  selector: '[svg-item]',
  templateUrl: './svg-item.component.html',
  styleUrls: ['./svg-item.component.css']
})
export class SvgItemComponent implements OnInit {
  //#region Fields

  private readonly id: string;
  private transformData: SvgTransformString;
  private transformString: string;

  //#endregion

  //#region Constructor

  constructor(private uniqueIDService: UniqueIDService) {
    this.id = this.uniqueIDService.generateUUID();
    this.transformData = new SvgTransformString([TransformType.MATRIX]);
    this.transformString = this.transformData.toTransformString();
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  ngOnInit() { }

  //#endregion
}
