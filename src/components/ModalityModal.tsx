import React, { useState, useEffect } from 'react';
import { X, Layers, Palette, Clock, User, Sparkles, Save, Trash2 } from 'lucide-react';
import { Modality, Professional } from '../types';

interface ModalityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modalityData: Omit<Modality, 'id'>, existingId?: string) => void;
  onDelete?: (modalityId: string) => void;
  initialModality?: Modality | null;
  professionals?: Professional[];
}

const PRESET_COLORS = [
  '#0D9488', // Teal
  '#2563EB', // Blue
  '#0284C7', // Sky
  '#EA580C', // Orange
  '#7C3AED', // Purple
  '#DC2626', // Red
  '#059669', // Emerald
  '#D97706', // Amber
  '#EC4899', // Pink
  '#475569', // Slate
];

export const ModalityModal: React.FC<ModalityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialModality,
  professionals = [],
}) => {
  const [name, setName] = useState('');
  const [sheetTabName, setSheetTabName] = useState('');
  const [color, setColor] = useState('#0D9488');
  const [description, setDescription] = useState('');
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(50);
  const [instructorName, setInstructorName] = useState('');
  const [instructors, setInstructors] = useState<string[]>([]);
  const [maxStudentsPerSlot, setMaxStudentsPerSlot] = useState(3);

  useEffect(() => {
    if (initialModality) {
      setName(initialModality.name);
      setSheetTabName(initialModality.sheetTabName);
      setColor(initialModality.color);
      setDescription(initialModality.description || '');
      setDefaultDurationMinutes(initialModality.defaultDurationMinutes || 50);
      setInstructorName(initialModality.instructorName || '');
      setInstructors(initialModality.instructors || []);
      setMaxStudentsPerSlot(initialModality.maxStudentsPerSlot || 3);
    } else {
      setName('');
      setSheetTabName('');
      setColor('#0D9488');
      setDescription('');
      setDefaultDurationMinutes(50);
      setInstructorName('');
      setInstructors([]);
      setMaxStudentsPerSlot(3);
    }
  }, [initialModality, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialModality) {
      // Auto suggest sheet tab name
      setSheetTabName(val.slice(0, 30));
    }
  };

  const toggleInstructor = (profId: string) => {
    if (instructors.includes(profId)) {
      setInstructors(instructors.filter(id => id !== profId));
    } else {
      setInstructors([...instructors, profId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sheetTabName.trim()) {
      alert('Por favor, informe o nome da modalidade e o nome da aba da planilha.');
      return;
    }

    onSave(
      {
        name: name.trim(),
        sheetTabName: sheetTabName.trim(),
        color,
        iconName: 'Sparkles',
        description: description.trim(),
        defaultDurationMinutes,
        instructorName: instructorName.trim(),
        instructors,
        maxStudentsPerSlot,
      },
      initialModality?.id
    );

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0d0d0d] rounded-3xl max-w-lg w-full shadow-2xl border border-white/10 overflow-hidden my-8">
        
        {/* Modal Header */}
        <div className="bg-[#0a0a0a] text-white px-6 py-5 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center space-x-3">
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg"
              style={{ backgroundColor: color }}
            >
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialModality ? 'Editar Aba de Modalidade' : 'Criar Nova Aba de Modalidade'}
              </h3>
              <p className="text-xs text-zinc-500">
                Gera uma nova aba correspondente na planilha
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Nome da Modalidade *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Beach Tennis, Pilates Clínico, Dança de Salão..."
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Nome da Aba na Planilha (Google Sheets / Excel) *
            </label>
            <input
              type="text"
              required
              maxLength={31}
              placeholder="Ex: Beach Tennis"
              value={sheetTabName}
              onChange={(e) => setSheetTabName(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-mono"
            />
            <span className="text-[11px] text-zinc-500 mt-1 block">
              Máximo 31 caracteres (limite do formato de abas de planilhas).
            </span>
          </div>

          {/* Color Picker */}
          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center space-x-1">
              <Palette className="h-3.5 w-3.5 text-zinc-400" />
              <span>Cor de Identificação da Aba</span>
            </label>
            <div className="flex items-center space-x-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full transition-transform ${
                    color === c ? 'scale-115 ring-2 ring-white ring-offset-2 ring-offset-black' : 'hover:scale-105 opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-7 w-7 rounded-lg cursor-pointer border border-white/10 p-0 bg-transparent"
                title="Personalizar cor"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Duração Padrão das Aulas (minutos)
              </label>
              <select
                value={defaultDurationMinutes}
                onChange={(e) => setDefaultDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 focus:ring-teal-500"
              >
                <option value={30} className="bg-[#121212]">30 minutos</option>
                <option value={45} className="bg-[#121212]">45 minutos</option>
                <option value={50} className="bg-[#121212]">50 minutos</option>
                <option value={60} className="bg-[#121212]">60 minutos (1h)</option>
                <option value={90} className="bg-[#121212]">90 minutos (1h30)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
                Capacidade por Horário (Alunos)
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={maxStudentsPerSlot}
                onChange={(e) => setMaxStudentsPerSlot(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 font-mono focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-2">
              Professores Disponíveis para esta Modalidade
            </label>
            <div className="bg-[#121212] border border-white/10 rounded-xl p-3 grid grid-cols-2 gap-2">
              {professionals.filter(p => p.role === 'Professor' || p.role === 'Personal').length === 0 ? (
                <p className="text-xs text-zinc-500 col-span-2">Nenhum professor cadastrado. Vá em "Equipe" para adicionar.</p>
              ) : (
                professionals.filter(p => p.role === 'Professor' || p.role === 'Personal').map(prof => (
                  <label key={prof.id} className="flex items-center space-x-2 cursor-pointer p-2 rounded hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      checked={instructors.includes(prof.id)}
                      onChange={() => toggleInstructor(prof.id)}
                      className="rounded border-white/20 bg-black text-teal-500 focus:ring-teal-500/20"
                    />
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-4 h-4 rounded-full flex-shrink-0"
                        style={{ backgroundColor: prof.color || '#3B82F6' }}
                      />
                      <span className="text-xs text-zinc-300 truncate">{prof.name}</span>
                    </div>
                  </label>
                ))
              )}
            </div>
            {/* Fallback field just in case */}
            <div className="mt-2">
               <input
                type="text"
                placeholder="Ou digite o nome (antigo)..."
                value={instructorName}
                onChange={(e) => setInstructorName(e.target.value)}
                className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-[10px] text-slate-400 placeholder:text-zinc-600 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-zinc-400 uppercase tracking-wider text-[10px] mb-1">
              Descrição ou Regras da Modalidade
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Utiliza equipamentos específicos, limite de 3 alunos simultâneos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-[#121212] border border-white/10 rounded-xl text-xs text-slate-200 placeholder:text-zinc-600 focus:ring-teal-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            {initialModality && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Excluir a aba "${initialModality.sheetTabName}" e suas configurações?`)) {
                    onDelete(initialModality.id);
                    onClose();
                  }
                }}
                className="flex items-center space-x-1.5 text-rose-400/80 hover:text-rose-400 font-semibold text-xs px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Excluir Aba</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-3">
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
                <span>{initialModality ? 'Salvar Aba' : 'Criar Aba'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
