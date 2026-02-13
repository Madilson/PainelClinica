
import { User, Room, PatientCall, UserRole, WaitingPatient } from './types';
import { APP_CONFIG } from './constants.tsx';

class RealTimeEmitter {
  private channel = new BroadcastChannel('medcall_realtime');
  private listeners: Record<string, Function[]> = {};

  constructor() {
    this.channel.addEventListener('message', (msg) => {
      const { event, data } = msg.data;
      if (this.listeners[event]) {
        this.listeners[event].forEach(callback => callback(data));
      }
    });
  }

  emit(event: string, data: any) {
    // Envia para outras abas
    this.channel.postMessage({ event, data });
    // Executa na aba atual
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
}

export const realTime = new RealTimeEmitter();

const initialRooms: Room[] = [
  { id: 'r1', number: '01', doctorName: 'Dr. Lucas Silva', specialty: 'Cardiologia', active: true },
  { id: 'r2', number: '02', doctorName: 'Dra. Ana Maria', specialty: 'Clínica Geral', active: true },
];

const initialUsers: User[] = [
  { id: 'u1', username: 'admin', role: UserRole.ADMIN, name: 'Administrador', active: true },
  { id: 'u2', username: 'recepcao', role: UserRole.RECEPTION, name: 'Recepção Central', active: true },
  { id: 'u3', username: 'consultorio1', role: UserRole.CLINIC, name: 'Atendimento R01', active: true, roomId: 'r1' },
];

export const getStorage = <T,>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

export const setStorage = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export const getRooms = () => getStorage<Room[]>(APP_CONFIG.STORAGE_KEYS.ROOMS, initialRooms);
export const saveRooms = (rooms: Room[]) => setStorage(APP_CONFIG.STORAGE_KEYS.ROOMS, rooms);
export const getUsers = () => getStorage<User[]>(APP_CONFIG.STORAGE_KEYS.USERS, initialUsers);
export const setUsers = (users: User[]) => setStorage(APP_CONFIG.STORAGE_KEYS.USERS, users);
export const getHistory = () => getStorage<PatientCall[]>(APP_CONFIG.STORAGE_KEYS.HISTORY, []);
export const getLatestCall = () => getStorage<PatientCall | null>(APP_CONFIG.STORAGE_KEYS.LATEST_CALL, null);

// Waiting List
export const getWaitingList = () => getStorage<WaitingPatient[]>(APP_CONFIG.STORAGE_KEYS.WAITING_LIST, []);
export const saveWaitingList = (list: WaitingPatient[]) => {
  setStorage(APP_CONFIG.STORAGE_KEYS.WAITING_LIST, list);
  realTime.emit('queue_updated', list);
};

export const addToQueue = (patient: WaitingPatient) => {
  const list = getWaitingList();
  saveWaitingList([...list, patient]);
};

export const removeFromQueue = (id: string) => {
  const list = getWaitingList();
  saveWaitingList(list.filter(p => p.id !== id));
};

export const saveCall = (call: PatientCall) => {
  const history = getHistory();
  const newHistory = [call, ...history].slice(0, 100);
  setStorage(APP_CONFIG.STORAGE_KEYS.HISTORY, newHistory);
  setStorage(APP_CONFIG.STORAGE_KEYS.LATEST_CALL, call);
  realTime.emit('new_call', call);
};
