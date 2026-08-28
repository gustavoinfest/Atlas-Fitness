import React, { useState, useEffect } from 'react';
import { 
  INITIAL_MODALITIES, 
  INITIAL_SCHEDULES 
} from './data/initialData';
import { 
  Modality, 
  StudentClassSchedule, 
  ViewMode, 
  GoogleSheetsConfig, 
  DayOfWeek, 
  StudentStatus, 
  AttendanceStatus 
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

const LOCAL_STORAGE_MODALITIES_KEY = 'agenda_gluteo_zone_modalities_v1';
const LOCAL_STORAGE_SCHEDULES_KEY = 'agenda_gluteo_zone_schedules_v1';
const LOCAL_STORAGE_GOOGLE_KEY = 'agenda_gluteo_zone_google_v1';

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

  // 2. Schedules State (Students)
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

  // 3. Google Sheets Config State
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

  // 4. Navigation & Views
  const [currentView, setCurrentView] = useState<ViewMode>('agenda');

  // 5. Modals State
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

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MODALITIES_KEY, JSON.stringify(modalities));
  }, [modalities]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SCHEDULES_KEY, JSON.stringify(schedules));
  }, [schedules]);

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

  // Modality handlers
  const handleSaveModality = (modalityData: Omit<Modality, 'id'>, existingId?: string) => {
    if (existingId) {
      setModalities((prev) =>
        prev.map((m) =>
          m.id === existingId ? { ...m, ...modalityData } : m
        )
      );
      // Also update schedules referencing this modality
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
    // Set schedules under this modality to general or keep them
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

  // Import Handler from Excel or Google Sheets
  const handleImportData = (newModalities: Modality[], newSchedules: StudentClassSchedule[]) => {
    setModalities(newModalities);
    setSchedules(newSchedules);
    alert(`Sucesso! Foram importadas ${newModalities.length} abas de modalidades e ${newSchedules.length} matrículas.`);
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
        onImportData={handleImportData}
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
            onAddNewStudent={() => openNewStudentModal()}
            onEditStudent={openEditStudentModal}
            onDeleteStudent={handleDeleteStudent}
            onUpdateStatus={handleUpdateStudentStatus}
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
        onImportData={handleImportData}
      />
    </div>
  );
}
