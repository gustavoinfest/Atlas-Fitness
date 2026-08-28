import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  DollarSign, 
  FileText, 
  MapPin, 
  Layers,
  Save
} from 'lucide-react';
import { 
  Modality, 
  StudentClassSchedule, 
  DayOfWeek, 
  StudentStatus,
  ClientRecord,
  Professional
} from '../types';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (scheduleData: Omit<StudentClassSchedule, 'id' | 'attendanceHistory'>, existingId?: string) => void;
  modalities: Modality[];
  professionals?: Professional[];
  clients?: ClientRecord[];
  initialSchedule?: StudentClassSchedule | null;
  defaultModalityId?: string;
  defaultDay?: DayOfWeek;
  defaultTime?: string;
}

const ALL_DAYS: DayOfWeek[] = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  modalities,
  professionals = [],
  clients = [],
  initialSchedule,
  defaultModalityId,
  defaultDay,
  defaultTime,
}) => {
  const [studentName, setStudentName] = useState('');
  const [nameSuggestions, setNameSuggestions] = useState<ClientRecord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [modalityId, setModalityId] = useState(defaultModalityId || (modalities[0]?.id || ''));
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeek[]>(defaultDay ? [defaultDay] : ['Segunda', 'Quarta']);
  const [startTime, setStartTime] = useState(defaultTime || '08:00');
  const [durationMinutes, setDurationMinutes] = useState(50);
  const [endTime, setEndTime] = useState('08:50');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [professor, setProfessor] = useState('');
  const [status, setStatus] = useState<StudentStatus>('ativo');
  const [plan, setPlan] = useState('Mensal (2x/sem)');
  const [monthlyFee, setMonthlyFee] = useState<string>('300');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [roomOrLocation, setRoomOrLocation] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialSchedule) {
      setStudentName(initialSchedule.studentName);
      setModalityId(initialSchedule.modalityId);
      setDaysOfWeek(initialSchedule.daysOfWeek);
      setStartTime(initialSchedule.startTime);
      setDurationMinutes(initialSchedule.durationMinutes);
      setEndTime(initialSchedule.endTime);
      setPhone(initialSchedule.phone);
      setEmail(initialSchedule.email || '');
      setProfessor(initialSchedule.professor || '');
      setStatus(initialSchedule.status);
      setPlan(initialSchedule.plan);
      setMonthlyFee(initialSchedule.monthlyFee ? String(initialSchedule.monthlyFee) : '');
      setStartDate(initialSchedule.startDate || new Date().toISOString().split('T')[0]);
      setRoomOrLocation(initialSchedule.roomOrLocation || '');
      setNotes(initialSchedule.notes || '');
    } else {
      setStudentName('');
      setModalityId(defaultModalityId || (modalities[0]?.id || ''));
      setDaysOfWeek(defaultDay ? [defaultDay] : ['Segunda', 'Quarta']);
      setStartTime(defaultTime || '08:00');
      const selectedMod = modalities.find((m) => m.id === (defaultModalityId || modalities[0]?.id));
      const dur = selectedMod?.defaultDurationMinutes || 50;
      setDurationMinutes(dur);
      calculateAndSetEndTime(defaultTime || '08:00', dur);
      setPhone('');
      setEmail('');
      setProfessor('');
      setStatus('ativo');
      setPlan('Mensal (2x/sem)');
      setMonthlyFee('300');
      setStartDate(new Date().toISOString().split('T')[0]);
      setRoomOrLocation('');
      setNotes('');
    }
  }, [initialSchedule, isOpen, defaultModalityId, defaultDay, defaultTime]);

  const calculateAndSetEndTime = (start: string, duration: number) => {
    const [h, m] = start.split(':').map(Number);
    const totalMins = (h || 0) * 60 + (m || 0) + duration;
    const endH = Math.floor(totalMins / 60) % 24;
    const endM = totalMins % 60;
    const calculated = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
    setEndTime(calculated);
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    calculateAndSetEndTime(newStart, durationMinutes);
  };

  const handleDurationChange = (newDur: number) => {
    setDurationMinutes(newDur);
    calculateAndSetEndTime(startTime, newDur);
  };

  const toggleDay = (day: DayOfWeek) => {
    if (daysOfWeek.includes(day)) {
      if (daysOfWeek.length > 1) {
        setDaysOfWeek(daysOfWeek.filter((d) => d !== day));
      }
    } else {
      setDaysOfWeek([...daysOfWeek, day]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      alert('Por favor, informe o nome do aluno.');
      return;
    }
    if (daysOfWeek.length === 0) {
      alert('Selecione pelo menos um dia da semana.');
      return;
    }

    const selectedMod = modalities.find((m) => m.id === modalityId);

    onSave(
      {
        studentName: studentName.trim(),
        modalityId,
        modalityName: selectedMod ? selectedMod.sheetTabName : 'Geral',
        daysOfWeek,
        startTime,
        endTime,
        durationMinutes,
        phone: phone.trim(),
        email: email.trim(),
        professor: professor.trim(),
        status,
        plan: plan.trim() || 'Padrão',
        monthlyFee: monthlyFee ? Number(monthlyFee) : undefined,
        startDate,
        roomOrLocation: roomOrLocation.trim(),
        notes: notes.trim(),
      },
      initialSchedule?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d0d] rounded-3xl max-w-2xl w-full shadow-2xl border border-white/10 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#0a0a0a] text-white px-6 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center border border-teal-500/20">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialSchedule ? 'Editar Agendamento do Aluno' : 'Novo Aluno / Horário de Aula'}
              </h3>
              <p className="text-xs text-zinc-500">
                Configure a modalidade, dias de aula e detalhes do aluno
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          {/* Row 1: Student Name & Modality Tab */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1 flex items-center justify-between">
                <span>Nome do Aluno *</span>
                {clients.length > 0 && (
                  <span className="text-[10px] text-teal-400 font-mono font-normal">
                    {clients.length} cadastrados
                  </span>
                )}
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Mariana Silva ou Matrícula 13810"
                value={studentName}
                onChange={(e) => {
                  const val = e.target.value;
                  setStudentName(val);
                  if (val.trim().length > 1 && clients.length > 0) {
                    const term = val.toLowerCase();
                    const filtered = clients
                      .filter(
                        (c) =>
                          c.name.toLowerCase().includes(term) ||
                          c.id.toLowerCase().includes(term)
                      )
                      .slice(0, 6);
                    setNameSuggestions(filtered);
                    setShowSuggestions(filtered.length > 0);
                  } else {
                    setShowSuggestions(false);
                  }
                }}
                onFocus={() => {
                  if (studentName.trim().length > 1 && nameSuggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && nameSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-[#171717] border border-teal-500/30 rounded-xl shadow-2xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                  <div className="p-1.5 bg-[#1f1f1f] text-[10px] uppercase font-mono text-teal-400 font-bold px-3">
                    Sugestões do Cadastro de Alunos:
                  </div>
                  {nameSuggestions.map((client) => (
                    <div
                      key={client.id}
                      onClick={() => {
                        setStudentName(client.name);
                        if (client.phone && !phone) setPhone(client.phone);
                        if (client.email && !email) setEmail(client.email);
                        if (client.notes && !notes) {
                          setNotes(`Matrícula: #${client.id} • ${client.notes}`);
                        } else if (!notes) {
                          setNotes(`Matrícula: #${client.id}`);
                        }
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-teal-500/10 cursor-pointer border-b border-white/5 last:border-0 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{client.name}</span>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          Matrícula: #{client.id} {client.professor ? `• Prof: ${client.professor}` : ''}
                        </div>
                      </div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {client.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Aba / Modalidade *
              </label>
              <select
                value={modalityId}
                onChange={(e) => {
                  setModalityId(e.target.value);
                  const found = modalities.find((m) => m.id === e.target.value);
                  if (found) {
                    handleDurationChange(found.defaultDurationMinutes || 50);
                  }
                }}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {modalities.map((mod) => (
                  <option key={mod.id} value={mod.id} className="bg-[#121212] text-slate-200">
                    {mod.sheetTabName} ({mod.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Days of Week Selector */}
          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1.5">
              Dias da Semana de Aula *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
              {ALL_DAYS.map((day) => {
                const isSelected = daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-teal-500 text-black border-teal-500 font-bold shadow-md'
                        : 'bg-[#121212] text-zinc-400 border-white/5 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Schedule Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[#121212] p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Horário de Início *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Duração da Aula
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                className="w-full px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value={30} className="bg-[#121212]">30 minutos</option>
                <option value={45} className="bg-[#121212]">45 minutos</option>
                <option value={50} className="bg-[#121212]">50 minutos (Padrão)</option>
                <option value={60} className="bg-[#121212]">60 minutos (1 hora)</option>
                <option value={90} className="bg-[#121212]">90 minutos (1h 30m)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Horário de Término
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-[#0a0a0a] border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 4: Phone / WhatsApp & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Telefone / WhatsApp (com DDD)
              </label>
              <input
                type="tel"
                placeholder="Ex: 5511999998888"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                E-mail (opcional)
              </label>
              <input
                type="email"
                placeholder="aluno@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 5: Status, Professor, Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Status da Matrícula
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StudentStatus)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="ativo" className="bg-[#121212]">Ativo</option>
                <option value="pendente" className="bg-[#121212]">Pendente / Em teste</option>
                <option value="ferias" className="bg-[#121212]">Em Férias</option>
                <option value="trancado" className="bg-[#121212]">Trancado</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Professor Responsável
              </label>
              <select
                value={professor}
                onChange={(e) => setProfessor(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="" className="bg-[#121212]">Selecione um profissional...</option>
                {professionals.filter(p => p.role === 'Professor' || p.role === 'Personal').map(prof => (
                  <option key={prof.id} value={prof.name} className="bg-[#121212]">
                    {prof.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Valor Mensal (R$)
              </label>
              <input
                type="number"
                placeholder="Ex: 320"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 6: Location & Health Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Espaço / Sala / Aparelho
              </label>
              <input
                type="text"
                placeholder="Ex: Estúdio 1 - Reformer 2"
                value={roomOrLocation}
                onChange={(e) => setRoomOrLocation(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Data de Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>

          {/* Row 7: Observations */}
          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Observações, Restrições de Saúde ou Metas
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Hérnia de disco, gestante, foco em postura, objetivo emagrecimento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-black hover:bg-zinc-200 font-bold shadow-lg uppercase tracking-wider transition-all"
            >
              <Save className="h-4 w-4" />
              <span>{initialSchedule ? 'Salvar Alterações' : 'Cadastrar Aluno'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
