import React from 'react';
import { 
  Calendar, 
  FolderKanban, 
  Users, 
  CheckSquare, 
  AlertTriangle, 
  FileSpreadsheet 
} from 'lucide-react';
import { ViewMode } from '../types';

interface NavigationTabsProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  conflictCount: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentView,
  onViewChange,
  conflictCount,
}) => {
  const navItems = [
    {
      id: 'agenda' as ViewMode,
      label: 'Grade Horária Semanal',
      icon: Calendar,
      description: 'Visão geral da agenda semanal',
    },
    {
      id: 'tabs' as ViewMode,
      label: 'Abas por Modalidade',
      icon: FolderKanban,
      description: 'Visualizar como planilhas separadas',
    },
    {
      id: 'students' as ViewMode,
      label: 'Alunos & Matrículas',
      icon: Users,
      description: 'Cadastro geral e fichas',
    },
    {
      id: 'attendance' as ViewMode,
      label: 'Chamada & Presença',
      icon: CheckSquare,
      description: 'Controle diário de presenças',
    },
    {
      id: 'conflicts' as ViewMode,
      label: 'Conflitos de Horário',
      icon: AlertTriangle,
      description: 'Detecção de sobreposições',
      badge: conflictCount > 0 ? conflictCount : undefined,
    },
    {
      id: 'equipe' as ViewMode,
      label: 'Equipe & Profissionais',
      icon: Users,
      description: 'Gerenciar professores',
    },
    {
      id: 'sheets_sync' as ViewMode,
      label: 'Google Sheets',
      icon: FileSpreadsheet,
      description: 'Sincronizar abas com nuvem',
    },
  ];

  return (
    <div className="bg-[#0d0d0d] border-b border-white/5 sticky top-[69px] z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2 scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`tab-nav-${item.id}`}
                onClick={() => onViewChange(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                  isActive
                    ? 'text-teal-400 bg-teal-500/10 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.1)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isActive ? 'text-teal-400' : 'text-zinc-500'
                  }`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
