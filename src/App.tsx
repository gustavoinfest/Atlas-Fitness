import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MODALITIES, 
  INITIAL_SCHEDULES 
} from './data/initialData';
import { INITIAL_CLIENTS } from './data/initialClients';
import { 
  Modality, 
  StudentClassSchedule, 
  ViewMode, 
  GoogleSheetsConfig, 
  DayOfWeek, 
  StudentStatus, 
  AttendanceStatus,
  ClientRecord 
} from './types';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { WeeklyScheduleView } from './components/WeeklyScheduleView';
import { ModalityTabsManager } from './components/ModalityTabsManager';
import { StudentsListView } from './components/StudentsListView';
import { AttendanceManager } from './components/AttendanceManager';
import { ConflictChecker } from './components/ConflictChecker';
import { StudentModal } from './components/StudentModal';
import { ModalityModal } from './components/ModalityModal';
import { GoogleSheetsSyncModal } from './components/GoogleSheetsSyncModal';
import { UniversalImportModal } from './components/UniversalImportModal';

const LOCAL_STORAGE_MODALITIES_KEY = 'agenda_gluteo_zone_modalities_v1';
const LOCAL_STORAGE_SCHEDULES_KEY = 'agenda_gluteo_zone_schedules_v1';
const LOCAL_STORAGE_GOOGLE_KEY = 'agenda_gluteo_zone_google_v1';
const LOCAL_STORAGE_CLIENTS_KEY = 'agenda_gluteo_zone_clients_v1';

