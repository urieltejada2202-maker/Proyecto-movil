import { Component, CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  marker: L.Marker | any;
  busqueda: string = '';

  neoIcon = L.divIcon({
    className: 'custom-neo-marker',
    html: `<div style="background: #ffdf70; width: 20px; height: 20px; border: 3px solid #1a1a1a; border-radius: 50%; box-shadow: 2px 2px 0px #1a1a1a;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  constructor(
    private router: Router,
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
    }
  }

  iniciarMapa() {
    this.map = L.map('mapId', {
      zoomControl: false 
    }).setView([19.4517, -70.6970], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
    setTimeout(() => {
      this.centrarUbicacion();
    }, 500);
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

        if (this.marker) {
          this.marker.setLatLng([lat, lng]);
        } else {
          this.marker = L.marker([lat, lng], { icon: this.neoIcon }).addTo(this.map);
        }
      });
      
      await loading.dismiss();
    } catch (error) {
      await loading.dismiss();
      console.error('Error obteniendo ubicación', error);
      alert('Error de GPS. Por favor, baja la barra de notificaciones de tu Android y enciende la "Ubicación".');
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
          
          const searchIcon = L.divIcon({
            className: 'search-marker',
            html: `<div style="background: #ff6b6b; width: 20px; height: 20px; border: 3px solid #1a1a1a; border-radius: 50%; box-shadow: 2px 2px 0px #1a1a1a;"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          L.marker([lat, lon], { icon: searchIcon }).addTo(this.map)
            .bindPopup(`<b>${data[0].display_name.split(',')[0]}</b>`)
            .openPopup();
            
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
    if (this.marker) {
      const lat = this.marker.getLatLng().lat;
      const lng = this.marker.getLatLng().lng;
      
      try {
        await Share.share({
          title: 'Mi ubicación en ProjectWizard',
          text: '¡Hola! Estoy aquí, mira mi ubicación:',
          url: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`,
          dialogTitle: 'Compartir mi ubicación' 
        });
      } catch(e) {
        console.log('Compartir cancelado o con error');
      }
    } else {
      alert('No se puede compartir: Aún no hemos detectado tu ubicación en el mapa. Espera a que cargue el GPS.');
    }
  }

  volver() {
    this.router.navigate(['/home']);
  }
}