import { Injectable } from '@angular/core';

export interface UniqueIDData {
  prefix?: string;
  length?: number;
}

@Injectable({
  providedIn: 'root'
})
export class UniqueIDService {
  //#region Fields

  private last?: number;

  //#endregion

  //#region Constructor

  constructor() { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  private now(): number {
    var time = Date.now();
    let _last = this.last || time;
    return this.last = time > _last ? time : _last + 1;
  }

  /*
   * Generates a unique id.
   */
  public generateUUID(data: UniqueIDData = {}): string {
    
    // Extract config from arguments and set to default if not set.
    const { prefix = '', length = 6 } = data;

    if (prefix.length > length) {
      throw new Error('The prefix cannot be greater than the length.');
    }

    let id = prefix + this.now().toString(36);

    // do {
    //   id = prefix + this.now();
    // } while (!this.isIdAlreadyInUse(id));

    return prefix + id;
  }

  public isIdAlreadyInUse(id: string) {
    return document.getElementById(id) === undefined;
  }

  //#endregion
}
