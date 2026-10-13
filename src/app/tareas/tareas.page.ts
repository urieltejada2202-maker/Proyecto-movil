import {
  Component, OnInit, NgZone, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';
import { Filesystem } from '@capacitor/filesystem';
import { TareasStorageService } from './tareas-storage.service';

interface MultimediaItem {
  id: number;
  nombre: string;
  tipo: 'imagen' | 'video';
  url: string;
}

@Component({
  selector: 'app-tareas',
  templateUrl: './tareas.page.html',
  styleUrls: ['./tareas.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TareasPage implements OnInit {
  @ViewChild('selectorMultimedia') selectorMultimedia!: ElementRef<HTMLInputElement>;

  usuarioActivo: any = null;
  mostrarAlertaPantalla = false;
  mensajeNotificacion = '';
  isOnline = true;
  mostrarModalOffline = false;

  mostrarModalAgregar = false;
  nuevaTareaTexto = '';
  nuevaTareaPrioridad = 'Media';
  mostrarModalEliminar = false;
  tareaAEliminarId: number | null = null;

  tareasSeleccionadas: number[] = [];
  mostrarModalCompartir = false;
  tareasPersonales: any[] = [];
  multimediaSeleccionada: MultimediaItem[] = [];

  audioGrabandoId: number | null = null;

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private tareasStorage: TareasStorageService
  ) {}

  ionViewWillEnter() {
    try {
      const datos = localStorage.getItem('usuarioActivo');
      this.usuarioActivo = datos ? JSON.parse(datos) : { nombre: 'Uriel Tejada', rol: 'UX/UI Developer' };
    } catch {
      this.usuarioActivo = { nombre: 'Usuario', rol: 'Miembro del Equipo' };
    }
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    const tareasGuardadas = await this.tareasStorage.obtenerTareas();
    if (tareasGuardadas.length > 0) this.tareasPersonales = tareasGuardadas;

    try {
      const status = await Network.getStatus();
      this.actualizarEstado(status.connected);
      Network.addListener('networkStatusChange', (s: ConnectionStatus) => this.ngZone.run(() => this.actualizarEstado(s.connected)));
    } catch {
      this.actualizarEstado(navigator.onLine);
    }

    window.addEventListener('offline', () => this.ngZone.run(() => this.actualizarEstado(false)));
    window.addEventListener('online', () => this.ngZone.run(() => this.actualizarEstado(true)));
  }

  actualizarEstado(conectado: boolean) {
    const anterior = this.isOnline;
    this.isOnline = conectado;
    if (!conectado && anterior) this.mostrarModalOffline = true;
    else if (conectado) {
      this.mostrarModalOffline = false;
      if (!anterior) this.mostrarMensaje('Se ha recuperado la conexión');
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
    setTimeout(() => this.ngZone.run(() => { this.mostrarAlertaPantalla = false; this.cdr.detectChanges(); }), 4000);
  }

  get tareasCompletadasCount() { return this.tareasPersonales.filter(t => t.completada).length; }
  get porcentajeProgreso() { return this.tareasPersonales.length === 0 ? 0 : Math.round((this.tareasCompletadasCount / this.tareasPersonales.length) * 100); }

  async actualizarProgreso() {
    await this.tareasStorage.guardarTareas(this.tareasPersonales);
    this.cdr.detectChanges();
  }

  toggleSeleccion(id: number) {
    const idx = this.tareasSeleccionadas.indexOf(id);
    if (idx > -1) this.tareasSeleccionadas.splice(idx, 1);
    else this.tareasSeleccionadas.push(id);
    this.cdr.detectChanges();
  }

  abrirModalCompartir() {
    if (this.tareasSeleccionadas.length === 0) return this.mostrarMensaje('Selecciona al menos una tarea primero');
    this.mostrarModalCompartir = true;
    this.cdr.detectChanges();
  }

  cerrarModalCompartir() { this.mostrarModalCompartir = false; this.cdr.detectChanges(); }

  async compartirPorBluetooth() {
    this.cerrarModalCompartir();
    try {
      await BleClient.initialize();
      const device = await BleClient.requestDevice();
      this.mostrarMensaje(`Dispositivo encontrado: ${device.name || 'Bluetooth'}.`);
      this.tareasSeleccionadas = [];
    } catch {
      this.mostrarMensaje('Búsqueda cancelada o error de Bluetooth.');
    }
  }

  compartirPorNFC() {
    this.cerrarModalCompartir();
    this.mostrarMensaje('La transmisión NFC necesita una implementación compatible.');
  }

  abrirModalAgregar() { this.nuevaTareaTexto = ''; this.nuevaTareaPrioridad = 'Media'; this.mostrarModalAgregar = true; }
  cancelarAgregar() { this.mostrarModalAgregar = false; }

  async confirmarAgregar() {
    if (this.nuevaTareaTexto.trim()) {
      const nombre = this.usuarioActivo?.nombre || 'Usuario';
      const avatar = nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
      this.tareasPersonales.unshift({
        id: Date.now(),
        texto: this.nuevaTareaTexto.trim(),
        completada: false,
        prioridad: this.nuevaTareaPrioridad,
        responsable: nombre,
        avatar,
        audioGuia: null
      });
      await this.tareasStorage.guardarTareas(this.tareasPersonales);
    }
    this.mostrarModalAgregar = false;
    this.cdr.detectChanges();
  }

  abrirModalEliminar(id: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.mostrarModalEliminar) return;
    this.tareaAEliminarId = id;
    this.mostrarModalEliminar = true;
    this.cdr.detectChanges();
  }

  cancelarEliminar() { this.mostrarModalEliminar = false; this.tareaAEliminarId = null; this.cdr.detectChanges(); }

  async confirmarEliminar() {
    if (this.tareaAEliminarId === null) return;
    const id = this.tareaAEliminarId;
    this.mostrarModalEliminar = false;
    this.tareaAEliminarId = null;
    this.tareasSeleccionadas = this.tareasSeleccionadas.filter(s => s !== id);
    this.tareasPersonales = this.tareasPersonales.filter(t => t.id !== id);
    await this.tareasStorage.guardarTareas(this.tareasPersonales);
    this.cdr.detectChanges();
  }

  async abrirCamara() {
    try {
      const foto = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Uri, source: CameraSource.Camera });
      if (!foto.webPath) return this.mostrarMensaje('No se pudo obtener la foto.');
      this.multimediaSeleccionada.unshift({ id: Date.now(), nombre: `Foto_${Date.now()}`, tipo: 'imagen', url: foto.webPath });
      this.mostrarMensaje('Foto capturada correctamente.');
      this.cdr.detectChanges();
    } catch {
      this.mostrarMensaje('Cámara cancelada o con errores.');
    }
  }

  abrirMultimedia() { this.selectorMultimedia?.nativeElement.click(); }

  seleccionarMultimedia(event: Event) {
    const archivos = (event.target as HTMLInputElement).files;
    if (!archivos) return;
    let count = 0;
    Array.from(archivos).forEach((archivo, i) => {
      if (archivo.type.startsWith('image/') || archivo.type.startsWith('video/')) {
        this.multimediaSeleccionada.push({
          id: Date.now() + i,
          nombre: archivo.name,
          tipo: archivo.type.startsWith('image/') ? 'imagen' : 'video',
          url: URL.createObjectURL(archivo)
        });
        count++;
      }
    });
    this.mostrarMensaje(count > 0 ? `${count} archivo(s) añadido(s).` : 'Archivos no compatibles.');
    (event.target as HTMLInputElement).value = '';
    this.cdr.detectChanges();
  }

  quitarMultimedia(id: number) {
    const item = this.multimediaSeleccionada.find(m => m.id === id);
    if (item?.url.startsWith('blob:')) URL.revokeObjectURL(item.url);
    this.multimediaSeleccionada = this.multimediaSeleccionada.filter(m => m.id !== id);
    this.cdr.detectChanges();
  }

  async guardarDatos() {
    try {
      await this.tareasStorage.guardarTareas(this.tareasPersonales);
      this.mostrarMensaje(this.isOnline ? '¡Tareas guardadas!' : 'Guardado localmente por modo offline.');
    } catch {
      this.mostrarMensaje('Error al guardar tareas.');
    }
  }

  async toggleGrabacionAudioTarea(tareaId: number) {
    if (this.audioGrabandoId === tareaId) {
      await this.detenerGrabacionAudioTarea();
    } else {
      if (this.audioGrabandoId !== null) await this.detenerGrabacionAudioTarea();
      await this.iniciarGrabacionAudioTarea(tareaId);
    }
  }

  async iniciarGrabacionAudioTarea(tareaId: number) {
    try {
      await CapacitorAudioRecorder.requestPermissions();
      await CapacitorAudioRecorder.startRecording();
      this.audioGrabandoId = tareaId;
      this.mostrarMensaje('Grabando guía de audio...');
      this.cdr.detectChanges();
    } catch {
      this.mostrarMensaje('No se pudo acceder al micrófono.');
    }
  }

  async detenerGrabacionAudioTarea() {
    try {
      const res = await CapacitorAudioRecorder.stopRecording();
      const idActual = this.audioGrabandoId;
      this.audioGrabandoId = null;

      if (res.uri && idActual !== null) {
        const archivoLeido = await Filesystem.readFile({ path: res.uri });
        const base64AudioUrl = `data:audio/aac;base64,${archivoLeido.data}`;

        const tarea = this.tareasPersonales.find(t => t.id === idActual);
        if (tarea) tarea.audioGuia = base64AudioUrl;
        
        await this.tareasStorage.guardarTareas(this.tareasPersonales);
        this.mostrarMensaje('Guía de audio guardada correctamente.');
      }
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al procesar el audio:', error);
      this.audioGrabandoId = null;
      this.mostrarMensaje('Error al guardar la grabación.');
    }
  }

  async eliminarAudioGuia(tareaId: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();
    
    const tarea = this.tareasPersonales.find(t => t.id === tareaId);
    if (tarea) {
      tarea.audioGuia = null;
      await this.tareasStorage.guardarTareas(this.tareasPersonales);
      this.mostrarMensaje('Guía de audio eliminada.');
      this.cdr.detectChanges();
    }
  }
}