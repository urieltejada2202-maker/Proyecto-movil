import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { Network, ConnectionStatus } from '@capacitor/network';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html',
  styleUrls: ['./tablero.page.scss'],
  standalone: false,
})
export class TableroPage implements OnInit, OnDestroy {
  filtroActual: string = 'enProceso';
  mostrarMenu: boolean = false;
  isOnline: boolean = true;
  mostrarModalOffline = false;

  listaTareas = [
    { id: '#01', titulo: 'Implementar autenticación', estado: 'enProceso', prioridad: 'ALTA', avatar: 'ST', responsable: 'Stevenson Tavárez' },
    { id: '#02', titulo: 'Componentes de navegación', estado: 'enProceso', prioridad: 'Media', avatar: 'JP', responsable: 'José Pérez' },
    { id: '#03', titulo: 'Revisión general de diseño', estado: 'enProceso', prioridad: 'Baja', avatar: 'UT', responsable: 'Uriel Tejada' },
    { id: '#01', titulo: 'Diseñar interfaz inicial', estado: 'porHacer', prioridad: 'ALTA', avatar: 'UT', responsable: 'Uriel Tejada' },
    { id: '#02', titulo: 'Estructurar base de datos local', estado: 'porHacer', prioridad: 'Media', avatar: 'JG', responsable: 'Junior Gómez' },
    { id: '#03', titulo: 'Definir casos de prueba QA', estado: 'porHacer', prioridad: 'Baja', avatar: 'DP', responsable: 'Darlenny Pimentel' },
    { id: '#01', titulo: 'Configurar servidor y dependencias', estado: 'hecho', prioridad: 'ALTA', avatar: 'JG', responsable: 'Junior Gómez' },
    { id: '#02', titulo: 'Crear repositorio en Git y ramas', estado: 'hecho', prioridad: 'Media', avatar: 'ST', responsable: 'Stevenson Tavárez' }
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

  get tareasFiltradas() {
    return this.listaTareas.filter(t => t.estado === this.filtroActual);
  }

  cambiarFiltro(estado: string) {
    this.filtroActual = estado;
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