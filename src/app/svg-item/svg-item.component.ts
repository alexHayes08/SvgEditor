import { Component, ElementRef, OnInit, Renderer, ViewChild } from '@angular/core';
import { SvgTransformString } from 'src/app/models/svg-transform-string';
import { TransformType } from 'src/app/models/transformable';
import { UniqueIDService } from 'src/app/services/unique-id.service';

@Component({
  // tslint:disable-next-line:component-selector
  selector: '[svg-item]',
  templateUrl: './svg-item.component.html',
  styleUrls: ['./svg-item.component.css']
})
export class SvgItemComponent implements OnInit {
  //#region Fields

  private readonly id: string;
  private transformData: SvgTransformString;
  private transformString: string;

  @ViewChild('.item')
  private content: ElementRef;

  //#endregion

  //#region Constructor

  constructor(private uniqueIDService: UniqueIDService,
    private renderer: Renderer) {
    this.id = this.uniqueIDService.generateUUID();
    this.transformData = new SvgTransformString([TransformType.MATRIX]);
    this.transformString = this.transformData.toTransformString();
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  public setContent(elements: SVGElement[]): void {
    this.renderer.projectNodes(this.content.nativeElement, elements);
  }

  public ngOnInit() { }

  //#endregion
}
