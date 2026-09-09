import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TableroPage } from './tablero.page';

const routes: Routes = [
  {
    path: '',
    component: TableroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TableroPageRoutingModule {}
