import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { TareasStorageService } from '../tareas/tareas-storage.service';

@Component({
  selector: 'app-tablero',
  templateUrl: './tablero.page.html', 
  styleUrls: ['./tablero.page.scss'],
  standalone: false,
})
export class TableroPage implements OnInit, OnDestroy { 
  filtroActual: string = 'porHacer';
  isOnline: boolean = true;
  mostrarModalOffline = false;
  mensajeNotificacion: string = '';
  mostrarAlertaPantalla: boolean = false;
  private timeoutAlerta: any;
  listaTareas: any[] = []; 
  mostrarModalPrioridad = false;
  tareaSeleccionadaParaPrioridad: any = null;

  private onlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(true));
  private offlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(false));

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private tareasStorage: TareasStorageService
  ) {}

  async ionViewWillEnter() {
    await this.cargarTareasDesdeAlmacenamiento();
  }

  async cargarTareasDesdeAlmacenamiento() {
    const tareasGuardadas = await this.tareasStorage.obtenerTareas();
    
    this.listaTareas = tareasGuardadas.map((t: any) => {
      if (t.completada && t.estado !== 'hecho') t.estado = 'hecho';
      if (!t.completada && t.estado === 'hecho') t.estado = 'porHacer';
      
      return {
        ...t,
        estado: t.estado || 'porHacer',
        prioridad: t.prioridad || 'Media',
        avatar: t.avatar || 'UT',
        responsable: t.responsable || 'Uriel Tejada'
      };
    });

    this.cdr.detectChanges();
  }

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
      if (!estadoAnterior && conectado) {
        this.mostrarMensaje('Se ha recuperado la conexión');
      }
    }

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

  get tareasFiltradas() {
    return this.listaTareas.filter(t => t.estado === this.filtroActual);
  }

  cambiarFiltro(estado: string) {
    this.filtroActual = estado;
  }

  getIdCorto(id: any) {
    if (!id) return '#000';
    const str = id.toString();
    return str.length > 4 ? '#' + str.slice(-4) : '#' + str; 
  }

  async cambiarEstado(tarea: any, nuevoEstado: string) {
    tarea.estado = nuevoEstado;
    
    if (nuevoEstado === 'hecho') {
      tarea.completada = true;
    } else {
      tarea.completada = false;
    }

    await this.tareasStorage.guardarTareas(this.listaTareas);
    this.cdr.detectChanges();
  }

  abrirModalPrioridad(tarea: any) {
    this.tareaSeleccionadaParaPrioridad = tarea;
    this.mostrarModalPrioridad = true;
    this.cdr.detectChanges();
  }

  cerrarModalPrioridad() {
    this.tareaSeleccionadaParaPrioridad = null;
    this.mostrarModalPrioridad = false;
    this.cdr.detectChanges();
  }

  async seleccionarPrioridad(nuevaPrioridad: string) {
    if (this.tareaSeleccionadaParaPrioridad) {
      this.tareaSeleccionadaParaPrioridad.prioridad = nuevaPrioridad;
      await this.tareasStorage.guardarTareas(this.listaTareas);
    }
    this.cerrarModalPrioridad();
  }
}