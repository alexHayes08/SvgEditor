import * as d3 from "d3";
import { 
  Component, 
  EventEmitter, 
  Input, 
  Output, 
  OnInit 
} from '@angular/core';
import { NS } from 'src/app/helpers/namespace-helpers';
import { UniqueIDService } from "../services/unique-id.service";

@Component({
  selector: 'user-interface',
  templateUrl: './user-interface.component.html',
  styleUrls: ['./user-interface.component.css']
})
export class UserInterfaceComponent implements OnInit {
  //#region Fields

  @Output()
  public addShape = new EventEmitter<SVGElement>();

  //#endregion

  //#region Constructor

  public constructor(private uniqueIDService: UniqueIDService) { }

  //#endregion

  //#region Properties

  //#endregion

  //#region Functions

  public addSquare(): void {
    let square = <SVGElement>document.createElementNS(NS.SVG, 'rect');
    d3.select(square)
      .attr("id", this.uniqueIDService.generateUUID())
      .attr("width", 50)
      .attr("height", 50)
      .attr("fill", "blue")
      .attr("stroke", "orange")
      .attr("stroke-width", 2);
    
    this.addShape.emit(square);
  }

  public ngOnInit() { }

  //#endregion
}
