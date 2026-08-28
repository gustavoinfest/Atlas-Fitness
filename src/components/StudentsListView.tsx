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
  FileSpreadsheet,
  Upload,
  UserCheck,
  ShieldAlert,
  UserX,
  UserPlus,
  ArrowUpRight,
  Sparkles,
  Download
} from 'lucide-react';
import { Modality, StudentClassSchedule, StudentStatus, ClientRecord } from '../types';
import * as XLSX from 'xlsx';

interface StudentsListViewProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  clients: ClientRecord[];
  onAddNewStudent: () => void;
  onScheduleClient: (client: ClientRecord) => void;
  onEditStudent: (schedule: StudentClassSchedule) => void;
  onDeleteStudent: (scheduleId: string) => void;
  onUpdateStatus: (scheduleId: string, status: StudentStatus) => void;
  onOpenImportModal: () => void;
  onUpdateClientStatus: (clientId: string, newStatus: string) => void;
  onDeleteClient: (clientId: string) => void;
}

export const StudentsListView: React.FC<StudentsListViewProps> = ({
  modalities,
  schedules,
  clients,
  onAddNewStudent,
  onScheduleClient,
  onEditStudent,
  onDeleteStudent,
  onUpdateStatus,
  onOpenImportModal,
  onUpdateClientStatus,
  onDeleteClient,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'schedules'>('directory');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [professorFilter, setProfessorFilter] = useState('all');
  const [consultorFilter, setConsultorFilter] = useState('all');
  const [modalityFilter, setModalityFilter] = useState('all');
  const [dayFilter, setDayFilter] = useState('all');

  // Directory Stats
  const totalClients = clients.length;
  const activeClients = clients.filter((c) => c.status.toLowerCase().includes('ativo')).length;
  const inativeClients = clients.filter((c) => c.status.toLowerCase().includes('inativ')).length;
  const blockedClients = clients.filter((c) => c.status.toLowerCase().includes('bloque')).length;
  const suspendedClients = clients.filter((c) => c.status.toLowerCase().includes('suspen')).length;

  // Extract unique professors & consultores
  const uniqueProfessors = Array.from(new Set(clients.map((c) => c.professor).filter(Boolean))) as string[];
  const uniqueConsultores = Array.from(new Set(clients.map((c) => c.consultor).filter(Boolean))) as string[];

  // Filter General Directory Clients
  const filteredClients = clients.filter((c) => {
    if (statusFilter !== 'all') {
      if (statusFilter === 'Ativo' && !c.status.toLowerCase().includes('ativo')) return false;
      if (statusFilter === 'Inativo' && !c.status.toLowerCase().includes('inativ')) return false;
      if (statusFilter === 'Bloqueado' && !c.status.toLowerCase().includes('bloque')) return false;
      if (statusFilter === 'Suspenso' && !c.status.toLowerCase().includes('suspen')) return false;
    }
    if (professorFilter !== 'all' && c.professor !== professorFilter) return false;
    if (consultorFilter !== 'all' && c.consultor !== consultorFilter) return false;

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(term);
      const matchId = c.id.toLowerCase().includes(term);
      const matchProf = c.professor?.toLowerCase().includes(term);
      const matchCons = c.consultor?.toLowerCase().includes(term);
      const matchPersonal = c.personal?.toLowerCase().includes(term);
      const matchNotes = c.notes?.toLowerCase().includes(term);
      return matchName || matchId || matchProf || matchCons || matchPersonal || matchNotes;
    }

    return true;
  });

  // Filter Scheduled Students
  const filteredSchedules = schedules.filter((s) => {
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

  const openWhatsApp = (phone: string, studentName: string, modalityName: string) => {
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

  const handleExportClientsExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      filteredClients.map((c) => ({
        'Nome do Cliente': c.name,
        'Matrícula / ID': c.id,
        'Professor': c.professor || '',
        'Consultor': c.consultor || '',
        'Personal Trainer': c.personal || '',
        'Status': c.status || 'Ativo',
        'Irmã': c.sisterName || '',
        'Mãe': c.motherName || '',
        'Telefone': c.phone || '',
        'Observações': c.notes || '',
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cadastro de Alunos');
    XLSX.writeFile(wb, 'Lista_Geral_Alunos.xlsx');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Banner with Key Directory Metrics */}
      <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex items-center space-x-2 bg-[#121212] p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveSubTab('directory')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeSubTab === 'directory'
                ? 'bg-teal-500 text-black shadow-lg font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>Cadastro Geral ({totalClients})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('schedules')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
              activeSubTab === 'schedules'
                ? 'bg-teal-500 text-black shadow-lg font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Aulas Agendadas ({schedules.length})</span>
          </button>
        </div>

        {/* Quick Summary Counts */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <div className="bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-zinc-500">Ativos:</span>
            <span className="text-white font-bold">{activeClients}</span>
          </div>

          {blockedClients > 0 && (
            <div className="bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span>
              <span className="text-zinc-500">Bloqueados:</span>
              <span className="text-white font-bold">{blockedClients}</span>
            </div>
          )}

          {suspendedClients > 0 && (
            <div className="bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5 flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-zinc-500">Suspensos:</span>
              <span className="text-white font-bold">{suspendedClients}</span>
            </div>
          )}

          {/* Import / Export Action Buttons */}
          <button
            onClick={onOpenImportModal}
            className="flex items-center space-x-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
            title="Importar arquivos Excel, CSV, TSV ou colar texto"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Importar Arquivo</span>
          </button>

          <button
            onClick={handleExportClientsExcel}
            className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
            title="Baixar lista em Excel"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Exportar</span>
          </button>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder={
                activeSubTab === 'directory'
                  ? 'Buscar por nome, matrícula ID, professor, consultor...'
                  : 'Buscar por aluno agendado, telefone, horário...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#121212] border border-white/10 text-slate-200 placeholder:text-zinc-600 rounded-xl focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            
            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500"
            >
              <option value="all">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Bloqueado">Bloqueado</option>
              <option value="Suspenso">Suspenso</option>
              <option value="Pendente">Pendente</option>
            </select>

            {/* Directory-specific filters */}
            {activeSubTab === 'directory' && (
              <>
                {uniqueProfessors.length > 0 && (
                  <select
                    value={professorFilter}
                    onChange={(e) => setProfessorFilter(e.target.value)}
                    className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500 max-w-[160px] truncate"
                  >
                    <option value="all">Todos Professores</option>
                    {uniqueProfessors.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}

                {uniqueConsultores.length > 0 && (
                  <select
                    value={consultorFilter}
                    onChange={(e) => setConsultorFilter(e.target.value)}
                    className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500 max-w-[160px] truncate"
                  >
                    <option value="all">Todos Consultores</option>
                    {uniqueConsultores.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </>
            )}

            {/* Schedules-specific filters */}
            {activeSubTab === 'schedules' && (
              <>
                <select
                  value={modalityFilter}
                  onChange={(e) => setModalityFilter(e.target.value)}
                  className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 focus:ring-teal-500"
                >
                  <option value="all">Todas as Modalidades</option>
                  {modalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.sheetTabName}
                    </option>
                  ))}
                </select>

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
              </>
            )}

            {/* Add New Button */}
            <button
              onClick={onAddNewStudent}
              className="flex items-center space-x-1.5 bg-white text-black hover:bg-zinc-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-lg uppercase tracking-wider transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Novo Agendamento</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: GENERAL CLIENT DIRECTORY TABLE (340+ CLIENTS)                  */}
      {/* ========================================================================= */}
      {activeSubTab === 'directory' && (
        <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#121212] border-b border-white/5 text-[10px] uppercase font-mono text-zinc-400">
                <tr>
                  <th className="py-3 px-4">Aluno / Cliente</th>
                  <th className="py-3 px-4">Matrícula</th>
                  <th className="py-3 px-4">Professor</th>
                  <th className="py-3 px-4">Consultor</th>
                  <th className="py-3 px-4">Personal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredClients.map((client) => {
                  const isScheduled = schedules.some((s) => s.studentName.toLowerCase() === client.name.toLowerCase());
                  const isBlocked = client.status.toLowerCase().includes('bloque');
                  const isSuspended = client.status.toLowerCase().includes('suspen');
                  const isInative = client.status.toLowerCase().includes('inativ');

                  return (
                    <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                      
                      {/* Name & Badge */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-8 w-8 rounded-xl bg-[#171717] border border-white/5 flex items-center justify-center font-bold text-teal-400 text-xs shrink-0">
                            {client.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-white text-xs leading-snug flex items-center space-x-2">
                              <span>{client.name}</span>
                              {isScheduled && (
                                <span className="px-1.5 py-0.2 rounded bg-teal-500/10 text-teal-400 text-[10px] font-mono border border-teal-500/20">
                                  Agendada
                                </span>
                              )}
                            </div>
                            {client.sisterName && (
                              <span className="text-[10px] text-zinc-500">Irmã: {client.sisterName}</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Matrícula ID */}
                      <td className="py-3 px-4 font-mono text-zinc-300 text-xs font-semibold">
                        #{client.id}
                      </td>

                      {/* Professor */}
                      <td className="py-3 px-4 text-zinc-300 text-xs">
                        {client.professor || <span className="text-zinc-600">-</span>}
                      </td>

                      {/* Consultor */}
                      <td className="py-3 px-4 text-zinc-400 text-xs">
                        {client.consultor || <span className="text-zinc-600">-</span>}
                      </td>

                      {/* Personal */}
                      <td className="py-3 px-4 text-zinc-400 text-xs">
                        {client.personal || <span className="text-zinc-600">-</span>}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3 px-4">
                        <select
                          value={client.status}
                          onChange={(e) => onUpdateClientStatus(client.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase rounded-lg px-2 py-0.5 border ${
                            isBlocked
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : isSuspended
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : isInative
                              ? 'bg-zinc-800 text-zinc-400 border-zinc-700'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          }`}
                        >
                          <option value="Ativo" className="bg-[#121212] text-emerald-400">Ativo</option>
                          <option value="Inativo" className="bg-[#121212] text-zinc-400">Inativo</option>
                          <option value="Bloqueado" className="bg-[#121212] text-rose-400">Bloqueado</option>
                          <option value="Suspenso" className="bg-[#121212] text-amber-300">Suspenso</option>
                          <option value="Pendente" className="bg-[#121212] text-sky-400">Pendente</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => onScheduleClient(client)}
                            className="flex items-center space-x-1 bg-white/5 hover:bg-teal-500/20 text-zinc-300 hover:text-teal-300 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                            title="Agendar horário na agenda de modalidades"
                          >
                            <span>Agendar</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Excluir cadastro de "${client.name}"?`)) {
                                onDeleteClient(client.id);
                              }
                            }}
                            className="p-1 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                            title="Excluir"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredClients.length === 0 && (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-300">Nenhum aluno encontrado no cadastro</h3>
              <p className="text-xs text-zinc-500 mt-1">Tente ajustar a busca ou importe uma nova planilha de alunos.</p>
            </div>
          )}

          <div className="p-3 bg-[#121212] border-t border-white/5 flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>Exibindo {filteredClients.length} de {clients.length} alunos cadastrados</span>
            <span>Limite por horário no Glúteo Zone: 4 alunas</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: ACTIVE SCHEDULED STUDENTS CARDS                                */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchedules.map((schedule) => {
            const modColor = getModalityColor(schedule.modalityId);

            return (
              <div
                key={schedule.id}
                className="bg-[#0d0d0d] rounded-2xl border border-white/5 p-4 shadow-md hover:border-teal-500/30 transition-all flex flex-col justify-between"
              >
                <div>
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
                  </div>

                  {schedule.notes && (
                    <p className="text-[11px] text-zinc-400 mt-2 bg-amber-500/5 p-2 rounded-xl border border-amber-500/20">
                      <span className="font-semibold text-amber-300">Obs:</span> {schedule.notes}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                  {schedule.phone ? (
                    <button
                      type="button"
                      onClick={() =>
                        openWhatsApp(
                          schedule.phone,
                          schedule.studentName,
                          schedule.modalityName
                        )
                      }
                      className="flex items-center space-x-1.5 text-xs text-emerald-400 font-medium bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition-colors font-mono"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-600 font-mono">Sem telefone</span>
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
                        if (confirm(`Remover "${schedule.studentName}" da agenda?`)) {
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

          {filteredSchedules.length === 0 && (
            <div className="col-span-full bg-[#0d0d0d] rounded-2xl border border-white/5 p-12 text-center shadow-xl">
              <Users className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-zinc-300">Nenhum aluno agendado com esses filtros</h3>
              <p className="text-xs text-zinc-500 mt-1">Selecione um aluno do Cadastro Geral e clique em "Agendar".</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
