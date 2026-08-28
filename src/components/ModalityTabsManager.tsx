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
      <div className="bg-[#0d0d0d] text-white rounded-2xl p-2.5 shadow-lg border border-white/5">
        <div className="flex items-center justify-between pb-2 px-2 text-xs text-zinc-400 font-medium border-b border-white/5 mb-1.5">
          <div className="flex items-center space-x-2">
            <Layers className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">Abas do Arquivo (Modalidades):</span>
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
                    ? 'bg-white text-black border-white shadow-lg'
                    : 'bg-[#121212] text-zinc-400 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shadow-xs"
                  style={{ backgroundColor: mod.color }}
                />
                <span>{mod.sheetTabName}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-black/10 text-black' : 'bg-white/10 text-zinc-300'
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
        <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 p-5 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            
            {/* Tab Info */}
            <div className="flex items-start space-x-3.5">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-md shrink-0"
                style={{ backgroundColor: currentModality.color }}
              >
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Aba: {currentModality.sheetTabName}
                  </h2>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider"
                    style={{ backgroundColor: currentModality.color }}
                  >
                    {currentModality.name}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  {currentModality.description || 'Gestão da grade e alunos desta modalidade'}
                </p>
                {currentModality.instructorName && (
                  <p className="text-xs text-zinc-500 mt-0.5 font-medium">
                    Instrutor Responsável: <span className="text-zinc-300">{currentModality.instructorName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Quick Metrics & Actions */}
            <div className="flex items-center flex-wrap gap-2.5">
              {/* Tab metrics */}
              <div className="flex items-center space-x-3 bg-[#121212] border border-white/5 px-3.5 py-2 rounded-xl text-xs font-mono">
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Alunos Ativos</span>
                  <span className="font-bold text-white text-sm">{activeCount}</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div>
                  <span className="text-zinc-500 block text-[10px] uppercase">Aulas/Sem</span>
                  <span className="font-bold text-white text-sm">{totalWeeklyClasses}</span>
                </div>
                {totalRevenue > 0 && (
                  <>
                    <div className="h-6 w-px bg-white/10" />
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
                className="p-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Configurações desta aba de modalidade"
              >
                <Settings className="h-4 w-4" />
              </button>

              {/* Add Student to this tab */}
              <button
                onClick={() => onAddNewStudent(currentModality.id)}
                className="flex items-center space-x-1.5 bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-all uppercase tracking-wider"
              >
                <Plus className="h-4 w-4" />
                <span>Adicionar Aluno</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Filter and Search Bar for Tab Rows */}
      <div className="bg-[#0d0d0d] rounded-2xl p-3.5 border border-white/5 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, dias ou observações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#121212] border border-white/10 text-slate-200 placeholder:text-zinc-600 rounded-xl focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-zinc-500 font-medium">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="all">Todos os Status</option>
            <option value="ativo">Ativo</option>
            <option value="pendente">Pendente</option>
            <option value="ferias">Em Férias</option>
            <option value="trancado">Trancado</option>
          </select>
        </div>
      </div>

      {/* Table of Students in the active Tab */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        {tabSchedules.length === 0 ? (
          <div className="py-12 text-center">
            <User className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Nenhum aluno encontrado nesta aba
            </h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              Comece adicionando alunos nesta modalidade para montar a grade de horários.
            </p>
            {currentModality && (
              <button
                onClick={() => onAddNewStudent(currentModality.id)}
                className="mt-3.5 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-zinc-200 transition-all uppercase tracking-wider"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Cadastrar Primeiro Aluno</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-white/5 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Nome do Aluno</th>
                  <th className="py-3 px-4">Dias da Semana</th>
                  <th className="py-3 px-4">Horário & Duração</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Contato / WhatsApp</th>
                  <th className="py-3 px-4">Plano & Valor</th>
                  <th className="py-3 px-4">Observações</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tabSchedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* Student Name */}
                    <td className="py-3 px-4 font-semibold text-white">
                      <div className="flex items-center space-x-2.5">
                        <div className="h-7 w-7 rounded-xl bg-[#171717] border border-white/5 flex items-center justify-center text-teal-400 font-bold text-xs shrink-0">
                          {schedule.studentName.charAt(0)}
                        </div>
                        <div>
                          <span>{schedule.studentName}</span>
                          {schedule.roomOrLocation && (
                            <span className="block text-[10px] text-zinc-500 font-normal">
                              {schedule.roomOrLocation}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Days */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {schedule.daysOfWeek.map((day) => (
                          <span
                            key={day}
                            className="px-1.5 py-0.5 rounded-lg bg-white/5 border border-white/5 text-zinc-300 text-[10px] font-medium"
                          >
                            {day}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Time & Duration */}
                    <td className="py-3 px-4 text-zinc-300 font-medium">
                      <div className="flex items-center space-x-1 font-mono">
                        <Clock className="h-3.5 w-3.5 text-zinc-500" />
                        <span>
                          {schedule.startTime} - {schedule.endTime}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 block mt-0.5 font-mono">
                        ({schedule.durationMinutes} min)
                      </span>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-3 px-4">
                      <select
                        value={schedule.status}
                        onChange={(e) => onUpdateStudentStatus(schedule.id, e.target.value as StudentStatus)}
                        className={`text-[11px] font-semibold rounded-lg px-2 py-1 border transition-colors ${
                          schedule.status === 'ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : schedule.status === 'pendente'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : schedule.status === 'ferias'
                            ? 'bg-sky-500/10 text-sky-400 border-sky-500/30'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        <option value="ativo" className="bg-[#121212] text-emerald-400">Ativo</option>
                        <option value="pendente" className="bg-[#121212] text-amber-300">Pendente</option>
                        <option value="ferias" className="bg-[#121212] text-sky-400">Férias</option>
                        <option value="trancado" className="bg-[#121212] text-zinc-400">Trancado</option>
                      </select>
                    </td>

                    {/* Contact */}
                    <td className="py-3 px-4">
                      {schedule.phone ? (
                        <div className="flex items-center space-x-1.5 font-mono">
                          <span className="text-zinc-300">{schedule.phone}</span>
                          <button
                            type="button"
                            onClick={() =>
                              openWhatsApp(
                                schedule.phone,
                                schedule.studentName,
                                schedule.modalityName,
                                schedule.startTime
                              )
                            }
                            className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                            title="Conversar no WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 italic text-[11px]">Sem contato</span>
                      )}
                    </td>

                    {/* Plan & Fee */}
                    <td className="py-3 px-4">
                      <span className="text-zinc-200 font-medium block">{schedule.plan}</span>
                      {schedule.monthlyFee !== undefined && (
                        <span className="text-emerald-400 font-semibold text-[11px] font-mono">
                          R$ {schedule.monthlyFee}
                        </span>
                      )}
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-zinc-400 max-w-xs truncate" title={schedule.notes || ''}>
                      {schedule.notes || <span className="text-zinc-600">-</span>}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onEditStudent(schedule)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                          title="Editar aluno e horários"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Remover "${schedule.studentName}" da modalidade ${schedule.modalityName}?`)) {
                              onDeleteStudent(schedule.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Remover matrícula"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
