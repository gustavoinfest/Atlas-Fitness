import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Clipboard, 
  Layers, 
  Users, 
  Sparkles,
  ArrowRight,
  Database,
  Calendar,
  Check
} from 'lucide-react';
import { ClientRecord, Modality, StudentClassSchedule } from '../types';
import { parseAnyFile, parseRawPastedText, FileParseResult } from '../services/universalFileService';

interface UniversalImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportClients: (newClients: ClientRecord[], mode: 'merge' | 'replace') => void;
  onImportSchedules: (modalities: Modality[], schedules: StudentClassSchedule[], mode: 'merge' | 'replace') => void;
  onRestoreBackup: (backupData: any) => void;
}

export const UniversalImportModal: React.FC<UniversalImportModalProps> = ({
  isOpen,
  onClose,
  onImportClients,
  onImportSchedules,
  onRestoreBackup,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parseResult, setParseResult] = useState<FileParseResult | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [importTarget, setImportTarget] = useState<'clients' | 'schedules' | 'both'>('clients');
  const [importStrategy, setImportStrategy] = useState<'merge' | 'replace'>('merge');
  const [scheduleModalityFilter, setScheduleModalityFilter] = useState<string>('all');
  const [scheduleDayFilter, setScheduleDayFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const result = await parseAnyFile(file);
      setParseResult(result);
      if (result.hasClientData && !result.hasScheduleData) {
        setImportTarget('clients');
      } else if (!result.hasClientData && result.hasScheduleData) {
        setImportTarget('schedules');
      } else {
        setImportTarget('clients');
      }
    } catch (err: any) {
      setErrorMessage(`Erro ao processar arquivo: ${err.message || 'Formato não suportado'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handlePasteProcess = () => {
    if (!pastedText.trim()) {
      setErrorMessage('Por favor, cole algum texto ou tabela primeiro.');
      return;
    }
    setErrorMessage(null);
    const result = parseRawPastedText(pastedText, 'Dados Colados');
    setParseResult(result);
    if (result.hasClientData) {
      setImportTarget('clients');
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    if (parseResult.isSystemBackup && parseResult.backupData) {
      onRestoreBackup(parseResult.backupData);
      setSuccessMessage('Backup restaurado com sucesso! Todos os dados foram atualizados.');
      setTimeout(() => {
        onClose();
        setParseResult(null);
        setPastedText('');
        setSuccessMessage(null);
      }, 1500);
      return;
    }

    let importedClientsCount = 0;
    let importedSchedulesCount = 0;

    if (importTarget === 'clients' || importTarget === 'both') {
      if (parseResult.detectedClients.length > 0) {
        onImportClients(parseResult.detectedClients, importStrategy);
        importedClientsCount = parseResult.detectedClients.length;
      }
    }

    if (importTarget === 'schedules' || importTarget === 'both') {
      let filteredSchedules = parseResult.detectedSchedules.schedules;
      let filteredModalities = parseResult.detectedSchedules.modalities;

      if (scheduleModalityFilter !== 'all') {
        filteredSchedules = filteredSchedules.filter(s => s.modalityId === scheduleModalityFilter);
        filteredModalities = filteredModalities.filter(m => m.id === scheduleModalityFilter);
      }

      if (scheduleDayFilter !== 'all') {
        filteredSchedules = filteredSchedules.filter(s => s.daysOfWeek.includes(scheduleDayFilter as any));
      }

      if (filteredSchedules.length > 0) {
        onImportSchedules(
          filteredModalities,
          filteredSchedules,
          importStrategy
        );
        importedSchedulesCount = filteredSchedules.length;
      }
    }

    setSuccessMessage(
      `Importação concluída com sucesso! ${
        importedClientsCount > 0 ? `${importedClientsCount} alunos salvos no cadastro geral. ` : ''
      }${importedSchedulesCount > 0 ? `${importedSchedulesCount} aulas agendadas.` : ''}`
    );

    setTimeout(() => {
      onClose();
      setParseResult(null);
      setPastedText('');
      setSuccessMessage(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0d0d0d] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#121212]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Leitor e Importador Universal de Arquivos</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-mono">
                  Excel, CSV, TSV, TXT, JSON
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Importe planilhas de alunos, listas de clientes do sistema ou dados copiados da área de transferência
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

        {/* Modal Tabs: File Upload vs Direct Text Paste */}
        <div className="px-6 pt-3 flex space-x-4 border-b border-white/5 bg-[#0f0f0f]">
          <button
            onClick={() => {
              setActiveTab('upload');
              setParseResult(null);
            }}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'upload'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Arquivo (.xlsx, .xls, .csv, .txt, .json)</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('paste');
              setParseResult(null);
            }}
            className={`pb-2.5 text-xs font-semibold uppercase tracking-wider flex items-center space-x-2 border-b-2 transition-all ${
              activeTab === 'paste'
                ? 'border-teal-400 text-teal-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Clipboard className="h-4 w-4" />
            <span>Colar Texto / Tabela Direta</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Alerts */}
          {errorMessage && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-rose-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-center space-x-3 text-xs text-emerald-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Tab 1: File Upload / Drag & Drop */}
          {activeTab === 'upload' && !parseResult && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
                isDragging
                  ? 'border-teal-400 bg-teal-500/10'
                  : 'border-white/10 hover:border-teal-500/40 bg-[#121212]/50 hover:bg-[#121212]'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".xlsx, .xls, .csv, .tsv, .txt, .json"
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-3 shadow-[0_0_20px_rgba(20,184,166,0.15)]">
                <Upload className="h-6 w-6 animate-pulse" />
              </div>

              <h3 className="text-sm font-bold text-white mb-1">
                Arraste qualquer arquivo aqui ou clique para selecionar
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mb-4">
                Suporta planilhas Excel (.xlsx, .xls), arquivos CSV delimitados por ponto e vírgula ou vírgula, arquivos de texto (.txt, .tsv) e backups JSON.
              </p>

              <div className="flex items-center space-x-2 text-[11px] text-zinc-500 font-mono">
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Auto-correção de acentos UTF-8</span>
                <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">Reconhecimento de Colunas</span>
              </div>
            </div>
          )}

          {/* Tab 2: Direct Copy & Paste Area */}
          {activeTab === 'paste' && !parseResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-zinc-300">
                  Cole os dados copiados do Excel, bloco de notas ou sistema:
                </label>
                <span className="text-zinc-500 text-[11px]">
                  Ex: Clientes;Id Cliente;Professor;Consultor;Status...
                </span>
              </div>

              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Clientes;Id Cliente;Professor;Consultor;Personal;Status...&#10;MARIA SILVA;13810;RENATO;TAYNARA;;Ativo"
                rows={7}
                className="w-full bg-[#121212] border border-white/10 rounded-xl p-3 text-xs text-slate-200 font-mono focus:ring-teal-500 focus:border-teal-500 placeholder:text-zinc-700"
              />

              <div className="flex justify-end">
                <button
                  onClick={handlePasteProcess}
                  disabled={!pastedText.trim()}
                  className="flex items-center space-x-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-black px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg uppercase tracking-wider"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Analisar e Pré-visualizar</span>
                </button>
              </div>
            </div>
          )}

          {/* Preview & Import Options (When a file or text is parsed) */}
          {parseResult && (
            <div className="space-y-4">
              
              {/* Summary Stats Banner */}
              <div className="bg-[#121212] border border-white/5 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{parseResult.fileName}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                      {parseResult.fileType}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">
                    Detectadas <strong>{parseResult.totalRows} linhas/registros</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setParseResult(null)}
                  className="text-xs text-zinc-400 hover:text-white underline underline-offset-4"
                >
                  Trocar arquivo
                </button>
              </div>

              {parseResult.isSystemBackup ? (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5 text-center">
                  <Database className="h-10 w-10 text-indigo-400 mx-auto mb-3 opacity-80" />
                  <h3 className="text-sm font-bold text-white mb-2">Backup do Sistema Identificado</h3>
                  <p className="text-xs text-indigo-200 max-w-sm mx-auto">
                    Este arquivo contém um backup completo do sistema. Ao prosseguir, <strong>todas</strong> as modalidades, agendamentos e lista de clientes atuais serão substituídos pelos dados deste backup.
                  </p>
                </div>
              ) : (
                <>
                  {/* Import Destination Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setImportTarget('clients')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        importTarget === 'clients'
                          ? 'bg-teal-500/10 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                          : 'bg-[#121212] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Users className={`h-4 w-4 ${importTarget === 'clients' ? 'text-teal-400' : 'text-zinc-400'}`} />
                          <span className="text-xs font-bold text-white">Cadastro Geral de Alunos</span>
                        </div>
                        {importTarget === 'clients' && <Check className="h-4 w-4 text-teal-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Importa como lista de clientes ({parseResult.detectedClients.length} alunos detectados).
                      </p>
                    </div>

                    <div
                      onClick={() => setImportTarget('schedules')}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        importTarget === 'schedules'
                          ? 'bg-teal-500/10 border-teal-500/40 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                          : 'bg-[#121212] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Calendar className={`h-4 w-4 ${importTarget === 'schedules' ? 'text-teal-400' : 'text-zinc-400'}`} />
                          <span className="text-xs font-bold text-white">Agenda & Horários</span>
                        </div>
                        {importTarget === 'schedules' && <Check className="h-4 w-4 text-teal-400" />}
                      </div>
                      <p className="text-[11px] text-zinc-400">
                        Importa diretamente nas abas de modalidade e na grade de horários.
                      </p>
                    </div>
                  </div>

                  {/* Merge vs Replace Toggle */}
                  <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Modo de sincronização:</span>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => setImportStrategy('merge')}
                        className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                          importStrategy === 'merge'
                            ? 'bg-white text-black font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Mesclar / Adicionar Novos
                      </button>
                      <button
                        type="button"
                        onClick={() => setImportStrategy('replace')}
                        className={`px-3 py-1 rounded-lg font-medium text-xs transition-colors ${
                          importStrategy === 'replace'
                            ? 'bg-rose-500 text-white font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Substituir Existentes
                      </button>
                    </div>
                  </div>

                  {/* Schedule Filters (Only show if importing schedules) */}
                  {importTarget === 'schedules' && parseResult.detectedSchedules.modalities.length > 0 && (
                    <div className="bg-[#121212] p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                      <span className="text-zinc-300 font-medium">Filtrar importação:</span>
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <select
                          value={scheduleModalityFilter}
                          onChange={(e) => setScheduleModalityFilter(e.target.value)}
                          className="w-full sm:w-auto bg-[#171717] border border-white/10 rounded-lg px-2 py-1.5 text-zinc-300 text-xs focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="all">Todas as Modalidades</option>
                          {parseResult.detectedSchedules.modalities.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>

                        <select
                          value={scheduleDayFilter}
                          onChange={(e) => setScheduleDayFilter(e.target.value)}
                          className="w-full sm:w-auto bg-[#171717] border border-white/10 rounded-lg px-2 py-1.5 text-zinc-300 text-xs focus:ring-teal-500 focus:border-teal-500"
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
                  )}

                  {/* Data Table Preview */}
                  <div>
                    <h4 className="text-xs font-bold text-zinc-300 mb-2 flex items-center justify-between">
                      <span>Pré-visualização dos primeiros registros ({parseResult.sampleData.length} de {parseResult.totalRows}):</span>
                      <span className="text-[11px] text-zinc-500 font-normal">Colunas identificadas: {parseResult.columns.join(', ')}</span>
                    </h4>

                    <div className="bg-[#121212] rounded-xl border border-white/5 overflow-x-auto max-h-48 scrollbar-none">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#171717] border-b border-white/5 text-[10px] uppercase font-mono text-zinc-400 sticky top-0">
                          <tr>
                            {parseResult.columns.slice(0, 7).map((col, idx) => (
                              <th key={idx} className="p-2.5 whitespace-nowrap">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-mono text-[11px] text-zinc-300">
                          {parseResult.sampleData.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/5">
                              {parseResult.columns.slice(0, 7).map((col, cIdx) => (
                                <td key={cIdx} className="p-2.5 whitespace-nowrap max-w-xs truncate">
                                  {String(row[col] || '-')}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-white/5 bg-[#121212] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>

          {parseResult && (
            <button
              onClick={handleConfirmImport}
              className="flex items-center space-x-2 bg-white text-black hover:bg-zinc-200 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xl uppercase tracking-wider active:scale-95"
            >
              <span>Confirmar e Importar</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
