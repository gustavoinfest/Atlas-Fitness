import React, { useState } from 'react';
import { 
  Modality, 
  StudentClassSchedule, 
  StudentStatus 
} from '../types';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  MessageCircle, 
  User, 
  Calendar, 
  Clock, 
  DollarSign, 
  Settings, 
  Sparkles, 
  Layers,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ModalityTabsManagerProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  onAddModality: () => void;
  onEditModality: (modality: Modality) => void;
  onDeleteModality: (modalityId: string) => void;
  onAddNewStudent: (modalityId: string) => void;
  onEditStudent: (schedule: StudentClassSchedule) => void;
  onDeleteStudent: (scheduleId: string) => void;
  onUpdateStudentStatus: (scheduleId: string, newStatus: StudentStatus) => void;
}

export const ModalityTabsManager: React.FC<ModalityTabsManagerProps> = ({
  modalities,
  schedules,
  onAddModality,
  onEditModality,
  onDeleteModality,
  onAddNewStudent,
  onEditStudent,
  onDeleteStudent,
  onUpdateStudentStatus,
}) => {
  const [activeTabId, setActiveTabId] = useState<string>(
    modalities.length > 0 ? modalities[0].id : ''
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const currentModality = modalities.find((m) => m.id === activeTabId) || modalities[0];

  // Filter students for active modality tab
  const tabSchedules = schedules.filter((s) => {
    if (!currentModality) return false;
    const matchesModality = s.modalityId === currentModality.id || s.modalityName.toLowerCase() === currentModality.sheetTabName.toLowerCase();
    if (!matchesModality) return false;

    if (statusFilter !== 'all' && s.status !== statusFilter) return false;

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(term);
      const matchPhone = s.phone.includes(term);
      const matchDays = s.daysOfWeek.some((d) => d.toLowerCase().includes(term));
      const matchNotes = s.notes?.toLowerCase().includes(term);
      return matchName || matchPhone || matchDays || matchNotes;
    }

    return true;
  });

  // Calculate statistics for active modality tab
  const activeCount = tabSchedules.filter((s) => s.status === 'ativo').length;
  const totalWeeklyClasses = tabSchedules.reduce(
    (acc, curr) => acc + (curr.status === 'ativo' ? curr.daysOfWeek.length : 0),
    0
  );
  const totalRevenue = tabSchedules.reduce(
    (acc, curr) => acc + (curr.status === 'ativo' && curr.monthlyFee ? curr.monthlyFee : 0),
    0
  );

  const openWhatsApp = (phone: string, studentName: string, modalityName: string, startTime: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Aluno sem número de telefone cadastrado.');
      return;
    }
    const message = encodeURIComponent(
      `Olá ${studentName}, tudo bem? Confirmando nossa aula de ${modalityName} às ${startTime}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Excel / Google Sheets Style Tab Bar */}
      <div className="bg-white text-zinc-900 rounded-2xl p-2.5 shadow-lg border border-zinc-200">
        <div className="flex items-center justify-between pb-2 px-2 text-xs text-zinc-600 font-medium border-b border-zinc-200 mb-1.5">
          <div className="flex items-center space-x-2">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-600">Abas do Arquivo (Modalidades):</span>
          </div>
          <span className="text-[11px] text-zinc-500 font-mono">
            Cada aba representa uma planilha de modalidade
          </span>
        </div>

        {/* Scrollable Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-1">
          {modalities.map((mod) => {
            const isActive = currentModality?.id === mod.id;
            const count = schedules.filter(
              (s) => s.modalityId === mod.id || s.modalityName.toLowerCase() === mod.sheetTabName.toLowerCase()
            ).length;

            return (
              <button
                key={mod.id}
                id={`tab-btn-${mod.id}`}
                onClick={() => setActiveTabId(mod.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? 'bg-white text-teal-900 border-zinc-300 shadow-lg'
                    : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-xs"
                  style={{ backgroundColor: mod.color }}
                />
                <span>{mod.sheetTabName}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-zinc-50/10 text-teal-900' : 'bg-zinc-200 text-zinc-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Add New Tab Button */}
          <button
            onClick={onAddModality}
            id="btn-add-modality-tab"
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 transition-all whitespace-nowrap"
            title="Criar nova aba de modalidade na planilha"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Nova Aba</span>
          </button>
        </div>
      </div>

      {/* Active Tab Header & Summary Card */}
      {currentModality && (
        <div className="bg-white rounded-2xl border border-zinc-200 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Tab Info */}
            <div className="flex items-start space-x-3.5">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-zinc-900 shadow-md shrink-0"
                style={{ backgroundColor: currentModality.color }}
              >
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
                    Aba: {currentModality.sheetTabName}
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-900 uppercase tracking-wider"
                    style={{ backgroundColor: currentModality.color }}
                  >
                    {currentModality.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  {currentModality.description || 'Gestão da grade e alunos desta modalidade'}
                </p>
                {currentModality.instructorName && (
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                    Instrutor Responsável: <span className="text-zinc-700">{currentModality.instructorName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Tab metrics */}
              <div className="flex items-center space-x-3 bg-zinc-100 border border-zinc-200 px-3.5 py-2 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Alunos Ativos</span>
                  <span className="font-bold text-zinc-900 text-sm">{activeCount}</span>
                </div>
                <div className="h-6 w-px bg-zinc-200" />
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Aulas/Sem</span>
                  <span className="font-bold text-zinc-900 text-sm">{totalWeeklyClasses}</span>
                </div>
                {totalRevenue > 0 && (
                  <>
                    <div className="h-6 w-px bg-zinc-200" />
                    <div>
                      <span className="text-zinc-500 block text-[10px] uppercase">Receita Est.</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        R$ {totalRevenue.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Edit Tab Config */}
              <button
                onClick={() => onEditModality(currentModality)}
                className="p-2.5 rounded-xl border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                title="Configurações desta aba de modalidade"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Add Student to this tab */}
              <button
                onClick={() => onAddNewStudent(currentModality.id)}
                className="flex items-center space-x-1.5 bg-white text-teal-900 hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Aluno</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Filter and Search Bar for Tab Rows */}
      <div className="bg-white rounded-2xl p-3.5 border border-zinc-200 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, dias ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-100 border border-zinc-300 text-zinc-800 placeholder:text-zinc-400 rounded-xl focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-zinc-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-100 border border-zinc-300 text-zinc-800 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="ferias">Em Férias</option>
            <option value="trancado">Trancado</option>
          </select>
        </div>
      </div>

      {/* Grouped Classes Grid */}
      <div className="mt-6">
        {tabSchedules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 py-12 text-center shadow-sm">
            <User className="h-10 w-10 text-zinc-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-700">
              Nenhum aluno encontrado nesta aba
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Comece adicionando alunos nesta modalidade para montar a grade de horários.
            </p>
            {currentModality && (
              <button
                onClick={() => onAddNewStudent(currentModality.id)}
                className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-teal-500 text-white hover:bg-teal-600 transition-all uppercase tracking-wider shadow-md shadow-teal-500/20"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Cadastrar Primeiro Aluno</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(() => {
              // Group schedules by Days + Time + Professor
              const groupedClasses = tabSchedules.reduce((acc, schedule) => {
                const key = `${schedule.daysOfWeek.join(',')}-${schedule.startTime}-${schedule.endTime}-${schedule.professor || 'sem-prof'}`;
                if (!acc[key]) {
                  acc[key] = {
                    days: schedule.daysOfWeek,
                    startTime: schedule.startTime,
                    endTime: schedule.endTime,
                    professor: schedule.professor,
                    roomOrLocation: schedule.roomOrLocation,
                    students: []
                  };
                }
                acc[key].students.push(schedule);
                return acc;
              }, {} as Record<string, any>);

              return Object.values(groupedClasses).map((group, idx) => (
                <div key={idx} className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-4 hover:shadow-md transition-shadow">
                  {/* Card Header: Modality & Info */}
                  <div className="flex items-start justify-between border-b border-zinc-100 pb-3 mb-3">
                    <div>
                      <span 
                        className="px-2 py-1 text-xs font-bold rounded-lg uppercase tracking-wider text-white shadow-sm"
                        style={{ backgroundColor: currentModality?.color || '#14b8a6' }}
                      >
                        {currentModality?.name}
                      </span>
                      <div className="mt-2.5 text-sm font-semibold text-zinc-800 flex items-center space-x-1.5">
                        <Clock className="h-4 w-4 text-zinc-400" />
                        <span>{group.startTime} - {group.endTime}</span>
                      </div>
                      <div className="mt-1 text-xs text-zinc-500 font-mono">
                        {group.professor ? `Prof. ${group.professor}` : 'Professor não definido'}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex flex-wrap justify-end gap-1 max-w-[120px]">
                        {group.days.map((d: string) => (
                          <span key={d} className="text-[10px] font-medium bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-600 border border-zinc-200">
                            {d}
                          </span>
                        ))}
                      </div>
                      {group.roomOrLocation && (
                        <div className="text-[10px] text-zinc-400 max-w-[100px] truncate" title={group.roomOrLocation}>
                          📍 {group.roomOrLocation}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Students List */}
                  <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                      Alunos ({group.students.length})
                    </div>
                    {group.students.map((schedule: any) => (
                      <div 
                        key={schedule.id}
                        className="group flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all cursor-pointer"
                        onClick={() => onEditStudent(schedule)}
                      >
                        <div className="flex items-center space-x-2.5 overflow-hidden">
                          <User className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <span className="text-sm font-medium text-zinc-800 truncate" title={schedule.studentName}>
                            {schedule.studentName}
                          </span>
                          {schedule.status !== 'ativo' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] uppercase font-bold bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                              {schedule.status}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {schedule.phone && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openWhatsApp(
                                  schedule.phone,
                                  schedule.studentName,
                                  schedule.modalityName,
                                  schedule.startTime
                                );
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Remover "${schedule.studentName}" da turma?`)) {
                                onDeleteStudent(schedule.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                            title="Remover matrícula"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
