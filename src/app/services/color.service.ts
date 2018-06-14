import { Injectable } from '@angular/core';

const STANDARD_COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "indigo",
  "violet"
]

@Injectable({
  providedIn: 'root'
})
export class ColorService {

  constructor() { }

  //#region Functions

  public random(): string {
    const rndIndex = Math.floor(Math.random() * STANDARD_COLORS.length);
    return STANDARD_COLORS[rndIndex];
  }

  //#endregion
}
