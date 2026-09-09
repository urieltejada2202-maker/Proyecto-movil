import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Network, ConnectionStatus } from '@capacitor/network';
import { OfflineService } from '../../../modo_offline/offline-sync.service';

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  styleUrls: ['./tareas.page.scss'],
  standalone: false,
})
export class TareasPage implements OnInit, OnDestroy {
  mostrarMenu: boolean = false;
  isOnline: boolean = true;
  mostrarModalOffline = false;

  mensajeNotificacion: string = '';
  tipoNotificacion: 'success' | 'warning' = 'success';
  mostrarAlertaPantalla: boolean = false;
  private timeoutAlerta: any;

  tareasPersonales = [
    { texto: 'Implementar pantalla de dashboard', completada: true },
    { texto: 'Crear componente TaskCard', completada: true },
    { texto: 'Añadir animaciones de transición', completada: false },
    { texto: 'Revisión de código con equipo', completada: false },
    { texto: 'Validar formularios con Angular Reactive Forms', completada: false },
    { texto: 'Documentar endpoints de la API', completada: false }
  ];

  private onlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(true));
  private offlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(false));

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private offlineService: OfflineService
  ) {}

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

  ngOnDestroy() {
    window.removeEventListener('online', this.onlineListenerHandler);
    window.removeEventListener('offline', this.offlineListenerHandler);
  }

  actualizarEstado(conectado: boolean) {
    const estadoAnterior = this.isOnline;
    this.isOnline = conectado;

    if (!conectado) {
      this.mostrarModalOffline = true;
    } else {
      this.mostrarModalOffline = false;
      // Solo muestra el aviso si realmente estaba desconectado antes
      if (!estadoAnterior && conectado) {
        this.mostrarMensaje('Se ha recuperado la conexión', 'success');
      }
    }

    this.cdr.detectChanges();
  }

  get tareasCompletadasCount() {
    return this.tareasPersonales.filter(t => t.completada).length;
  }

  get porcentajeProgreso() {
    if (this.tareasPersonales.length === 0) return 0;
    return Math.round((this.tareasCompletadasCount / this.tareasPersonales.length) * 100);
  }

  abrirMenu() {
    this.mostrarMenu = true;
    this.cdr.detectChanges();
  }

  cerrarMenu() {
    this.mostrarMenu = false;
    this.cdr.detectChanges();
  }

  irA(ruta: string) {
    this.mostrarMenu = false;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.router.navigate([ruta]);
    }, 100);
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'warning') {
    this.ngZone.run(() => {
      if (this.timeoutAlerta) {
        clearTimeout(this.timeoutAlerta);
      }

      this.mensajeNotificacion = texto;
      this.tipoNotificacion = tipo;
      this.mostrarAlertaPantalla = true;
      this.cdr.detectChanges();

      this.timeoutAlerta = setTimeout(() => {
        this.ngZone.run(() => {
          this.mostrarAlertaPantalla = false;
          this.cdr.detectChanges();
        });
      }, 4000);
    });
  }

  async guardarDatos() {
    const tareaNueva = { texto: 'Nueva tarea offline', completada: false };

    const simularHttp = async (datos: any) => {
      return new Promise((resolve) => setTimeout(() => resolve('Ok'), 1000));
    };

    const resultado = await this.offlineService.guardarOEnviar(
      '/api/tareas', 
      'POST', 
      tareaNueva, 
      simularHttp
    );

    if (resultado.enviadoAlServidor) {
      this.mostrarMensaje('¡Guardado en la nube exitosamente!', 'success');
    } else {
      this.mostrarMensaje('Sin conexión. Guardado localmente, se sincronizará al volver.', 'warning');
    }
  }
}