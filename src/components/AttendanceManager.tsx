import React, { useState } from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  UserCheck, 
  UserX, 
  AlertCircle, 
  RotateCcw, 
  MessageCircle, 
  CheckCircle2, 
  Sparkles,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Modality, 
  StudentClassSchedule, 
  DayOfWeek, 
  AttendanceStatus 
} from '../types';

interface AttendanceManagerProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  onRecordAttendance: (scheduleId: string, date: string, status: AttendanceStatus, notes?: string) => void;
}

const DAY_INDEX_MAP: Record<number, DayOfWeek> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
};

export const AttendanceManager: React.FC<AttendanceManagerProps> = ({
  modalities,
  schedules,
  onRecordAttendance,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [modalityFilter, setModalityFilter] = useState<string>('all');

  // Determine Day of Week from selectedDate
  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayOfWeek = DAY_INDEX_MAP[dateObj.getDay()];

  // Filter schedules that occur on this day of week
  const todaySchedules = schedules.filter((s) => {
    if (s.status !== 'ativo') return false;
    if (!s.daysOfWeek.includes(dayOfWeek)) return false;
    if (modalityFilter !== 'all' && s.modalityId !== modalityFilter) return false;
    return true;
  }).sort((a, b) => a.startTime.localeCompare(b.startTime));

  const getAttendanceForDate = (schedule: StudentClassSchedule) => {
    return schedule.attendanceHistory?.find((att) => att.date === selectedDate);
  };

  const handleStatusClick = (scheduleId: string, status: AttendanceStatus) => {
    onRecordAttendance(scheduleId, selectedDate, status);
    if (status === 'presente') {
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
      });
    }
  };

  const sendReminder = (schedule: StudentClassSchedule) => {
    const clean = schedule.phone.replace(/\D/g, '');
    if (!clean) {
      alert('Telefone do aluno não informado.');
      return;
    }
    const message = encodeURIComponent(
      `Olá ${schedule.studentName}! Lembrando que hoje temos nossa aula de ${schedule.modalityName} às ${schedule.startTime}. Até já!`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };

  // Summary counts
  let presentCount = 0;
  let absentCount = 0;
  let justifiedCount = 0;
  let reposicaoCount = 0;
  let pendingCount = 0;

  todaySchedules.forEach((s) => {
    const att = getAttendanceForDate(s);
    if (!att) pendingCount++;
    else if (att.status === 'presente') presentCount++;
    else if (att.status === 'falta') absentCount++;
    else if (att.status === 'justificada') justifiedCount++;
    else if (att.status === 'reposicao') reposicaoCount++;
  });

  const getModalityColor = (modalityId: string) => {
    const mod = modalities.find((m) => m.id === modalityId);
    return mod?.color || '#0D9488';
  };

  return (
    <div className="space-y-4">
      {/* Date & Filter Header */}
      <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Date Picker & Day Badge */}
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                Data da Chamada:
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#121212] border border-white/10 rounded-xl text-white font-mono font-semibold focus:ring-teal-500"
                />
                <span className="px-2.5 py-1.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-bold">
                  {dayOfWeek}-feira
                </span>
              </div>
            </div>
          </div>

          {/* Modality Filter */}
          <div className="flex items-center space-x-2">
            <span className="text-xs text-zinc-500 font-medium flex items-center">
              <Filter className="h-3.5 w-3.5 mr-1 text-teal-400" />
              Filtrar Aba:
            </span>
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
          </div>

          {/* Quick Metrics of the Day */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1.5 rounded-xl font-semibold">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>{presentCount} Presentes</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/30 px-2.5 py-1.5 rounded-xl font-semibold">
              <UserX className="h-3.5 w-3.5 text-rose-400" />
              <span>{absentCount} Faltas</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl font-semibold">
              <AlertCircle className="h-3.5 w-3.5 text-amber-300" />
              <span>{justifiedCount} Justificadas</span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white/5 text-zinc-400 border border-white/10 px-2.5 py-1.5 rounded-xl font-semibold">
              <span>{pendingCount} Pendentes</span>
            </div>
          </div>

        </div>
      </div>

      {/* Class List for the Day */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        {todaySchedules.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="h-10 w-10 text-zinc-600 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Nenhuma aula agendada para {dayOfWeek} ({selectedDate})
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Verifique os dias de aula dos alunos cadastrados nas abas ou mude a data selecionada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0a0a0a] border-b border-white/5 text-zinc-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Horário</th>
                  <th className="py-3 px-4">Aluno</th>
                  <th className="py-3 px-4">Modalidade / Aba</th>
                  <th className="py-3 px-4">Espaço / Sala</th>
                  <th className="py-3 px-4 text-center">Status da Presença</th>
                  <th className="py-3 px-4 text-right">Lembrete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {todaySchedules.map((schedule) => {
                  const att = getAttendanceForDate(schedule);
                  const currentStatus = att?.status;
                  const modColor = getModalityColor(schedule.modalityId);

                  return (
                    <tr key={schedule.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Time */}
                      <td className="py-3 px-4 font-bold text-zinc-200 whitespace-nowrap font-mono">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="h-3.5 w-3.5 text-zinc-500" />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2.5">
                          <div className="h-7 w-7 rounded-xl bg-[#171717] border border-white/5 flex items-center justify-center font-bold text-teal-400 text-xs">
                            {schedule.studentName.charAt(0)}
                          </div>
                          <span>{schedule.studentName}</span>
                        </div>
                      </td>

                      {/* Modality */}
                      <td className="py-3 px-4">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white uppercase tracking-wider inline-block"
                          style={{ backgroundColor: modColor }}
                        >
                          {schedule.modalityName}
                        </span>
                      </td>

                      {/* Room */}
                      <td className="py-3 px-4 text-zinc-400">
                        {schedule.roomOrLocation || <span className="text-zinc-600">-</span>}
                      </td>

                      {/* Attendance Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center space-x-1.5">
                          {/* Present */}
                          <button
                            onClick={() => handleStatusClick(schedule.id, 'presente')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                              currentStatus === 'presente'
                                ? 'bg-emerald-500 text-black border-emerald-500 font-bold shadow-md'
                                : 'bg-[#121212] text-zinc-300 border-white/5 hover:border-emerald-500/40 hover:text-emerald-400'
                            }`}
                            title="Marcar presença"
                          >
                            ✓ Presente
                          </button>

                          {/* Absent */}
                          <button
                            onClick={() => handleStatusClick(schedule.id, 'falta')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                              currentStatus === 'falta'
                                ? 'bg-rose-500 text-white border-rose-500 font-bold shadow-md'
                                : 'bg-[#121212] text-zinc-300 border-white/5 hover:border-rose-500/40 hover:text-rose-400'
                            }`}
                            title="Marcar falta"
                          >
                            ✗ Falta
                          </button>

                          {/* Justified */}
                          <button
                            onClick={() => handleStatusClick(schedule.id, 'justificada')}
                            className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                              currentStatus === 'justificada'
                                ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-md'
                                : 'bg-[#121212] text-zinc-300 border-white/5 hover:border-amber-500/40 hover:text-amber-400'
                            }`}
                            title="Falta justificada"
                          >
                            Justificada
                          </button>

                          {/* Make-up class */}
                          <button
                            onClick={() => handleStatusClick(schedule.id, 'reposicao')}
                            className={`px-2 py-1 rounded-xl text-xs font-semibold border transition-all ${
                              currentStatus === 'reposicao'
                                ? 'bg-sky-500 text-black border-sky-500 font-bold shadow-md'
                                : 'bg-[#121212] text-zinc-300 border-white/5 hover:border-sky-500/40 hover:text-sky-400'
                            }`}
                            title="Aula de reposição"
                          >
                            Reposição
                          </button>
                        </div>
                      </td>

                      {/* WhatsApp Reminder */}
                      <td className="py-3 px-4 text-right">
                        {schedule.phone ? (
                          <button
                            onClick={() => sendReminder(schedule)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors font-mono"
                            title="Enviar lembrete de aula via WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
                            <span>Lembrar</span>
                          </button>
                        ) : (
                          <span className="text-zinc-600 text-[11px] font-mono">-</span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
