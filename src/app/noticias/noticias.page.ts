import { Component, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.page.html',
  styleUrls: ['./noticias.page.scss'],
  standalone: false
})
export class NoticiasPage {
  noticias: any[] = [];
  cargando = true;

  constructor(private cdr: ChangeDetectorRef) {}

  ionViewWillEnter() {
    this.cargarNoticias();
  }

  cargarNoticias() {
    this.noticias = [
      {
        title: 'Angular 18 revoluciona el desarrollo web',
        source: { name: 'Tech Blog' },
        urlToImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
        url: 'https://angular.io/'
      },
      {
        title: 'Ionic anuncia nuevos componentes Neo-Brutalistas',
        source: { name: 'Ionic Framework' },
        urlToImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=800&auto=format&fit=crop',
        url: 'https://ionicframework.com/'
      },
      {
        title: 'El auge del diseño con bordes gruesos',
        source: { name: 'UI/UX Daily' },
        urlToImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
        url: 'https://dribbble.com/'
      }
    ];
    
    this.cargando = false;
    this.cdr.detectChanges();
  }
}