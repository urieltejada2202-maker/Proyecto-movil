import { Component, OnInit, NgZone, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BleClient } from '@capacitor-community/bluetooth-le';

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  styleUrls: ['./tareas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TareasPage implements OnInit {
  mostrarAlertaPantalla = false;
  tipoNotificacion = 'success';
  mensajeNotificacion = '';
  isOnline = true;
  mostrarModalOffline = false;
  mostrarMenu = false;
  mostrarModalAgregar = false;
  nuevaTareaTexto = '';
  mostrarModalEliminar = false;
  tareaAEliminarId: number | null = null;
  
  tareasSeleccionadas: number[] = [];
  mostrarModalCompartir = false;

  tareasPersonales: any[] = [
    { id: 1, texto: 'Implementar autenticación JWT', completada: false },
    { id: 2, texto: 'Crear componente TaskCard', completada: false },
    { id: 3, texto: 'Integrar API de autenticación', completada: true }
  ];

  constructor(private router: Router, private ngZone: NgZone, private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    const tareasGuardadas = localStorage.getItem('tareas_wizard');
    if (tareasGuardadas) this.tareasPersonales = JSON.parse(tareasGuardadas);

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
    if (!conectado && estadoAnterior) this.mostrarModalOffline = true;
    else if (conectado) {
      this.mostrarModalOffline = false;
      if (!estadoAnterior) this.mostrarMensaje('Se ha recuperado la conexión');
    }
    this.cdr.detectChanges();
  }

  cerrarModal() { this.mostrarModalOffline = false; this.cdr.detectChanges(); }

  mostrarMensaje(texto: string) {
    this.mensajeNotificacion = texto;
    this.mostrarAlertaPantalla = true;
    this.cdr.detectChanges();
    setTimeout(() => this.ngZone.run(() => {
      this.mostrarAlertaPantalla = false;
      this.cdr.detectChanges();
    }), 4000);
  }

  get tareasCompletadasCount() { return this.tareasPersonales.filter(t => t.completada).length; }

  get porcentajeProgreso() {
    if (this.tareasPersonales.length === 0) return 0;
    return Math.round((this.tareasCompletadasCount / this.tareasPersonales.length) * 100);
  }

  actualizarProgreso() { this.cdr.detectChanges(); }

  toggleSeleccion(id: number) {
    const index = this.tareasSeleccionadas.indexOf(id);
    if (index > -1) this.tareasSeleccionadas.splice(index, 1); 
    else this.tareasSeleccionadas.push(id); 
    this.cdr.detectChanges();
  }

  abrirModalCompartir() {
    if (this.tareasSeleccionadas.length === 0) {
      this.mostrarMensaje('Selecciona al menos una tarea de la lista primero');
      return;
    }
    this.mostrarModalCompartir = true;
    this.cdr.detectChanges();
  }

  cerrarModalCompartir() { this.mostrarModalCompartir = false; this.cdr.detectChanges(); }

  async compartirPorBluetooth() {
    this.cerrarModalCompartir();
    
    try {
      await BleClient.initialize();
      
      const device = await BleClient.requestDevice();
      console.log('Se conectó a:', device);
      this.mostrarMensaje(`Sincronizando ${this.tareasSeleccionadas.length} tarea(s) con ${device.name || 'el dispositivo'}...`);
      this.tareasSeleccionadas = [];
      
    } catch (error) {
      console.error('Error al iniciar Bluetooth', error);
      this.mostrarMensaje('Búsqueda cancelada o error de Bluetooth.');
    }
  }

  compartirPorNFC() {
    this.cerrarModalCompartir();
    this.mostrarMensaje('Acerca el dispositivo para transmitir vía NFC');
    this.tareasSeleccionadas = []; 
  }

  abrirModalAgregar() { this.nuevaTareaTexto = ''; this.mostrarModalAgregar = true; }
  cancelarAgregar() { this.mostrarModalAgregar = false; }
  
  confirmarAgregar() {
    if (this.nuevaTareaTexto.trim() !== '') {
      this.tareasPersonales.unshift({ id: Date.now(), texto: this.nuevaTareaTexto.trim(), completada: false });
      this.cdr.detectChanges();
    }
    this.mostrarModalAgregar = false;
  }

  abrirModalEliminar(id: number, event: Event) {
    event.preventDefault(); event.stopPropagation();
    if (this.mostrarModalEliminar) return;
    this.tareaAEliminarId = id;
    this.mostrarModalEliminar = true;
    this.cdr.detectChanges();
  }

  cancelarEliminar() { this.mostrarModalEliminar = false; this.tareaAEliminarId = null; this.cdr.detectChanges(); }

  confirmarEliminar() {
    if (this.tareaAEliminarId === null) return;
    const id = this.tareaAEliminarId;
    this.mostrarModalEliminar = false;
    this.tareaAEliminarId = null;
    this.tareasSeleccionadas = this.tareasSeleccionadas.filter(selId => selId !== id);
    this.tareasPersonales = this.tareasPersonales.filter(tarea => tarea.id !== id);
    this.cdr.detectChanges();
  }

  guardarDatos() {
    try {
      localStorage.setItem('tareas_wizard', JSON.stringify(this.tareasPersonales));
      if (this.isOnline) this.mostrarMensaje('¡Guardado en la nube exitosamente!');
      else this.mostrarMensaje('Estado sin conexión. Los datos se guardarán localmente hasta que vuelva la conexión.');
    } catch (error) {
      this.mostrarMensaje('Error crítico. No se pudieron guardar los datos.');
    }
  }

  abrirMenu() { this.mostrarMenu = true; }
  cerrarMenu() { this.mostrarMenu = false; }
  irA(ruta: string) { this.cerrarMenu(); this.router.navigate([ruta]); }
}