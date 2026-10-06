import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NoticiasPageRoutingModule } from './noticias-routing.module';
import { NoticiasPage } from './noticias.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    NoticiasPageRoutingModule,
    HttpClientModule
  ],
  declarations: [NoticiasPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA] 
})
export class NoticiasPageModule {}