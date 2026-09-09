import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject } from 'rxjs';
import { NetworkService } from '../detector_red/codigo_detector'; 

export interface PendingOperation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload: any;
  createdAt: number;
}

const PENDING_QUEUE_KEY = 'pending_operations';
const CACHE_PREFIX = 'cache_';

@Injectable({
  providedIn: 'root'
})
export class OfflineService {

  private _storage: Storage | null = null;

  private pendingCountSubject = new BehaviorSubject<number>(0);
  pendingCount$ = this.pendingCountSubject.asObservable();

  private syncingSubject = new BehaviorSubject<boolean>(false);
  syncing$ = this.syncingSubject.asObservable();

  constructor(
    private storage: Storage,
    private networkService: NetworkService
  ) {
    this.init();
  }

  async init() {
    this._storage = await this.storage.create();
    await this.updatePendingCount();

    this.networkService.isOnline$.subscribe((online: boolean) => {
      if (online) {
        this.syncPendingOperations();
      }
    });
  }

  async guardarLocal(key: string, data: any): Promise<void> {
    await this._storage?.set(CACHE_PREFIX + key, data);
  }

  async obtenerLocal<T = any>(key: string): Promise<T | null> {
    const data = await this._storage?.get(CACHE_PREFIX + key);
    return data ?? null;
  }

  async guardarOEnviar(
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    payload: any,
    httpCall: (payload: any) => Promise<any>
  ): Promise<{ enviadoAlServidor: boolean }> {

    const estaOnline = this.networkService.isOnline;

    if (estaOnline) {
      try {
        await httpCall(payload);
        return { enviadoAlServidor: true };
      } catch (error) {
        console.warn('Fallo al enviar con conexión activa, se encola:', error);
        await this.encolarOperacion(endpoint, method, payload);
        return { enviadoAlServidor: false };
      }
    } else {
      await this.encolarOperacion(endpoint, method, payload);
      return { enviadoAlServidor: false };
    }
  }

  private async encolarOperacion(endpoint: string, method: 'POST' | 'PUT' | 'DELETE', payload: any) {
    const queue: PendingOperation[] = (await this._storage?.get(PENDING_QUEUE_KEY)) || [];

    const operacion: PendingOperation = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      endpoint,
      method,
      payload,
      createdAt: Date.now()
    };

    queue.push(operacion);
    await this._storage?.set(PENDING_QUEUE_KEY, queue);
    await this.updatePendingCount();
  }

  async obtenerPendientes(): Promise<PendingOperation[]> {
    return (await this._storage?.get(PENDING_QUEUE_KEY)) || [];
  }

  private async updatePendingCount() {
    const queue = await this.obtenerPendientes();
    this.pendingCountSubject.next(queue.length);
  }

  async syncPendingOperations(httpDispatcher?: (op: PendingOperation) => Promise<any>) {
    const queue = await this.obtenerPendientes();
    if (queue.length === 0) return;

    this.syncingSubject.next(true);

    const restantes: PendingOperation[] = [];

    for (const op of queue) {
      try {
        if (httpDispatcher) {
          await httpDispatcher(op);
        } else {
          console.log('Sincronizando operación pendiente:', op);
        }
      } catch (error) {
        console.warn('No se pudo sincronizar, se mantiene en cola:', op, error);
        restantes.push(op);
      }
    }

    await this._storage?.set(PENDING_QUEUE_KEY, restantes);
    await this.updatePendingCount();
    this.syncingSubject.next(false);
  }

  async limpiarCola() {
    await this._storage?.set(PENDING_QUEUE_KEY, []);
    await this.updatePendingCount();
  }
}