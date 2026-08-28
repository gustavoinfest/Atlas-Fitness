export type DayOfWeek = 'Segunda' | 'Terça' | 'Quarta' | 'Quinta' | 'Sexta' | 'Sábado' | 'Domingo';

export type StudentStatus = 'ativo' | 'pendente' | 'ferias' | 'trancado';

export type ClientStatus = 'Ativo' | 'Inativo' | 'Bloqueado' | 'Suspenso' | 'Pendente' | 'Trancado' | 'Férias';

export interface ClientRecord {
  id: string; // e.g. "13810" or generated uuid
  name: string;
  professor?: string;
  consultor?: string;
  personal?: string;
  status: string; // "Ativo", "Inativo", "Bloqueado", "Suspenso", etc.
  sisterName?: string;
  motherName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  registrationDate?: string;
}

export type AttendanceStatus = 'presente' | 'falta' | 'justificada' | 'reposicao';

export interface AttendanceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  notes?: string;
}

export interface StudentClassSchedule {
  id: string;
  modalityId: string;
  modalityName: string;
  studentName: string;
  phone: string;
  email?: string;
  daysOfWeek: DayOfWeek[];
  startTime: string; // "08:00"
  endTime: string; // "09:00"
  durationMinutes: number;
  status: StudentStatus;
  plan: string; // "Mensal (2x/sem)", "Trimestral", "Pacote 10 aulas", etc.
  startDate: string; // YYYY-MM-DD
  notes?: string;
  roomOrLocation?: string;
  monthlyFee?: number;
  attendanceHistory: AttendanceRecord[];
}

export interface Modality {
  id: string;
  name: string; // e.g. "Pilates", "Musculação", "Natação", "Funcional", "Yoga", "Personal"
  sheetTabName: string; // Exact title of the Google Sheets tab
  color: string; // Hex or Tailwind color token
  iconName: string; // Lucide icon identifier
  description?: string;
  defaultDurationMinutes: number;
  instructorName?: string;
  maxStudentsPerSlot?: number;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  spreadsheetTitle: string;
  spreadsheetUrl: string;
  isConnected: boolean;
  lastSyncTime: string | null;
  tabs: string[];
}

export interface ScheduleConflict {
  day: DayOfWeek;
  timeSlot: string;
  schedules: StudentClassSchedule[];
}

export type ViewMode = 'agenda' | 'tabs' | 'students' | 'attendance' | 'conflicts' | 'sheets_sync';
