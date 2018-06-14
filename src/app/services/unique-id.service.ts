import { Injectable } from '@angular/core';
import * as uniqid from 'uniqid';

@Injectable({
  providedIn: 'root'
})
export class UniqueIDService {
  //#region Fields

  //#endregion

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  public generateUUID(): string {
    let id = uniqid.time();

    // This check should be uncessary but it's technically possible for an id
    // to already exist.
    if (document !== undefined) {
      while (document.getElementById(id) !== undefined) {
        id = uniqid.time();
      }
    }

    return id;
  }

  //#endregion
}
