import { Component, OnInit, NgZone } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { OfflineService } from '../../../modo_offline/offline-sync.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  isOnline = true;
  mostrarModalOffline = false;

  mensajeNotificacion: string = '';
  mostrarAlertaPantalla: boolean = false;
  private timeoutAlerta: any;

  datoAGuardar = { titulo: 'Nueva tarea del proyecto', id: 1 };

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private offlineService: OfflineService
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
    const estadoAnterior = this.isOnline;
    this.isOnline = conectado;

    if (!conectado) {
      this.mostrarModalOffline = true;
    } else {
      this.mostrarModalOffline = false;
      if (!estadoAnterior && conectado) {
        this.mostrarMensaje('Se ha recuperado la conexión');
      }
    }

    this.cdr.detectChanges();
  }

  cerrarModal() {
    this.mostrarModalOffline = false;
    this.cdr.detectChanges();
  }

  private mostrarMensaje(texto: string) {
    if (this.timeoutAlerta) {
      clearTimeout(this.timeoutAlerta);
    }

    this.mensajeNotificacion = texto;
    this.mostrarAlertaPantalla = true;
    this.cdr.detectChanges();

    this.timeoutAlerta = setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarAlertaPantalla = false;
        this.cdr.detectChanges();
      });
    }, 4000);
  }

  async guardarDatos() {
    const simularLlamadaHttp = async (datos: any) => {
      return new Promise((resolve) => setTimeout(() => resolve('Éxito'), 1000));
    };

    const resultado = await this.offlineService.guardarOEnviar(
      '/api/tareas', 
      'POST', 
      this.datoAGuardar, 
      simularLlamadaHttp
    );

    if (resultado.enviadoAlServidor) {
      this.mostrarMensaje('✅ ¡Guardado en la nube exitosamente!');
    } else {
      this.mostrarMensaje('⚠️ Sin conexión. El dato se guardó localmente.');
    }
  }
}