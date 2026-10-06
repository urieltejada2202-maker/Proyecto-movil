import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'tablero',
        loadChildren: () => import('../tablero/tablero.module').then(m => m.TableroPageModule)
      },
      {
        path: 'tareas',
        loadChildren: () => import('../tareas/tareas.module').then(m => m.TareasPageModule)
      },
      {
        path: 'mapa',
        loadComponent: () => import('../mapa/mapa.page').then(m => m.MapaPage)
      },
      {
        path: 'noticias',
        loadChildren: () => import('../noticias/noticias.module').then(m => m.NoticiasPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsPageRoutingModule {}