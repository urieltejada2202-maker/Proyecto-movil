import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  isOnline = true;
  mostrarModalOffline = false;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {

    try {

      const status = await Network.getStatus();

      this.actualizarEstado(status.connected);

      Network.addListener(
        'networkStatusChange',
        (status: ConnectionStatus) => {

          this.ngZone.run(() => {
            this.actualizarEstado(status.connected);
          });

        }
      );

    } catch (error) {

      this.actualizarEstado(navigator.onLine);

    }

    window.addEventListener('offline', () => {

      this.ngZone.run(() => {
        this.actualizarEstado(false);
      });

    });

    window.addEventListener('online', () => {

      this.ngZone.run(() => {
        this.actualizarEstado(true);
      });

    });
  }

  actualizarEstado(conectado: boolean) {

    this.isOnline = conectado;

    if (!conectado) {
      this.mostrarModalOffline = true;
    }

    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.mostrarModalOffline = false;
    this.cdr.detectChanges();
  }
}