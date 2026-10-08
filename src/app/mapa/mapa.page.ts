import { Component, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { LoadingController } from '@ionic/angular';
import * as L from 'leaflet';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.page.html',
  styleUrls: ['./mapa.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class MapaPage {
  map: L.Map | any;
  markerPersonal: L.Marker | any; 
  marcadorRojo: L.Marker | any;   
  busqueda: string = '';

  neoIcon = L.divIcon({
    className: 'custom-neo-marker',
    html: `<div style="background: #ffdf70; width: 20px; height: 20px; border: 3px solid #1a1a1a; border-radius: 50%; box-shadow: 2px 2px 0px #1a1a1a;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  pinRojoIcon = L.divIcon({
    className: 'custom-red-pin',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 40px;">
        <div style="background: #ff6b6b; width: 24px; height: 24px; border: 3px solid #1a1a1a; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); box-shadow: 2px 2px 0px #1a1a1a; display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%; border: 2px solid #1a1a1a;"></div>
        </div>
      </div>
    `,
    iconSize: [30, 40],
    iconAnchor: [15, 40],
    popupAnchor: [0, -40]
  });

  constructor(
    private zone: NgZone,
    private loadingCtrl: LoadingController
  ) {}

  ionViewDidEnter() {
    setTimeout(() => {
      this.iniciarMapa();
    }, 100);
  }

  ionViewWillLeave() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markerPersonal = null;
      this.marcadorRojo = null;
    }
  }

  iniciarMapa() {
    this.map = L.map('mapId', {
      zoomControl: false 
    }).setView([19.4517, -70.6970], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    
    this.map.on('click', (e: any) => {
      this.colocarMarcador(e.latlng.lat, e.latlng.lng);
    });

    setTimeout(() => {
      this.centrarUbicacion();
    }, 500);
  }

  colocarMarcador(lat: number, lng: number) {
    this.zone.run(() => {
      const latRedondeada = lat.toFixed(4);
      const lngRedondeada = lng.toFixed(4);

      const popupContenido = document.createElement('div');
      popupContenido.style.cssText = 'font-family: inherit; text-align: center; padding: 6px; min-width: 140px;';
      popupContenido.innerHTML = `
        <div style="font-weight: 900; font-size: 13px; color: black; margin-bottom: 4px;">📍 Zona Seleccionada</div>
        <div style="font-size: 11px; color: #555; font-weight: 600; margin-bottom: 10px;">
          Lat: ${latRedondeada}<br>Lng: ${lngRedondeada}
        </div>
        <div style="display: flex; justify-content: center;">
          <button id="btn-compartir" style="background: #88d49e; color: black; border: 2px solid #1a1a1a; border-radius: 8px; padding: 8px 14px; font-weight: 900; font-size: 11px; cursor: pointer; box-shadow: 2px 2px 0px #1a1a1a; display: flex; align-items: center; gap: 4px;">
            <span>📤</span> Compartir
          </button>
        </div>
      `;

      popupContenido.querySelector('#btn-compartir')?.addEventListener('click', () => {
        this.compartirCoordenadasEspecificas(lat, lng);
      });

      if (this.marcadorRojo) {
        this.marcadorRojo.setLatLng([lat, lng]);
        this.marcadorRojo.getPopup().setContent(popupContenido);
      } else {
        this.marcadorRojo = L.marker([lat, lng], { icon: this.pinRojoIcon }).addTo(this.map);
        this.marcadorRojo.bindPopup(popupContenido);
        this.marcadorRojo.on('popupclose', () => {
          this.zone.run(() => {
            if (this.marcadorRojo) {
              this.marcadorRojo.remove();
              this.marcadorRojo = null;
            }
          });
        });
      }
      
      this.marcadorRojo.openPopup();
    });
  }

  ngOnInit() {}

  async compartirCoordenadasEspecificas(lat: number, lng: number) {
    try {
      await Share.share({
        title: 'Ubicación seleccionada en ProjectWizard',
        text: `📍 Mira esta ubicación en el mapa (Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}):`,
        url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
        dialogTitle: 'Compartir ubicación' 
      });
    } catch(e) {
      console.log('Compartir cancelado o con error');
    }
  }

  async centrarUbicacion() {
    const loading = await this.loadingCtrl.create({
      message: 'Buscando tu ubicación...',
      spinner: 'crescent'
    });
    await loading.present();

    try {
      if (Capacitor.isNativePlatform()) {
        const permisos = await Geolocation.requestPermissions();
        if (permisos.location !== 'granted') {
          await loading.dismiss();
          alert('Se necesita permiso de ubicación para usar el mapa.');
          return;
        }
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
      });
  
      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;
      
      this.zone.run(() => {
        this.map.setView([lat, lng], 16);

        if (this.markerPersonal) {
          this.markerPersonal.setLatLng([lat, lng]);
        } else {
          this.markerPersonal = L.marker([lat, lng], { icon: this.neoIcon }).addTo(this.map);
          this.markerPersonal.bindPopup('<div style="font-weight: 900; color: black; font-size: 12px;">Tu posición actual</div>');
        }
      });
      
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      console.error('Error obteniendo ubicación', error);
      alert('Error de GPS. Por favor, asegúrate de tener la ubicación encendida.');
    }
  }

  async buscarLugares() {
    if (this.busqueda.trim() === '') return;

    const loading = await this.loadingCtrl.create({
      message: 'Buscando...',
      spinner: 'dots'
    });
    await loading.present();

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${this.busqueda}`);
      const data = await response.json();

      this.zone.run(() => {
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);

          this.map.setView([lat, lon], 16);
          this.colocarMarcador(lat, lon);
            
        } else {
          alert('No se encontraron resultados para: ' + this.busqueda);
        }
      });
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      alert('Error al buscar el lugar.');
    }
  }

  async compartirUbicacion() {
    if (this.marcadorRojo) {
      const lat = this.marcadorRojo.getLatLng().lat;
      const lng = this.marcadorRojo.getLatLng().lng;
      this.compartirCoordenadasEspecificas(lat, lng);
    } else if (this.markerPersonal) {
      const lat = this.markerPersonal.getLatLng().lat;
      const lng = this.markerPersonal.getLatLng().lng;
      this.compartirCoordenadasEspecificas(lat, lng);
    } else {
      alert('Aún no hay ninguna ubicación detectada ni marcador en el mapa.');
    }
  }
}