export default function App() {
  // 1. Modalities State (Tabs)
  const [modalities, setModalities] = useState<Modality[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MODALITIES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved modalities', e);
      }
    }
    return INITIAL_MODALITIES;
  });

  // 2. Schedules State (Students with assigned slots)
  const [schedules, setSchedules] = useState<StudentClassSchedule[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SCHEDULES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved schedules', e);
      }
    }
    return INITIAL_SCHEDULES;
  });

  // 3. General Clients Database (340+ clients list with status, professor, consultor, personal)
  const [clients, setClients] = useState<ClientRecord[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_CLIENTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to load saved clients', e);
      }
    }
    return INITIAL_CLIENTS;
  });

  // 4. Google Sheets Config State
  const [googleConfig, setGoogleConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_GOOGLE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load saved google config', e);
      }
    }
    return {
      spreadsheetId: '',
      spreadsheetTitle: 'Planilha GLÚTEO ZONE - Aulas e Alunas',
      spreadsheetUrl: '',
      isConnected: false,
      lastSyncTime: null,
      tabs: INITIAL_MODALITIES.map((m) => m.sheetTabName),
    };
  });

  // 5. Navigation & Views
  const [currentView, setCurrentView] = useState<ViewMode>('agenda');

  // 6. Modals State
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StudentClassSchedule | null>(null);
  const [studentModalDefaults, setStudentModalDefaults] = useState<{
    modalityId?: string;
    day?: DayOfWeek;
    time?: string;
  }>({});

  const [isModalityModalOpen, setIsModalityModalOpen] = useState(false);
  const [editingModality, setEditingModality] = useState<Modality | null>(null);

  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MODALITIES_KEY, JSON.stringify(modalities));
  }, [modalities]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
  }, [schedules]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_GOOGLE_KEY, JSON.stringify(googleConfig));
  }, [googleConfig]);

  // Calculate conflict count for badge
  const calculateConflictCount = (): number => {
    let count = 0;
    const days: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

    days.forEach((day) => {
      modalities.forEach((mod) => {
        const modSchedules = schedules.filter(
          (s) => s.status === 'ativo' && (s.modalityId === mod.id || s.modalityName.toLowerCase() === mod.sheetTabName.toLowerCase()) && s.daysOfWeek.includes(day)
        );
        const grouped: Record<string, number> = {};
        modSchedules.forEach((s) => {
          const key = `${s.startTime}-${s.endTime}`;
          grouped[key] = (grouped[key] || 0) + 1;
        });
        const maxLimit = mod.maxStudentsPerSlot || 2;
        Object.values(grouped).forEach((qty) => {
          if (qty > maxLimit) count++;
        });
      });
    });

    return count;
  };

  // Student schedule handlers
  const handleSaveStudent = (
    scheduleData: Omit<StudentClassSchedule, 'id' | 'attendanceHistory'>,
    existingId?: string
  ) => {
    if (existingId) {
      setSchedules((prev) =>
        prev.map((s) =>
          s.id === existingId
            ? { ...s, ...scheduleData }
            : s
        )
      );
    } else {
      const newSchedule: StudentClassSchedule = {
        ...scheduleData,
        id: `sched-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        attendanceHistory: [],
      };
      setSchedules((prev) => [newSchedule, ...prev]);
    }
  };

  const handleDeleteStudent = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
  };

  const handleUpdateStudentStatus = (scheduleId: string, newStatus: StudentStatus) => {
    setSchedules((prev) =>
      prev.map((s) => (s.id === scheduleId ? { ...s, status: newStatus } : s))
    );
  };

  // Client database handlers
  const handleImportClients = (newClients: ClientRecord[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setClients(newClients);
    } else {
      setClients((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const added = newClients.filter((c) => !existingIds.has(c.id));
        const updated = prev.map((c) => {
          const matchingNew = newClients.find((n) => n.id === c.id);
          return matchingNew ? { ...c, ...matchingNew } : c;
        });
        return [...updated, ...added];
      });
    }
  };

  const handleImportSchedules = (
    newModalities: Modality[],
    newSchedules: StudentClassSchedule[],
    mode: 'merge' | 'replace'
  ) => {
    if (mode === 'replace') {
      if (newModalities.length > 0) setModalities(newModalities);
      setSchedules(newSchedules);
    } else {
      if (newModalities.length > 0) {
        setModalities((prev) => {
          const prevNames = new Set(prev.map((m) => m.sheetTabName.toLowerCase()));
          const extra = newModalities.filter((m) => !prevNames.has(m.sheetTabName.toLowerCase()));
          return [...prev, ...extra];
        });
      }
      setSchedules((prev) => [...prev, ...newSchedules]);
    }
  };

  const handleUpdateClientStatus = (clientId: string, newStatus: string) => {
    setClients((prev) =>
      prev.map((c) => (c.id === clientId ? { ...c, status: newStatus as any } : c))
    );
  };

  const handleDeleteClient = (clientId: string) => {
    setClients((prev) => prev.filter((c) => c.id !== clientId));
  };

  const handleScheduleClient = (client: ClientRecord) => {
    setEditingSchedule(null);
    setStudentModalDefaults({
      modalityId: modalities[0]?.id,
      day: 'Segunda',
      time: '08:00',
    });
    // Create prefilled schedule instance
    setEditingSchedule({
      id: '',
      studentName: client.name,
      modalityId: modalities[0]?.id || '',
      modalityName: modalities[0]?.sheetTabName || 'Geral',
      daysOfWeek: ['Segunda', 'Quarta'],
      startTime: '08:00',
      endTime: '08:50',
      durationMinutes: 50,
      phone: client.phone || '',
      email: client.email || '',
      status: client.status.toLowerCase().includes('inativ') ? 'trancado' : 'ativo',
      plan: 'Mensal (2x/sem)',
      notes: `Matrícula: #${client.id}${client.professor ? ` • Prof: ${client.professor}` : ''}${client.consultor ? ` • Consultor: ${client.consultor}` : ''}`,
      attendanceHistory: [],
    });
    setIsStudentModalOpen(true);
  };

  // Modality handlers
  const handleSaveModality = (modalityData: Omit<Modality, 'id'>, existingId?: string) => {
    if (existingId) {
      setModalities((prev) =>
        prev.map((m) =>
          m.id === existingId ? { ...m, ...modalityData } : m
        )
      );
      setSchedules((prev) =>
        prev.map((s) =>
          s.modalityId === existingId
            ? { ...s, modalityName: modalityData.sheetTabName }
            : s
        )
      );
    } else {
      const newId = `mod-${modalityData.sheetTabName.toLowerCase().replace(/[^a-z0-9]/g, '-') || Date.now()}`;
      const newModality: Modality = {
        ...modalityData,
        id: newId,
      };
      setModalities((prev) => [...prev, newModality]);
    }
  };

  const handleDeleteModality = (modalityId: string) => {
    setModalities((prev) => prev.filter((m) => m.id !== modalityId));
    setSchedules((prev) => prev.filter((s) => s.modalityId !== modalityId));
  };

  // Attendance handler
  const handleRecordAttendance = (
    scheduleId: string,
    date: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.id !== scheduleId) return s;

        const existingAttIdx = s.attendanceHistory.findIndex((a) => a.date === date);
        let newHistory = [...s.attendanceHistory];

        if (existingAttIdx >= 0) {
          newHistory[existingAttIdx] = {
            ...newHistory[existingAttIdx],
            status,
            notes: notes || newHistory[existingAttIdx].notes,
          };
        } else {
          newHistory.push({
            id: `att-${Date.now()}`,
            date,
            status,
            notes,
          });
        }

        return {
          ...s,
          attendanceHistory: newHistory,
        };
      })
    );
  };

  const openNewStudentModal = (modalityId?: string, day?: DayOfWeek, time?: string) => {
    setEditingSchedule(null);
    setStudentModalDefaults({ modalityId, day, time });
    setIsStudentModalOpen(true);
  };

  const openEditStudentModal = (schedule: StudentClassSchedule) => {
    setEditingSchedule(schedule);
    setStudentModalDefaults({});
    setIsStudentModalOpen(true);
  };

  const openNewModalityModal = () => {
    setEditingModality(null);
    setIsModalityModalOpen(true);
  };

  const openEditModalityModal = (modality: Modality) => {
    setEditingModality(modality);
    setIsModalityModalOpen(true);
  };

  const conflictCount = calculateConflictCount();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-300 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Header */}
      <Header
        modalities={modalities}
        schedules={schedules}
        googleConfig={googleConfig}
        onOpenGoogleSync={() => setIsGoogleSyncModalOpen(true)}
        onOpenNewStudentModal={() => openNewStudentModal()}
        onOpenNewModalityModal={openNewModalityModal}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onImportData={(mods, scheds) => handleImportSchedules(mods, scheds, 'replace')}
      />

      {/* Navigation Sub-Header */}
      <NavigationTabs
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'sheets_sync') {
            setIsGoogleSyncModalOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        conflictCount={conflictCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'agenda' && (
          <WeeklyScheduleView
            modalities={modalities}
            schedules={schedules}
            onEditSchedule={openEditStudentModal}
            onAddNewForSlot={(day, time) => openNewStudentModal(undefined, day, time)}
          />
        )}

        {currentView === 'tabs' && (
          <ModalityTabsManager
            modalities={modalities}
            schedules={schedules}
            onAddModality={openNewModalityModal}
            onEditModality={openEditModalityModal}
            onDeleteModality={handleDeleteModality}
            onAddNewStudent={(modId) => openNewStudentModal(modId)}
            onEditStudent={openEditStudentModal}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStudentStatus={handleUpdateStudentStatus}
          />
        )}

        {currentView === 'students' && (
          <StudentsListView
            modalities={modalities}
            schedules={schedules}
            clients={clients}
            onAddNewStudent={() => openNewStudentModal()}
            onScheduleClient={handleScheduleClient}
            onEditStudent={openEditStudentModal}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStatus={handleUpdateStudentStatus}
            onOpenImportModal={() => setIsImportModalOpen(true)}
            onUpdateClientStatus={handleUpdateClientStatus}
            onDeleteClient={handleDeleteClient}
          />
        )}

        {currentView === 'attendance' && (
          <AttendanceManager
            modalities={modalities}
            schedules={schedules}
            onRecordAttendance={handleRecordAttendance}
          />
        )}

        {currentView === 'conflicts' && (
          <ConflictChecker
            modalities={modalities}
            schedules={schedules}
            onResolveConflict={openEditStudentModal}
          />
        )}
      </main>

      {/* Modals */}
      <StudentModal
        isOpen={isStudentModalOpen}
        onClose={() => {
          setIsStudentModalOpen(false);
          setEditingSchedule(null);
        }}
        onSave={handleSaveStudent}
        modalities={modalities}
        clients={clients}
        initialSchedule={editingSchedule}
        defaultModalityId={studentModalDefaults.modalityId}
        defaultDay={studentModalDefaults.day}
        defaultTime={studentModalDefaults.time}
      />

      <ModalityModal
        isOpen={isModalityModalOpen}
        onClose={() => {
          setIsModalityModalOpen(false);
          setEditingModality(null);
        }}
        onSave={handleSaveModality}
        onDelete={handleDeleteModality}
        initialModality={editingModality}
      />

      <GoogleSheetsSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        modalities={modalities}
        schedules={schedules}
        googleConfig={googleConfig}
        onUpdateGoogleConfig={setGoogleConfig}
        onImportData={(mods, scheds) => handleImportSchedules(mods, scheds, 'replace')}
      />

      <UniversalImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportClients={handleImportClients}
        onImportSchedules={handleImportSchedules}
      />
    </div>
  );
}
