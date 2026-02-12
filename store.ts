
import { User, Room, PatientCall, UserRole } from './types';
import { APP_CONFIG } from './constants.tsx';

// Event Emitter for "Real-time" updates between tabs (simulating Socket.io)
class RealTimeEmitter {
  private channel = new BroadcastChannel('medcall_realtime');

  emit(event: string, data: any) {
    this.channel.postMessage({ event, data });
  }

  on(event: string, callback: (data: any) => void) {
    this.channel.addEventListener('message', (msg) => {
      if (msg.data.event === event) {
        callback(msg.data.data);
      }
    });
  }
}

export const realTime = new RealTimeEmitter();

// Mock Initial Data
const initialRooms: Room[] = [
  { id: 'r1', number: '01', doctorName: 'Dr. Lucas Silva', specialty: 'Cardiologia', active: true },
  { id: 'r2', number: '02', doctorName: 'Dra. Ana Maria', specialty: 'Clínica Geral', active: true },
];

const initialUsers: User[] = [
  { id: 'u1', username: 'admin', role: UserRole.ADMIN, name: 'Administrador', active: true },
  { id: 'u2', username: 'recepcao', role: UserRole.RECEPTION, name: 'Recepção Central', active: true },
  { id: 'u3', username: 'consultorio1', role: UserRole.CLINIC, name: 'Atendimento R01', active: true, roomId: 'r1' },
];

// LocalStorage Utils
export const getStorage = <T,>(key: string, initial: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : initial;
};

export const setStorage = <T,>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Data Management
export const getRooms = () => getStorage<Room[]>(APP_CONFIG.STORAGE_KEYS.ROOMS, initialRooms);
export const getUsers = () => getStorage<User[]>(APP_CONFIG.STORAGE_KEYS.USERS, initialUsers);
export const setUsers = (users: User[]) => setStorage(APP_CONFIG.STORAGE_KEYS.USERS, users);
export const getHistory = () => getStorage<PatientCall[]>(APP_CONFIG.STORAGE_KEYS.HISTORY, []);
export const getLatestCall = () => getStorage<PatientCall | null>(APP_CONFIG.STORAGE_KEYS.LATEST_CALL, null);

export const saveCall = (call: PatientCall) => {
  const history = getHistory();
  const newHistory = [call, ...history].slice(0, 100); // Keep last 100
  setStorage(APP_CONFIG.STORAGE_KEYS.HISTORY, newHistory);
  setStorage(APP_CONFIG.STORAGE_KEYS.LATEST_CALL, call);
  realTime.emit('new_call', call);
};
