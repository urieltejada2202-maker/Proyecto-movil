import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class TareasStorageService {

  private storageReady: Promise<Storage>;

  constructor(private storage: Storage) {
    this.storageReady = this.init();
  }

  private async init(): Promise<Storage> {
    const storage = await this.storage.create();
    return storage;
  }

  async guardarTareas(tareas: any[]): Promise<void> {
    const storage = await this.storageReady;
    await storage.set('tareas_wizard', tareas);
  }

  async obtenerTareas(): Promise<any[]> {
    const storage = await this.storageReady;
    const tareas = await storage.get('tareas_wizard');

    return tareas || [];
  }

  async eliminarTareas(): Promise<void> {
    const storage = await this.storageReady;
    await storage.remove('tareas_wizard');
  }
}