import React, { useRef } from 'react';
import { 
  CalendarDays, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Cloud, 
  CheckCircle2, 
  Users, 
  Layers,
  Sparkles
} from 'lucide-react';
import { Modality, StudentClassSchedule, GoogleSheetsConfig } from '../types';
import { exportAllToExcelFile, parseExcelFile } from '../services/googleSheetsService';

interface HeaderProps {
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  googleConfig: GoogleSheetsConfig;
  onOpenGoogleSync: () => void;
  onOpenNewStudentModal: () => void;
  onOpenNewModalityModal: () => void;
  onOpenImportModal: () => void;
  onImportData: (modalities: Modality[], schedules: StudentClassSchedule[]) => void;
}

export const Header: React.FC<HeaderProps> = ({
  modalities,
  schedules,
  googleConfig,
  onOpenGoogleSync,
  onOpenNewStudentModal,
  onOpenNewModalityModal,
  onOpenImportModal,
  onImportData,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeStudentsCount = schedules.filter((s) => s.status === 'ativo').length;
  const totalWeeklyClasses = schedules.reduce((acc, curr) => acc + (curr.status === 'ativo' ? curr.daysOfWeek.length : 0), 0);

  const handleExport = () => {
    exportAllToExcelFile(modalities, schedules);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await parseExcelFile(file);
      if (imported.modalities.length > 0) {
        onImportData(imported.modalities, imported.schedules);
      }
    } catch (err: any) {
      alert(`Erro ao ler arquivo: ${err.message || 'Formato não reconhecido.'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header id="main-header" className="bg-[#0a0a0a] text-white border-b border-white/5 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Title and Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center font-bold text-black text-lg shadow-[0_0_15px_rgba(20,184,166,0.3)] shrink-0">
              <CalendarDays className="h-5 w-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-widest text-white uppercase">
                  CONTROLE DE AULAS
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 tracking-wider">
                  POR MODALIDADE
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 font-medium tracking-tight mt-0.5">
                Organize a agenda por abas de modalidades integrada ao Google Sheets
              </p>
            </div>
          </div>

          {/* Quick Stats Pill Counters */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center space-x-2 bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
              <span className="text-zinc-500">Abas:</span>
              <span className="font-semibold text-white">{modalities.length}</span>
            </div>

            <div className="flex items-center space-x-2 bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]"></div>
              <span className="text-zinc-500">Alunos Ativos:</span>
              <span className="font-semibold text-white">{activeStudentsCount}</span>
            </div>

            <div className="flex items-center space-x-2 bg-[#121212] px-3 py-1.5 rounded-xl border border-white/5">
              <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"></div>
              <span className="text-zinc-500">Aulas/Sem:</span>
              <span className="font-semibold text-white">{totalWeeklyClasses}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Hidden file input for Excel upload */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls, .csv"
              className="hidden"
            />

            {/* Google Sheets Sync Button */}
            <button
              id="btn-google-sync"
              onClick={onOpenGoogleSync}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-medium border transition-all ${
                googleConfig.isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300'
              }`}
              title="Configurar integração com Google Sheets"
            >
              <Cloud className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                {googleConfig.isConnected ? 'Google Sheets Ativo' : 'Google Sheets'}
              </span>
              {googleConfig.isConnected && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              )}
            </button>

            {/* Export .xlsx */}
            <button
              id="btn-export-excel"
              onClick={handleExport}
              className="flex items-center space-x-1.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 px-3.5 py-2 rounded-lg text-xs font-medium transition-all"
              title="Baixar planilha Excel com uma aba por modalidade"
            >
              <Download className="h-3.5 w-3.5 text-zinc-400" />
              <span>Exportar (.xlsx)</span>
            </button>

            {/* Universal Import Button */}
            <button
              id="btn-import-excel"
              onClick={onOpenImportModal}
              className="flex items-center space-x-1.5 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shadow-[0_0_12px_rgba(20,184,166,0.1)]"
              title="Importar arquivos Excel (.xlsx), CSV, TXT ou colar dados"
            >
              <Upload className="h-3.5 w-3.5 text-teal-400" />
              <span>Importar Arquivos</span>
            </button>

            {/* New Student / Class Button */}
            <button
              id="btn-new-student"
              onClick={onOpenNewStudentModal}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-white text-black text-xs font-bold hover:bg-zinc-200 transition-all shadow-xl uppercase tracking-widest active:scale-95"
            >
              <Plus className="h-4 w-4" />
              <span>Agendar Aluno</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
