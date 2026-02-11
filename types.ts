
export enum UserRole {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
  CLINIC = 'CLINIC'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  active: boolean;
  roomId?: string; // Only for Clinic users
}

export interface Room {
  id: string;
  number: string;
  doctorName: string;
  specialty: string;
  active: boolean;
}

export interface PatientCall {
  id: string;
  patientName: string;
  ticketNumber?: string;
  roomId: string;
  timestamp: string;
  roomName: string; // Display room number/name
  doctorName: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
}
