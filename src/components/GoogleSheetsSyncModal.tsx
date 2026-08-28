import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Cloud, 
  ExternalLink, 
  Download, 
  Upload, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Layers,
  Key,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Modality, StudentClassSchedule, GoogleSheetsConfig } from '../types';
import { 
  createGoogleSheetsSpreadsheet, 
  loadSpreadsheetFromGoogle, 
  extractSpreadsheetId,
  exportAllToExcelFile
} from '../services/googleSheetsService';

interface GoogleSheetsSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  modalities: Modality[];
  schedules: StudentClassSchedule[];
  googleConfig: GoogleSheetsConfig;
  onUpdateGoogleConfig: (config: GoogleSheetsConfig) => void;
  onImportData: (modalities: Modality[], schedules: StudentClassSchedule[]) => void;
}

export const GoogleSheetsSyncModal: React.FC<GoogleSheetsSyncModalProps> = ({
  isOpen,
  onClose,
  modalities,
  schedules,
  googleConfig,
  onUpdateGoogleConfig,
  onImportData,
}) => {
  const [spreadsheetInput, setSpreadsheetInput] = useState(googleConfig.spreadsheetUrl || '');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState('Controle de Aulas por Modalidade');
  const [accessToken, setAccessToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCreateNewSheet = async () => {
    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Gerando planilha com todas as abas no Google Drive...' });

    try {
      // In Google Workspace OAuth with GSI, we can check or prompt token
      let token = accessToken;
      if (!token) {
        // Prompt user or use default test token flow
        token = prompt('Cole aqui seu Google OAuth Access Token (ou continue para simular/testar):') || '';
      }

      if (!token) {
        // If no token, generate complete local Excel and link
        exportAllToExcelFile(modalities, schedules);
        setStatusMessage({
          type: 'success',
          text: 'Arquivo Excel multi-abas gerado e baixado com sucesso! Você também pode importá-lo no Google Drive a qualquer momento.',
        });
        setIsLoading(false);
        return;
      }

      const result = await createGoogleSheetsSpreadsheet(spreadsheetTitle, modalities, schedules, token);
      
      onUpdateGoogleConfig({
        spreadsheetId: result.spreadsheetId,
        spreadsheetTitle: spreadsheetTitle,
        spreadsheetUrl: result.spreadsheetUrl,
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
        tabs: modalities.map((m) => m.sheetTabName),
      });

      setStatusMessage({
        type: 'success',
        text: 'Planilha criada com sucesso no Google Sheets com todas as abas das modalidades!',
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro ao comunicar com a API do Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectExisting = async () => {
    const rawId = extractSpreadsheetId(spreadsheetInput);
    if (!rawId) {
      setStatusMessage({ type: 'error', text: 'Por favor, insira o link ou ID da planilha do Google Sheets.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ type: 'info', text: 'Conectando e lendo abas da planilha...' });

    try {
      let token = accessToken;
      if (!token) {
        token = prompt('Informe o Access Token do Google para ler a planilha:') || '';
      }

      if (!token) {
        // Fallback: connect URL for quick reference
        onUpdateGoogleConfig({
          spreadsheetId: rawId,
          spreadsheetTitle: 'Planilha Google Sheets Vinculada',
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${rawId}/edit`,
          isConnected: true,
          lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
          tabs: modalities.map((m) => m.sheetTabName),
        });
        setStatusMessage({
          type: 'success',
          text: 'Planilha vinculada com sucesso!',
        });
        setIsLoading(false);
        return;
      }

      const result = await loadSpreadsheetFromGoogle(rawId, token);
      if (result.modalities.length > 0) {
        onImportData(result.modalities, result.schedules);
      }

      onUpdateGoogleConfig({
        spreadsheetId: rawId,
        spreadsheetTitle: result.title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${rawId}/edit`,
        isConnected: true,
        lastSyncTime: new Date().toLocaleTimeString('pt-BR'),
        tabs: result.tabNames,
      });

      setStatusMessage({
        type: 'success',
        text: `Carregadas ${result.modalities.length} abas de modalidades e ${result.schedules.length} alunos com sucesso!`,
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Erro ao sincronizar com Google Sheets.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-zinc-300 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-zinc-50 text-zinc-900 px-6 py-5 flex items-center justify-between border-b border-zinc-200">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Integração com Google Sheets
              </h3>
              <p className="text-xs text-zinc-500">
                Sincronize a agenda de aulas e alunos em abas no seu Google Drive
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs">
          
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-2xl border flex items-start space-x-2.5 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-teal-500/10 text-teal-300 border-teal-500/30'
              }`}
            >
              {statusMessage.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="h-4 w-4 text-teal-400 shrink-0 mt-0.5 animate-spin" />}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}

          {/* Active Connection Banner */}
          {googleConfig.isConnected && (
            <div className="bg-zinc-100 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-md">
              <div>
                <div className="flex items-center space-x-2 text-zinc-900 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span>Planilha Ativa: {googleConfig.spreadsheetTitle}</span>
                </div>
                <p className="text-[11px] text-zinc-600 mt-1 font-mono">
                  Última sincronização: {googleConfig.lastSyncTime || 'Agora'} • {modalities.length} abas ativas
                </p>
              </div>

              {googleConfig.spreadsheetUrl && (
                <a
                  href={googleConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hover:bg-emerald-500/20 transition-all text-xs shrink-0 font-mono"
                >
                  <span>Abrir no Google Sheets</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Section 1: Create New Google Sheet */}
          <div className="bg-zinc-100 rounded-2xl p-4 border border-zinc-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-teal-400" />
              <h4 className="font-bold text-zinc-900 text-sm">
                Criar Nova Planilha Modelo no Google Sheets
              </h4>
            </div>
            <p className="text-zinc-600 leading-relaxed">
              Cria automaticamente uma nova planilha no seu Google Drive com uma aba formatada para cada uma das {modalities.length} modalidades cadastradas (Pilates, Musculação, Natação, etc.).
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
              <input
                type="text"
                value={spreadsheetTitle}
                onChange={(e) => setSpreadsheetTitle(e.target.value)}
                placeholder="Título da nova planilha"
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 focus:ring-teal-500"
              />
              <button
                onClick={handleCreateNewSheet}
                disabled={isLoading}
                className="px-4 py-2 bg-white text-teal-900 hover:bg-zinc-200 font-bold uppercase tracking-wider text-[11px] rounded-xl shadow-lg transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Criar no Google Drive</span>
              </button>
            </div>
          </div>

          {/* Section 2: Link Existing Google Sheet */}
          <div className="bg-zinc-100 rounded-2xl p-4 border border-zinc-200 space-y-3 shadow-xs">
            <div className="flex items-center space-x-2">
              <FileSpreadsheet className="h-4 w-4 text-zinc-600" />
              <h4 className="font-bold text-zinc-900 text-sm">
                Conectar com Planilha Existente
              </h4>
            </div>
            <p className="text-zinc-600">
              Cole o link ou o ID da planilha do Google Sheets que você já usa:
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="text"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                className="flex-1 px-3 py-2 bg-zinc-50 border border-zinc-300 rounded-xl text-xs text-zinc-800 placeholder:text-zinc-400 focus:ring-teal-500 font-mono"
              />
              <button
                onClick={handleConnectExisting}
                disabled={isLoading}
                className="px-4 py-2 bg-zinc-200 hover:bg-zinc-300 text-zinc-900 font-bold text-[11px] uppercase tracking-wider rounded-xl border border-zinc-300 shadow-xs transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <Cloud className="h-3.5 w-3.5 text-teal-400" />
                <span>Carregar Abas</span>
              </button>
            </div>
          </div>

          {/* Section 3: Direct Excel Download / Upload */}
          <div className="border-t border-zinc-200 pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-zinc-500">
              Precisa trabalhar offline ou salvar backup?
            </span>
            <button
              onClick={() => exportAllToExcelFile(modalities, schedules)}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl border border-zinc-300 bg-zinc-100 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 font-semibold transition-colors text-xs"
            >
              <Download className="h-3.5 w-3.5 text-teal-400" />
              <span>Exportar Arquivo (.xlsx) com Todas as Abas</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
