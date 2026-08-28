import React, { useState } from 'react';
import { 
  Modality, 
  StudentClassSchedule, 
  DayOfWeek, 
  StudentStatus 
} from '../types';
import { 
  Clock, 
  MessageCircle, 
  User, 
  MapPin, 
  AlertCircle, 
  Filter, 
  Check, 
  Calendar,
  ChevronRight,
  Plus
} from 'lucide-react';

interface WeeklyScheduleViewProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  onEditSchedule: (schedule: StudentClassSchedule) => void;
  onAddNewForSlot?: (day: DayOfWeek, time: string) => void;
  onQuickAttendance?: (schedule: StudentClassSchedule, status: 'presente' | 'falta') => void;
}

const ALL_DAYS: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const WeeklyScheduleView: React.FC<WeeklyScheduleViewProps> = ({
  modalities,
  schedules,
  onEditSchedule,
  onAddNewForSlot,
  onQuickAttendance,
}) => {
  const [selectedModalityId, setSelectedModalityId] = useState<string>('all');
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>('all');
  const [showOnlyActive, setShowOnlyActive] = useState<boolean>(true);
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all');

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (selectedModalityId !== 'all' && s.modalityId !== selectedModalityId) return false;
    if (showOnlyActive && s.status !== 'ativo') return false;
    
    if (timeFilter === 'morning') {
      const hour = parseInt(s.startTime.split(':')[0], 10);
      if (hour >= 12) return false;
    } else if (timeFilter === 'afternoon') {
      const hour = parseInt(s.startTime.split(':')[0], 10);
      if (hour < 12 || hour >= 18) return false;
    } else if (timeFilter === 'evening') {
      const hour = parseInt(s.startTime.split(':')[0], 10);
      if (hour < 18) return false;
    }

    return true;
  });

  // Calculate unique hours in dataset plus standard grid hours
  const hoursList = [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '14:00', '14:30',
    '15:00', '16:00', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
    '20:00', '20:30', '21:00'
  ];

  // Filter hours based on time filter
  const displayedHours = hoursList.filter((h) => {
    const hourNum = parseInt(h.split(':')[0], 10);
    if (timeFilter === 'morning') return hourNum < 12;
    if (timeFilter === 'afternoon') return hourNum >= 12 && hourNum < 18;
    if (timeFilter === 'evening') return hourNum >= 18;
    return true;
  });

  const displayedDays = selectedDayFilter === 'all' 
    ? ALL_DAYS 
    : ALL_DAYS.filter(d => d === selectedDayFilter);

  // Group schedules by Day and Time
  const getSchedulesForSlot = (day: DayOfWeek, timeStr: string) => {
    const slotHour = parseInt(timeStr.split(':')[0], 10);
    const slotMin = parseInt(timeStr.split(':')[1], 10);
    const slotTotalMins = slotHour * 60 + slotMin;

    return filteredSchedules.filter((s) => {
      if (!s.daysOfWeek.includes(day)) return false;
      const [sHour, sMin] = s.startTime.split(':').map(Number);
      const sStartMins = sHour * 60 + sMin;
      const [eHour, eMin] = s.endTime.split(':').map(Number);
      const sEndMins = eHour * 60 + eMin;

      // Check if slot falls within this schedule's timeframe (30 min block resolution)
      return sStartMins <= slotTotalMins && slotTotalMins < sEndMins;
    });
  };

  const getModalityColor = (modalityId: string) => {
    const mod = modalities.find((m) => m.id === modalityId);
    return mod?.color || '#0D9488';
  };

  const openWhatsApp = (phone: string, studentName: string, modalityName: string, startTime: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) {
      alert('Aluno sem número de telefone cadastrado.');
      return;
    }
    const message = encodeURIComponent(
      `Olá ${studentName}, tudo bem? Confirmando nossa aula de ${modalityName} às ${startTime}. Até lá!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-4">
      {/* Controls and Filter Bar */}
      <div className="bg-[#0d0d0d] rounded-2xl p-4 border border-white/5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
          
          {/* Modality Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.15em] mr-1 flex items-center shrink-0">
              <Filter className="h-3 w-3 mr-1 text-teal-400" />
              Aba:
            </span>
            <button
              onClick={() => setSelectedModalityId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
                selectedModalityId === 'all'
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              Todas as Modalidades
            </button>
            {modalities.map((mod) => {
              const isSelected = selectedModalityId === mod.id;
              return (
                <button
                  key={mod.id}
                  onClick={() => setSelectedModalityId(mod.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'text-white shadow-[0_0_12px_rgba(20,184,166,0.25)] border-white/30'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 border-white/5'
                  }`}
                  style={{
                    backgroundColor: isSelected ? mod.color : undefined,
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : mod.color }}
                  />
                  <span>{mod.name}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters (Day of week, Time of Day, Active only) */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Shift filter */}
            <div className="flex items-center bg-[#121212] p-1 rounded-xl border border-white/5 font-medium">
              <button
                onClick={() => setTimeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeFilter === 'all' ? 'bg-white/10 text-white font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Todo o Dia
              </button>
              <button
                onClick={() => setTimeFilter('morning')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeFilter === 'morning' ? 'bg-white/10 text-white font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Manhã
              </button>
              <button
                onClick={() => setTimeFilter('afternoon')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeFilter === 'afternoon' ? 'bg-white/10 text-white font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Tarde
              </button>
              <button
                onClick={() => setTimeFilter('evening')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  timeFilter === 'evening' ? 'bg-white/10 text-white font-semibold shadow-xs' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Noite
              </button>
            </div>

            {/* Day filter selector */}
            <select
              value={selectedDayFilter}
              onChange={(e) => setSelectedDayFilter(e.target.value)}
              className="bg-[#121212] border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="all">Semana Completa</option>
              {ALL_DAYS.map((day) => (
                <option key={day} value={day}>
                  Apenas {day}
                </option>
              ))}
            </select>

            {/* Active only checkbox */}
            <label className="flex items-center space-x-1.5 cursor-pointer text-zinc-400 hover:text-zinc-200 px-2 py-1 select-none">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
                className="rounded border-white/20 bg-[#121212] text-teal-500 focus:ring-teal-500 h-3.5 w-3.5"
              />
              <span>Apenas Ativos</span>
            </label>
          </div>

        </div>
      </div>

      {/* Modality & Capacity Alert Banner */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-300">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 shrink-0">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div>
            <span className="font-bold text-amber-200">Atenção Glúteo Zone:</span>{' '}
            <span className="text-amber-300/90">
              Como ainda não temos horários fixos, cuidar na hora de agendar e colocar no <strong className="text-white">máximo 4 alunas</strong> por horário.
            </span>
          </div>
        </div>
        <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-amber-400/80 bg-amber-500/10 px-2.5 py-1 rounded-xl shrink-0">
          <span>Capacidade: 4 vagas/slot</span>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="bg-[#0d0d0d] rounded-2xl border border-white/5 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[760px]">
            <thead>
              <tr className="bg-[#0a0a0a] border-b border-white/5">
                <th className="py-3.5 px-3 w-20 text-center text-xs font-semibold text-zinc-500 border-r border-white/5 font-mono">
                  <Clock className="h-4 w-4 mx-auto text-zinc-500" />
                </th>
                {displayedDays.map((day) => {
                  const daySchedules = filteredSchedules.filter((s) => s.daysOfWeek.includes(day));
                  return (
                    <th
                      key={day}
                      className="py-3.5 px-3 text-xs font-semibold text-zinc-300 border-r border-white/5 last:border-r-0 min-w-[130px]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="tracking-wide uppercase text-[11px] text-zinc-400">{day}</span>
                        <span className="text-[10px] font-mono font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 px-1.5 py-0.2 rounded-full">
                          {daySchedules.length}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {displayedHours.map((hour) => (
                <tr key={hour} className="hover:bg-white/[0.015] transition-colors group">
                  {/* Time slot header */}
                  <td className="py-2.5 px-2 text-center text-xs font-mono text-zinc-600 bg-[#0a0a0a]/50 border-r border-white/5 select-none align-top">
                    {hour}
                  </td>

                  {/* Day cells */}
                  {displayedDays.map((day) => {
                    const slotSchedules = getSchedulesForSlot(day, hour);
                    const isStartingSlot = slotSchedules.filter(s => s.startTime === hour);
                    const hasConflict = slotSchedules.length > 1;

                    return (
                      <td
                        key={`${day}-${hour}`}
                        className={`py-1.5 px-1.5 border-r border-white/5 last:border-r-0 align-top relative ${
                          hasConflict ? 'bg-amber-500/[0.03]' : ''
                        }`}
                      >
                        {/* If no schedule at this hour, show subtle add button on hover */}
                        {slotSchedules.length === 0 && (
                          <div
                            onClick={() => onAddNewForSlot?.(day, hour)}
                            className="h-8 rounded-xl border border-dashed border-white/5 group-hover:border-white/10 hover:!border-teal-400/40 hover:bg-teal-500/10 flex items-center justify-center cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                            title={`Agendar aluno na ${day} às ${hour}`}
                          >
                            <Plus className="h-3.5 w-3.5 text-teal-400" />
                          </div>
                        )}

                        {/* Render class cards that start at this hour */}
                        <div className="space-y-1.5">
                          {isStartingSlot.map((schedule) => {
                            const modColor = getModalityColor(schedule.modalityId);

                            return (
                              <div
                                key={schedule.id}
                                onClick={() => onEditSchedule(schedule)}
                                className="group/card relative rounded-xl p-2.5 text-xs border border-white/5 hover:border-teal-500/30 transition-all cursor-pointer bg-[#121212] shadow-sm hover:shadow-[0_0_15px_rgba(20,184,166,0.1)]"
                                style={{
                                  borderLeftWidth: '3px',
                                  borderLeftColor: modColor,
                                }}
                              >
                                {/* Header: Student name & Modality */}
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-semibold text-white truncate" title={schedule.studentName}>
                                    {schedule.studentName}
                                  </span>
                                  {schedule.status !== 'ativo' && (
                                    <span className="px-1.5 py-0.2 rounded text-[9px] uppercase font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                      {schedule.status}
                                    </span>
                                  )}
                                </div>

                                {/* Modality Tag */}
                                <div className="flex items-center space-x-1.5 mt-1">
                                  <span
                                    className="px-1.5 py-0.2 rounded text-[10px] font-semibold text-white tracking-wide"
                                    style={{ backgroundColor: modColor }}
                                  >
                                    {schedule.modalityName}
                                  </span>
                                  <span className="text-[11px] font-mono text-zinc-500">
                                    {schedule.startTime} - {schedule.endTime}
                                  </span>
                                </div>

                                {/* Location or Room */}
                                {schedule.roomOrLocation && (
                                  <div className="flex items-center text-[11px] text-zinc-400 mt-1 truncate">
                                    <MapPin className="h-3 w-3 mr-1 text-zinc-500 shrink-0" />
                                    <span className="truncate">{schedule.roomOrLocation}</span>
                                  </div>
                                )}

                                {/* Card Actions (WhatsApp, Edit) */}
                                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-white/5">
                                  <span className="text-[10px] text-zinc-500 truncate font-mono">
                                    {schedule.plan}
                                  </span>
                                  
                                  <div className="flex items-center space-x-1">
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
                                        className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                        title="Enviar mensagem no WhatsApp"
                                      >
                                        <MessageCircle className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditSchedule(schedule);
                                      }}
                                      className="p-1 rounded-lg bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                                      title="Editar ficha"
                                    >
                                      <ChevronRight className="h-3 w-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
