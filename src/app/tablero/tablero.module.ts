import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { TableroPageRoutingModule } from './tablero-routing.module';

import { TableroPage } from './tablero.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TableroPageRoutingModule
  ],
  declarations: [TableroPage]
})
export class TableroPageModule {}
