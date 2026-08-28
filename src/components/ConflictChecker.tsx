import React from 'react';
import { AlertTriangle, Clock, Calendar, Users, CheckCircle2, ChevronRight } from 'lucide-react';
import { Modality, StudentClassSchedule, DayOfWeek } from '../types';

interface ConflictCheckerProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  onResolveConflict: (schedule: StudentClassSchedule) => void;
}

const ALL_DAYS: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const ConflictChecker: React.FC<ConflictCheckerProps> = ({
  modalities,
  schedules,
  onResolveConflict,
}) => {
  // Find conflicts: same day, same modality, overlapping time
  const conflicts: Array<{
    id: string;
    day: DayOfWeek;
    timeSlot: string;
    modality: Modality;
    students: StudentClassSchedule[];
    maxCapacity: number;
  }> = [];

  ALL_DAYS.forEach((day) => {
    modalities.forEach((mod) => {
      const modSchedules = schedules.filter(
        (s) => s.status === 'ativo' && (s.modalityId === mod.id || s.modalityName.toLowerCase() === mod.sheetTabName.toLowerCase()) && s.daysOfWeek.includes(day)
      );

      // Check pairs for time overlap
      const groupedBySlot: Record<string, StudentClassSchedule[]> = {};

      modSchedules.forEach((s) => {
        const slotKey = `${s.startTime}-${s.endTime}`;
        if (!groupedBySlot[slotKey]) {
          groupedBySlot[slotKey] = [];
        }
        groupedBySlot[slotKey].push(s);
      });

      const maxLimit = mod.maxStudentsPerSlot || 2;

      Object.entries(groupedBySlot).forEach(([slot, list]) => {
        if (list.length > maxLimit) {
          conflicts.push({
            id: `${mod.id}-${day}-${slot}`,
            day,
            timeSlot: slot,
            modality: mod,
            students: list,
            maxCapacity: maxLimit,
          });
        }
      });
    });
  });

  return (
    <div className="space-y-4">
      {/* Alert Banner / Header */}
      <div className="bg-[#0d0d0d] rounded-2xl p-5 border border-white/5 shadow-xl">
        <div className="flex items-center space-x-3">
          <div
            className={`h-10 w-10 rounded-xl flex items-center justify-center ${
              conflicts.length > 0
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}
          >
            {conflicts.length > 0 ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <CheckCircle2 className="h-5 w-5" />
            )}
          </div>
          <div>
            <h2 className="text-base font-bold text-white">
              {conflicts.length > 0
                ? `${conflicts.length} Atenção: Conflito(s) de Capacidade / Horário`
                : 'Nenhum conflito de horário detectado!'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {conflicts.length > 0
                ? 'Os horários abaixo ultrapassam a capacidade máxima de alunos definida para a aba.'
                : 'Todas as modalidades e horários estão balanceados dentro dos limites de vagas.'}
            </p>
          </div>
        </div>
      </div>

      {/* Conflict Items */}
      {conflicts.length > 0 && (
        <div className="space-y-3">
          {conflicts.map((conflict) => (
            <div
              key={conflict.id}
              className="bg-[#0d0d0d] border border-amber-500/30 rounded-2xl p-4 shadow-lg"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold text-white"
                    style={{ backgroundColor: conflict.modality.color }}
                  >
                    Aba: {conflict.modality.sheetTabName}
                  </span>
                  <span className="font-bold text-white text-sm font-mono">
                    {conflict.day} às {conflict.timeSlot}
                  </span>
                </div>

                <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl font-mono">
                  {conflict.students.length} alunos agendados (Limite recomendado: {conflict.maxCapacity})
                </span>
              </div>

              {/* Student list */}
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {conflict.students.map((student) => (
                  <div
                    key={student.id}
                    className="bg-[#121212] p-3 rounded-xl border border-white/5 shadow-xs flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">
                        {student.studentName}
                      </span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {student.plan} • {student.phone || 'Sem telefone'}
                      </span>
                    </div>
                    <button
                      onClick={() => onResolveConflict(student)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-teal-400 font-semibold text-xs border border-white/10 transition-colors"
                      title="Editar horário deste aluno"
                    >
                      Ajustar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
