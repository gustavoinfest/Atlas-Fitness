import React, { useState } from 'react';
import { X, Download, Filter } from 'lucide-react';
import { Modality, StudentClassSchedule } from '../types';
import { exportAllToExcelFile } from '../services/googleSheetsService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalities: Modality[];
  schedules: StudentClassSchedule[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  modalities,
  schedules,
}) => {
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');

  if (!isOpen) return null;

  const handleExport = () => {
    let filteredModalities = modalities;
    let filteredSchedules = schedules;

    if (modalityFilter !== 'all') {
      filteredModalities = modalities.filter((m) => m.id === modalityFilter);
      filteredSchedules = schedules.filter((s) => s.modalityId === modalityFilter);
    }

    if (dayFilter !== 'all') {
      filteredSchedules = filteredSchedules.filter((s) =>
        s.daysOfWeek.includes(dayFilter as any)
      );
    }

    exportAllToExcelFile(filteredModalities, filteredSchedules);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#18181B] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-teal-500/20 flex items-center justify-center border border-teal-500/30">
              <Download className="h-4 w-4 text-teal-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Exportar Dados</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              Selecione os filtros abaixo para exportar apenas os dados que você precisa para uma planilha Excel.
            </p>

            <div className="space-y-4 bg-[#121212] p-4 rounded-xl border border-white/5">
              <div className="flex items-center space-x-2 mb-2 text-zinc-300">
                <Filter className="h-4 w-4" />
                <span className="text-sm font-semibold">Filtros de Exportação</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Modalidade / Aba
                </label>
                <select
                  value={modalityFilter}
                  onChange={(e) => setModalityFilter(e.target.value)}
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">Todas as Modalidades</option>
                  {modalities.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  Dia da Semana
                </label>
                <select
                  value={dayFilter}
                  onChange={(e) => setDayFilter(e.target.value)}
                  className="w-full bg-[#171717] border border-white/10 rounded-xl px-3 py-2 text-zinc-200 text-sm focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="all">Todos os Dias</option>
                  <option value="Segunda">Segunda</option>
                  <option value="Terça">Terça</option>
                  <option value="Quarta">Quarta</option>
                  <option value="Quinta">Quinta</option>
                  <option value="Sexta">Sexta</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleExport}
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-black text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(20,184,166,0.2)] flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Gerar Planilha</span>
          </button>
        </div>
      </div>
    </div>
  );
};
