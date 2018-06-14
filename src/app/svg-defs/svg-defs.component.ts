import { Component, OnInit } from '@angular/core';
import { NotImplementedError } from 'src/app/models/errors';
import { UniqueIDService } from 'src/app/services/unique-id.service';

@Component({
  selector: '[svg-defs]',
  templateUrl: './svg-defs.component.html',
  styleUrls: ['./svg-defs.component.css']
})
export class SvgDefsComponent implements OnInit {
  //#region Fields

  public readonly id: string;

  //#endregion

  //#region constructor

  public constructor(private uniqueIdService: UniqueIDService) {
    this.id = uniqueIdService.generateUUID();
  }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  /**
   * Ideally this will remove the element with that id and append it to the
   * defs and set the data-section attribute to the section.
   * @param id 
   * @param section 
   */
  public pushToSection(id: string, section: string): void {
    throw new NotImplementedError();
  }

  /**
   * This will remove the item from the defs element and return it.
   * @param id 
   * @param section 
   */
  public pullFromSection(id: string, section?: string): Element {
    throw new NotImplementedError();
  }

  public ngOnInit() { }

  //#endregion
}
