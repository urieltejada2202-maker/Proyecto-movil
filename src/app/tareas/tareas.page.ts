import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Network, ConnectionStatus } from '@capacitor/network';

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  styleUrls: ['./tareas.page.scss'],
  standalone: false,
})
export class TareasPage implements OnInit, OnDestroy {
  mostrarMenu: boolean = false;
  isOnline: boolean = true;

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
    private cdr: ChangeDetectorRef
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
    this.isOnline = conectado;
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
  }

  cerrarMenu() {
    this.mostrarMenu = false;
  }

  irA(ruta: string) {
    this.mostrarMenu = false;
    setTimeout(() => {
      this.router.navigate([ruta]);
    }, 100);
  }
}