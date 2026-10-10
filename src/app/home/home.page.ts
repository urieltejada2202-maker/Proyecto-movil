import { Component, OnInit, OnDestroy, NgZone, ChangeDetectorRef } from '@angular/core';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { TareasStorageService } from '../tareas/tareas-storage.service';

@Component({
  selector: 'app-home', 
  templateUrl: './home.page.html', 
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  isOnline: boolean = true;
  mostrarModalOffline = false;
  mostrarAlertaPantalla = false;
  mensajeNotificacion = '';
  tipoAlerta: 'success' | 'warning' = 'success';
  private timeoutAlerta: any;
  
  nombreProyecto: string = 'App móvil v1.0'; 
  tempNombreProyecto: string = '';
  progresoGlobal: number = 0;
  
  miembrosEquipo: any[] = [];
  equipoProgreso: any[] = [];

  mostrarModalProyecto = false;
  mostrarModalAgregar = false;
  mostrarModalRoles = false;
  mostrarModalConfirmarEliminar = false;
  miembroAEliminar = '';

  nuevoMiembroNombre = '';
  nuevoMiembroRol = '';

  private onlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(true));
  private offlineListenerHandler = () => this.ngZone.run(() => this.actualizarEstado(false));

  confirmarEliminarMiembro(nombre: string) {
    this.miembroAEliminar = nombre;
    this.mostrarModalConfirmarEliminar = true;
  }

  ejecutarEliminarMiembro() {
    if (this.miembroAEliminar) {
      this.miembrosEquipo = this.miembrosEquipo.filter(m => m.nombre !== this.miembroAEliminar);
      this.guardarEquipoOficial();
      this.calcularDesempeno();
      this.mostrarMensaje(`Miembro ${this.miembroAEliminar} eliminado`, 'warning');
    }
    this.mostrarModalConfirmarEliminar = false;
    this.miembroAEliminar = '';
  }

  constructor(
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private tareasStorage: TareasStorageService,
    private router: Router,
    private loadingCtrl: LoadingController
  ) {}

  async ionViewWillEnter() {
    const proyectoGuardado = localStorage.getItem('nombreProyecto');
    if (proyectoGuardado) this.nombreProyecto = proyectoGuardado;

    this.cargarEquipoOficial();
    await this.calcularDesempeno();
  }

  async cerrarSesion() {
    const loading = await this.loadingCtrl.create({
      message: 'Cerrando sesión de forma segura...',
      spinner: 'dots',
      duration: 1500
    });
    
    await loading.present();

    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 1500);
  }

  cargarEquipoOficial() {
    const equipoGuardado = localStorage.getItem('equipoProyecto');
    if (equipoGuardado) {
      this.miembrosEquipo = JSON.parse(equipoGuardado);
    } else {
      const activo = localStorage.getItem('usuarioActivo');
      const defaultName = activo ? JSON.parse(activo).nombre : 'Uriel Tejada';
      const defaultRol = activo ? JSON.parse(activo).rol : 'UX/UI Developer';
      
      this.miembrosEquipo = [{ nombre: defaultName, rol: defaultRol }];
      this.guardarEquipoOficial();
    }
  }

  guardarEquipoOficial() {
    localStorage.setItem('equipoProyecto', JSON.stringify(this.miembrosEquipo));
  }

  guardarNuevoMiembro() {
    if (this.nuevoMiembroNombre.trim() !== '') {
      this.miembrosEquipo.push({
        nombre: this.nuevoMiembroNombre.trim(),
        rol: this.nuevoMiembroRol.trim() || 'Miembro del Equipo'
      });
      this.guardarEquipoOficial();
      this.calcularDesempeno(); 
    }
    
    this.nuevoMiembroNombre = '';
    this.nuevoMiembroRol = '';
    this.mostrarModalAgregar = false;
  }

  guardarRoles() {
    this.guardarEquipoOficial();
    this.calcularDesempeno();
    const activoString = localStorage.getItem('usuarioActivo');
    if (activoString) {
      const usuarioActivo = JSON.parse(activoString);
      const miembroActual = this.miembrosEquipo.find(m => m.nombre === usuarioActivo.nombre);
      
      if (miembroActual) {
        usuarioActivo.rol = miembroActual.rol;
        localStorage.setItem('usuarioActivo', JSON.stringify(usuarioActivo));
      }
    }

    this.mostrarModalRoles = false;
  }

  async calcularDesempeno() {
    const tareas = await this.tareasStorage.obtenerTareas();
    const agrupacion: any = {};
    this.miembrosEquipo.forEach(m => {
      agrupacion[m.nombre] = { total: 0, completadas: 0, rol: m.rol };
    });

    let totalTareas = 0;
    let tareasCompletadas = 0;

    if (tareas && tareas.length > 0) {
      totalTareas = tareas.length;
      tareas.forEach((t: any) => {
        if (t.estado === 'hecho' || t.completada) {
          tareasCompletadas += 1;
        }

        const responsable = t.responsable || 'Sin Asignar';
        
        if (!agrupacion[responsable]) {
          agrupacion[responsable] = { total: 0, completadas: 0, rol: 'Invitado' };
          this.miembrosEquipo.push({ nombre: responsable, rol: 'Invitado' });
          this.guardarEquipoOficial();
        }
        
        agrupacion[responsable].total += 1;
        if (t.estado === 'hecho' || t.completada) {
          agrupacion[responsable].completadas += 1;
        }
      });
    }

    this.progresoGlobal = totalTareas === 0 ? 0 : Math.round((tareasCompletadas / totalTareas) * 100);

    this.equipoProgreso = Object.keys(agrupacion).map(nombre => {
      const datos = agrupacion[nombre];
      const porcentaje = datos.total === 0 ? 0 : Math.round((datos.completadas / datos.total) * 100);
      const iniciales = nombre.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

      return {
        nombre: nombre,
        rol: datos.rol,
        avatar: iniciales,
        completadas: datos.completadas,
        total: datos.total,
        progreso: porcentaje
      };
    });

    this.equipoProgreso.sort((a, b) => b.progreso - a.progreso);
    this.cdr.detectChanges();
  }

  abrirModalProyecto() {
    this.tempNombreProyecto = this.nombreProyecto;
    this.mostrarModalProyecto = true;
  }

  guardarNombreProyecto() {
    if (this.tempNombreProyecto.trim() !== '') {
      this.nombreProyecto = this.tempNombreProyecto.trim();
      localStorage.setItem('nombreProyecto', this.nombreProyecto);
    }
    this.mostrarModalProyecto = false;
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
        this.mostrarMensaje('Se ha recuperado la conexión', 'success');
      }
    }

    this.cdr.detectChanges();
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'warning' = 'success') {
    if (this.timeoutAlerta) {
      clearTimeout(this.timeoutAlerta);
    }

    this.mensajeNotificacion = texto;
    this.tipoAlerta = tipo;
    this.mostrarAlertaPantalla = true;
    this.cdr.detectChanges();
    this.timeoutAlerta = setTimeout(() => {
      this.ngZone.run(() => {
        this.mostrarAlertaPantalla = false;
        this.cdr.detectChanges();
      });
    }, 4000);
  }
}