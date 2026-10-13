
import {
  Component,
  OnInit,
  NgZone,
  CUSTOM_ELEMENTS_SCHEMA,
  ChangeDetectorRef,
  ElementRef,
  ViewChild
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Network, ConnectionStatus } from '@capacitor/network';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { CapacitorAudioRecorder } from '@capgo/capacitor-audio-recorder';
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
  @ViewChild('selectorMultimedia')
  selectorMultimedia!: ElementRef<HTMLInputElement>;

  grabandoAudio: boolean = false;
audiosGrabados: { id: number; nombre: string; url: string; duracion?: number }[] = [];

  usuarioActivo: any = null;
  mostrarAlertaPantalla = false;
  tipoNotificacion = 'success';
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

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private tareasStorage: TareasStorageService
  ) {}

  ionViewWillEnter() {
    const datos = localStorage.getItem('usuarioActivo');

    if (datos) {
      try {
        this.usuarioActivo = JSON.parse(datos);
      } catch {
        this.usuarioActivo = {
          nombre: 'Usuario',
          rol: 'Miembro del Equipo'
        };
      }
    } else {
      this.usuarioActivo = {
        nombre: 'Uriel Tejada',
        rol: 'UX/UI Developer'
      };
    }

    this.cdr.detectChanges();
  }

  async ngOnInit() {
    const tareasGuardadas = await this.tareasStorage.obtenerTareas();

    if (tareasGuardadas.length > 0) {
      this.tareasPersonales = tareasGuardadas;
    }

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
      this.ngZone.run(() => this.actualizarEstado(false));
    });

    window.addEventListener('online', () => {
      this.ngZone.run(() => this.actualizarEstado(true));
    });
  }

  actualizarEstado(conectado: boolean) {
    const estadoAnterior = this.isOnline;
    this.isOnline = conectado;

    if (!conectado && estadoAnterior) {
      this.mostrarModalOffline = true;
    } else if (conectado) {
      this.mostrarModalOffline = false;

      if (!estadoAnterior) {
        this.mostrarMensaje('Se ha recuperado la conexión');
      }
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

    setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarAlertaPantalla = false;
        this.cdr.detectChanges();
      });
    }, 4000);
  }

  get tareasCompletadasCount() {
    return this.tareasPersonales.filter(t => t.completada).length;
  }

  get porcentajeProgreso() {
    if (this.tareasPersonales.length === 0) {
      return 0;
    }

    return Math.round(
      (this.tareasCompletadasCount / this.tareasPersonales.length) * 100
    );
  }

  async actualizarProgreso() {
    await this.tareasStorage.guardarTareas(this.tareasPersonales);
    this.cdr.detectChanges();
  }

  toggleSeleccion(id: number) {
    const index = this.tareasSeleccionadas.indexOf(id);

    if (index > -1) {
      this.tareasSeleccionadas.splice(index, 1);
    } else {
      this.tareasSeleccionadas.push(id);
    }

    this.cdr.detectChanges();
  }

  abrirModalCompartir() {
    if (this.tareasSeleccionadas.length === 0) {
      this.mostrarMensaje(
        'Selecciona al menos una tarea de la lista primero'
      );
      return;
    }

    this.mostrarModalCompartir = true;
    this.cdr.detectChanges();
  }

  cerrarModalCompartir() {
    this.mostrarModalCompartir = false;
    this.cdr.detectChanges();
  }

  async compartirPorBluetooth() {
    this.cerrarModalCompartir();

    try {
      await BleClient.initialize();

      const device = await BleClient.requestDevice();

      console.log('Se conectó a:', device);

      this.mostrarMensaje(
        `Dispositivo encontrado: ${device.name || 'Dispositivo Bluetooth'}.`
      );

      this.tareasSeleccionadas = [];
    } catch (error) {
      console.error('Error al iniciar Bluetooth', error);

      this.mostrarMensaje(
        'Búsqueda cancelada o error de Bluetooth.'
      );
    }
  }

  compartirPorNFC() {
    this.cerrarModalCompartir();

    this.mostrarMensaje(
      'La transmisión NFC necesita una implementación compatible para enviar las tareas.'
    );

    // No se vacía la selección porque aquí todavía no se transmiten datos.
  }

  abrirModalAgregar() {
    this.nuevaTareaTexto = '';
    this.nuevaTareaPrioridad = 'Media';
    this.mostrarModalAgregar = true;
  }

  cancelarAgregar() {
    this.mostrarModalAgregar = false;
  }

  async confirmarAgregar() {
    if (this.nuevaTareaTexto.trim() !== '') {
      const nombreLogueado =
        this.usuarioActivo?.nombre || 'Usuario Desconocido';

      const iniciales = nombreLogueado
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();

      this.tareasPersonales.unshift({
        id: Date.now(),
        texto: this.nuevaTareaTexto.trim(),
        completada: false,
        estado: 'porHacer',
        prioridad: this.nuevaTareaPrioridad,
        responsable: nombreLogueado,
        avatar: iniciales
      });

      await this.tareasStorage.guardarTareas(this.tareasPersonales);
    }

    this.mostrarModalAgregar = false;
    this.cdr.detectChanges();
  }

  abrirModalEliminar(id: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (this.mostrarModalEliminar) {
      return;
    }

    this.tareaAEliminarId = id;
    this.mostrarModalEliminar = true;
    this.cdr.detectChanges();
  }

  cancelarEliminar() {
    this.mostrarModalEliminar = false;
    this.tareaAEliminarId = null;
    this.cdr.detectChanges();
  }

  async confirmarEliminar() {
    if (this.tareaAEliminarId === null) {
      return;
    }

    const id = this.tareaAEliminarId;

    this.mostrarModalEliminar = false;
    this.tareaAEliminarId = null;

    this.tareasSeleccionadas =
      this.tareasSeleccionadas.filter(selId => selId !== id);

    this.tareasPersonales =
      this.tareasPersonales.filter(tarea => tarea.id !== id);

    await this.tareasStorage.guardarTareas(this.tareasPersonales);

    this.cdr.detectChanges();
  }

  // Abre la cámara del dispositivo para tomar una foto.
  async abrirCamara() {
    try {
      const foto = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      if (!foto.webPath) {
        this.mostrarMensaje('No se pudo obtener la foto.');
        return;
      }

      this.multimediaSeleccionada.unshift({
        id: Date.now(),
        nombre: `Foto_${new Date().toLocaleString()}`,
        tipo: 'imagen',
        url: foto.webPath
      });

      this.mostrarMensaje('Foto capturada correctamente.');
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error al abrir la cámara:', error);
      this.mostrarMensaje(
        'No se tomó ninguna foto o no se pudo abrir la cámara.'
      );
    }
  }

  // Abre el selector de archivos para elegir fotos y videos.
  abrirMultimedia() {
    this.selectorMultimedia?.nativeElement.click();
  }

  seleccionarMultimedia(event: Event) {
    const input = event.target as HTMLInputElement;
    const archivos = input.files;

    if (!archivos || archivos.length === 0) {
      return;
    }

    let agregados = 0;

    for (const archivo of Array.from(archivos)) {
      const esImagen = archivo.type.startsWith('image/');
      const esVideo = archivo.type.startsWith('video/');

      if (!esImagen && !esVideo) {
        continue;
      }

      const url = URL.createObjectURL(archivo);

      this.multimediaSeleccionada.push({
        id: Date.now() + agregados,
        nombre: archivo.name,
        tipo: esImagen ? 'imagen' : 'video',
        url
      });

      agregados++;
    }

    if (agregados > 0) {
      this.mostrarMensaje(
        `${agregados} archivo(s) multimedia seleccionado(s).`
      );
    } else {
      this.mostrarMensaje(
        'No se seleccionaron fotos o videos compatibles.'
      );
    }

    // Permite volver a elegir el mismo archivo.
    input.value = '';
    this.cdr.detectChanges();
  }

  quitarMultimedia(id: number) {
    const elemento = this.multimediaSeleccionada.find(item => item.id === id);

    if (elemento && elemento.url.startsWith('blob:')) {
      URL.revokeObjectURL(elemento.url);
    }

    this.multimediaSeleccionada =
      this.multimediaSeleccionada.filter(item => item.id !== id);

    this.cdr.detectChanges();
  }

  async guardarDatos() {
    try {
      await this.tareasStorage.guardarTareas(this.tareasPersonales);

      if (this.isOnline) {
        this.mostrarMensaje('¡Tareas guardadas correctamente!');
      } else {
        this.mostrarMensaje(
          'Las tareas se guardaron localmente. Se conservarán aunque no haya conexión.'
        );
      }
    } catch (error) {
      console.error('Error al guardar las tareas:', error);
      this.mostrarMensaje('Error. No se pudieron guardar las tareas.');
    }
  }
    async iniciarGrabacionAudio() {
    try {
      await CapacitorAudioRecorder.requestPermissions();
      await CapacitorAudioRecorder.startRecording();

      this.grabandoAudio = true;
      this.mostrarMensaje('Grabación de audio iniciada.');
    } catch (error) {
      console.error('Error al iniciar la grabación:', error);
      this.mostrarMensaje('No se pudo iniciar la grabación.');
    }
  }

  async detenerGrabacionAudio() {
    try {
      const resultado = await CapacitorAudioRecorder.stopRecording();

      this.grabandoAudio = false;

      if (resultado.uri) {
        this.audiosGrabados.unshift({
          id: Date.now(),
          nombre: 'Nota de audio',
          url: resultado.uri,
          duracion: resultado.duration
        });

        this.mostrarMensaje('Grabación finalizada.');
      } else {
        this.mostrarMensaje('No se encontró el archivo de audio.');
      }
    } catch (error) {
      this.grabandoAudio = false;
      console.error('Error al detener la grabación:', error);
      this.mostrarMensaje('No se pudo detener la grabación.');
    }
  }
}
