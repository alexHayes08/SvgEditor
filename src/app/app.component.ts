import { Component, OnInit, ViewChild } from '@angular/core';
import { UniqueIDService } from 'src/app/services/unique-id.service';
import { SvgEditorComponent } from 'src/app/svg-editor/svg-editor.component';

@Component({
  selector: 'aperture-svg-editor',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  //#region Fields

  @ViewChild(SvgEditorComponent) editor: SvgEditorComponent;

  private readonly _defsID: string;
  private readonly _editorID: string;
  private readonly _handlesID: string;

  public title = 'Aperture-Svg-Editor';

  //#endregion

  //#region Constructor

  public constructor(private uniqueIDService: UniqueIDService) {
    this._defsID = uniqueIDService.generateUUID();
    this._editorID = uniqueIDService.generateUUID();
    this._handlesID = uniqueIDService.generateUUID();
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  public onAddShape(element: SVGElement): void {
    console.log("App heard event, element is:");
    console.log(element);
    this.editor.addItem(element);
  }

  public ngOnInit(): void {
    Array.from(document.querySelectorAll(".loading.loading-on"))
      .map(el => {
        el.classList.remove("loading-on");
        el.classList.add("loading-off");
      });
  }

  //#endregion
}
