import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { SvgDefsComponent } from './svg-defs/svg-defs.component';

@NgModule({
  declarations: [
    AppComponent,
    SvgDefsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
