import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MessageCircle, 
  Clock, 
  Calendar, 
  Edit3, 
  Trash2, 
  Plus, 
  DollarSign, 
  Layers, 
  CheckCircle2, 
  AlertCircle,
  FileSpreadsheet
} from 'lucide-react';
import { Modality, StudentClassSchedule, StudentStatus } from '../types';

interface StudentsListViewProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  onAddNewStudent: () => void;
  onEditStudent: (schedule: StudentClassSchedule) => void;
  onDeleteStudent: (scheduleId: string) => void;
  onUpdateStatus: (scheduleId: string, status: StudentStatus) => void;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  modalities,
  schedules,
  onAddNewStudent,
  onEditStudent,
  onDeleteStudent,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  const filtered = schedules.filter((s) => {
    if (modalityFilter !== 'all' && s.modalityId !== modalityFilter) return false;
    if (statusFilter !== 'all' && s.status !== statusFilter) return false;
    if (dayFilter !== 'all' && !s.daysOfWeek.includes(dayFilter as any)) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = s.studentName.toLowerCase().includes(term);
      const matchPhone = s.phone.includes(term);
      const matchEmail = s.email?.toLowerCase().includes(term);
      const matchNotes = s.notes?.toLowerCase().includes(term);
      const matchMod = s.modalityName.toLowerCase().includes(term);
      return matchName || matchPhone || matchEmail || matchNotes || matchMod;
    }

    return true;
  });

  const getModalityColor = (modalityId: string) => {
    const mod = modalities.find((m) => m.id === modalityId);
    return mod?.color || '#0D9488';
  };

  const openWhatsApp = (phone: string, studentName: string, modalityName: string, startTime: string) => {
    const clean = phone.replace(/\D/g, '');
    if (!clean) {
      alert('Aluno sem número de telefone cadastrado.');
      return;
    }
    const text = encodeURIComponent(
      `Olá ${studentName}! Estou entrando em contato referente às suas aulas de ${modalityName}.`
    );
    window.open(`https://wa.me/${clean}?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Buscar aluno, telefone, e-mail ou observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#121212] border border-white/10 text-slate-200 placeholder:text-zinc-600 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Modality tab filter */}
            <select
              value={modalityFilter}
              onChange={(e) => setModalityFilter(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500"
            >
              <option value="all">Todas as Abas / Modalidades</option>
              {modalities.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.sheetTabName}
                </option>
              ))}
            </select>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500"
            >
              <option value="all">Todos os Status</option>
              <option value="ativo">Ativo</option>
              <option value="pendente">Pendente</option>
              <option value="ferias">Férias</option>
              <option value="trancado">Trancado</option>
            </select>

            {/* Day filter */}
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500"
            >
              <option value="all">Qualquer Dia</option>
              <option value="Segunda">Segunda</option>
              <option value="Terça">Terça</option>
              <option value="Quarta">Quarta</option>
              <option value="Quinta">Quinta</option>
              <option value="Sexta">Sexta</option>
              <option value="Sábado">Sábado</option>
              <option value="Domingo">Domingo</option>
            </select>

            {/* Add Button */}
            <button
              onClick={onAddNewStudent}
              className="flex items-center space-x-1.5 bg-white text-black hover:bg-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg uppercase tracking-wider transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Aluno</span>
            </button>
          </div>

        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((schedule) => {
          const modColor = getModalityColor(schedule.modalityId);

          return (
            <div
              key={schedule.id}
              className="bg-[#0d0d0d] rounded-2xl border border-white/5 p-4 shadow-md hover:border-teal-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Top Row: Name & Modality Tag */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#171717] border border-white/5 flex items-center justify-center font-bold text-teal-400 text-sm shrink-0">
                      {schedule.studentName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm leading-snug">
                        {schedule.studentName}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span
                          className="px-1.5 py-0.2 rounded text-[10px] font-semibold text-white inline-block"
                          style={{ backgroundColor: modColor }}
                        >
                          Aba: {schedule.modalityName}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500">
                          {schedule.plan}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={schedule.status}
                    onChange={(e) => onUpdateStatus(schedule.id, e.target.value as StudentStatus)}
                    className={`text-[10px] font-bold uppercase rounded-lg px-2 py-0.5 border ${
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
                </div>

                {/* Days & Schedule */}
                <div className="mt-3 bg-[#121212] rounded-xl p-3 border border-white/5 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center text-[11px]">
                      <Calendar className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                      Dias:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {schedule.daysOfWeek.map((day) => (
                        <span
                          key={day}
                          className="px-1.5 py-0.2 rounded-lg bg-white/5 text-zinc-300 text-[10px] font-medium border border-white/5"
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 flex items-center text-[11px]">
                      <Clock className="h-3.5 w-3.5 mr-1 text-zinc-500" />
                      Horário:
                    </span>
                    <span className="font-semibold text-zinc-200 font-mono">
                      {schedule.startTime} - {schedule.endTime} ({schedule.durationMinutes} min)
                    </span>
                  </div>

                  {schedule.monthlyFee && (
                    <div className="flex items-center justify-between pt-1.5 border-t border-white/5">
                      <span className="text-zinc-500 text-[11px]">Mensalidade:</span>
                      <span className="font-bold text-emerald-400 font-mono">
                        R$ {schedule.monthlyFee}
                      </span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {schedule.notes && (
                  <p className="text-[11px] text-zinc-400 mt-2 bg-amber-500/5 p-2 rounded-xl border border-amber-500/20">
                    <span className="font-semibold text-amber-300">Obs:</span> {schedule.notes}
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                {/* Contact button */}
                {schedule.phone ? (
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
                    className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-colors font-mono"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>WhatsApp</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-zinc-600">Sem telefone</span>
                )}

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onEditStudent(schedule)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    title="Editar"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Remover "${schedule.studentName}"?`)) {
                        onDeleteStudent(schedule.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-rose-400/80 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 p-12 text-center shadow-xl">
          <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-zinc-300">
            Nenhum aluno encontrado com esses filtros
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Tente redefinir os filtros ou adicione um novo aluno na agenda.
          </p>
        </div>
      )}
    </div>
  );
};
