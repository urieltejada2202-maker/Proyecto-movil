/* 
 * Facilitador, todo esto fue implementado en las páginas principales (Home, Tablero, Tareas)
 * Utilizando @capacitor/network para detección nativa en tiempo real.
 */
import { Injectable, NgZone } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkService {
  private onlineSubject = new BehaviorSubject<boolean>(true);
  public isOnline$ = this.onlineSubject.asObservable();
  public isOnline = true;

  constructor(private ngZone: NgZone) {
    this.initNetwork();
  }

  async initNetwork() {
    const status = await Network.getStatus();
    this.actualizarEstado(status.connected);

    Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
      this.ngZone.run(() => {
        this.actualizarEstado(status.connected);
      });
    });
  }

  private actualizarEstado(conectado: boolean) {
    this.isOnline = conectado;
    this.onlineSubject.next(conectado);
  }
}