/* 
 * Facilitador, todo esto fue implementado en las páginas principales (Home, Tablero, Tareas)
 * Utilizando @capacitor/network para detección nativa en tiempo real.
 */
import { Network, ConnectionStatus } from '@capacitor/network';
import { NgZone, ChangeDetectorRef } from '@angular/core';

// Está es la lógica de inicialización en el ngOnInit() de las páginas:
async ngOnInit() {
  try {
    const status = await Network.getStatus();
    this.actualizarEstado(status.connected);

    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.ngZone.run(() => {
        this.actualizarEstado(status.connected);
      });
    });
  } catch (error) {
    this.actualizarEstado(navigator.onLine);
  }

  window.addEventListener('online', this.onlineListenerHandler);
  window.addEventListener('offline', this.offlineListenerHandler);
}

actualizarEstado(conectado: boolean) {
  this.isOnline = conectado;
  if (!conectado) {
    this.mostrarModalOffline = true;
  }
  this.cdr.detectChanges();
}