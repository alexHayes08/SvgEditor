import { Component, OnInit } from '@angular/core';
import { SvgItem } from 'src/app/models/svg-item';

@Component({
  selector: 'app-svg-layer',
  templateUrl: './svg-layer.component.html',
  styleUrls: ['./svg-layer.component.css']
})
export class SvgLayerComponent implements OnInit {

  public items: SvgItem[];

  constructor() { }

  ngOnInit() {
  }

}
