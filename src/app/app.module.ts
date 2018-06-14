import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SvgDefsComponent } from './svg-defs/svg-defs.component';
import { UserInterfaceComponent } from './user-interface/user-interface.component';
import { SvgEditorComponent } from './svg-editor/svg-editor.component';
import { SvgItemComponent } from './svg-item/svg-item.component';
import { SvgLayerComponent } from './svg-layer/svg-layer.component';

@NgModule({
  declarations: [
    AppComponent,
    SvgDefsComponent,
    UserInterfaceComponent,
    SvgEditorComponent,
    SvgItemComponent,
    SvgLayerComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
