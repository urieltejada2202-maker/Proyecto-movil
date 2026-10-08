import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';

@Component({
  selector: 'app-noticias',
  templateUrl: './noticias.page.html',
  styleUrls: ['./noticias.page.scss'],
  standalone: false
})
export class NoticiasPage implements OnInit {
  noticias: any[] = [];
  cargando = true;
  mostrarAlertaPantalla = false;
  mensajeNotificacion = '';
  isOnline = true;
  mostrarModalOffline = false;

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {}

  ionViewWillEnter() {
    this.cargarNoticias();
  }

  async ngOnInit() {
    try {
      const status = await Network.getStatus();
      this.actualizarEstado(status.connected);
      Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
        this.ngZone.run(() => this.actualizarEstado(status.connected));
      });
    } catch (error) {
      this.actualizarEstado(navigator.onLine);
    }

    window.addEventListener('offline', () => this.ngZone.run(() => this.actualizarEstado(false)));
    window.addEventListener('online', () => this.ngZone.run(() => this.actualizarEstado(true)));
  }

  actualizarEstado(conectado: boolean) {
    const estadoAnterior = this.isOnline;
    this.isOnline = conectado;
    
    if (!conectado && estadoAnterior) {
      this.mostrarModalOffline = true;
    } else if (conectado) {
      this.mostrarModalOffline = false;
      if (!estadoAnterior) this.mostrarMensaje('Se ha recuperado la conexión');
    }
    this.cdr.detectChanges();
  }

  cerrarModal() { 
    this.mostrarModalOffline = false; 
    this.cdr.detectChanges(); 
  }
  
  mostrarMensaje(texto: string) {
    this.mensajeNotificacion = texto;
    this.mostrarAlertaPantalla = true;
    this.cdr.detectChanges();
    setTimeout(() => this.ngZone.run(() => {
      this.mostrarAlertaPantalla = false;
      this.cdr.detectChanges();
    }), 4000);
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