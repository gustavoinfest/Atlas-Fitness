import React, { useState } from 'react';
import { Professional } from '../types';
import { Plus, Edit2, Trash2, Shield, User, GraduationCap, X, Check } from 'lucide-react';

interface ProfessionalsManagerProps {
  professionals: Professional[];
  setProfessionals: React.Dispatch<React.SetStateAction<Professional[]>>;
}

export const ProfessionalsManager: React.FC<ProfessionalsManagerProps> = ({
  professionals,
  setProfessionals,
}) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'Professor' | 'Consultor' | 'Personal' | 'Atendente'>('Professor');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [editActive, setEditActive] = useState(true);

  const colors = [
    '#3B82F6', '#10B981', '#A855F7', '#F59E0B', '#EF4444', 
    '#06B6D4', '#EC4899', '#8B5CF6', '#F97316', '#64748B'
  ];

  const handleEdit = (prof: Professional) => {
    setIsEditing(prof.id);
    setEditName(prof.name);
    setEditRole(prof.role);
    setEditColor(prof.color || '#3B82F6');
    setEditActive(prof.active);
  };

  const handleSave = () => {
    if (!editName.trim()) return;

    if (isEditing === 'new') {
      const newProf: Professional = {
        id: `prof-${Date.now()}`,
        name: editName.trim(),
        role: editRole,
        color: editColor,
        active: editActive,
      };
      setProfessionals([...professionals, newProf]);
    } else {
      setProfessionals(professionals.map(p => 
        p.id === isEditing 
          ? { ...p, name: editName.trim(), role: editRole, color: editColor, active: editActive }
          : p
      ));
    }
    setIsEditing(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja remover este profissional?')) {
      setProfessionals(professionals.filter(p => p.id !== id));
    }
  };

  const handleAddNew = () => {
    setIsEditing('new');
    setEditName('');
    setEditRole('Professor');
    setEditColor('#3B82F6');
    setEditActive(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Equipe & Profissionais</h2>
          <p className="text-zinc-600 mt-1">Gerencie os professores, consultores e atendentes do sistema.</p>
        </div>
        <button
          onClick={handleAddNew}
          disabled={isEditing !== null}
          className="bg-teal-500 hover:bg-teal-400 text-teal-900 px-4 py-2 rounded-xl font-bold text-sm flex items-center space-x-2 transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          <span>Novo Profissional</span>
        </button>
      </div>

      <div className="bg-white border border-zinc-300 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-100 border-b border-zinc-300 text-xs uppercase font-mono text-zinc-600">
              <tr>
                <th className="p-4 font-semibold tracking-wider">Profissional</th>
                <th className="p-4 font-semibold tracking-wider">Cargo / Papel</th>
                <th className="p-4 font-semibold tracking-wider">Status</th>
                <th className="p-4 font-semibold tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {isEditing === 'new' && (
                <tr className="bg-white">
                  <td className="p-4">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nome do profissional"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-teal-500/50 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-teal-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        {colors.map(c => (
                          <button
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-6 h-6 rounded-full border-2 ${editColor === c ? 'border-zinc-300' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value as any)}
                      className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none"
                    >
                      <option value="Professor">Professor</option>
                      <option value="Personal">Personal</option>
                      <option value="Consultor">Consultor</option>
                      <option value="Atendente">Atendente</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editActive}
                        onChange={(e) => setEditActive(e.target.checked)}
                        className="rounded border-zinc-400 bg-zinc-50 text-teal-500 focus:ring-teal-500/20"
                      />
                      <span className="text-zinc-700">Ativo</span>
                    </label>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button onClick={() => setIsEditing(null)} className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={handleSave} className="p-2 text-teal-400 hover:text-teal-300 bg-teal-500/10 rounded-lg">
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {professionals.map((prof) => (
                <tr key={prof.id} className="hover:bg-white transition-colors group">
                  {isEditing === prof.id ? (
                    <>
                      <td className="p-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-white border border-teal-500/50 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none focus:border-teal-500"
                          />
                          <div className="flex gap-2">
                            {colors.map(c => (
                              <button
                                key={c}
                                onClick={() => setEditColor(c)}
                                className={`w-6 h-6 rounded-full border-2 ${editColor === c ? 'border-zinc-300' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value as any)}
                          className="w-full bg-white border border-zinc-300 rounded-lg px-3 py-2 text-zinc-900 text-sm focus:outline-none"
                        >
                          <option value="Professor">Professor</option>
                          <option value="Personal">Personal</option>
                          <option value="Consultor">Consultor</option>
                          <option value="Atendente">Atendente</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editActive}
                            onChange={(e) => setEditActive(e.target.checked)}
                            className="rounded border-zinc-400 bg-zinc-50 text-teal-500 focus:ring-teal-500/20"
                          />
                          <span className="text-zinc-700">Ativo</span>
                        </label>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button onClick={() => setIsEditing(null)} className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg">
                            <X className="h-4 w-4" />
                          </button>
                          <button onClick={handleSave} className="p-2 text-teal-400 hover:text-teal-300 bg-teal-500/10 rounded-lg">
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="h-8 w-8 rounded-full flex items-center justify-center font-bold text-zinc-900 text-xs border border-zinc-300"
                            style={{ backgroundColor: prof.color || '#3B82F6' }}
                          >
                            {prof.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-zinc-900">{prof.name}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2 text-zinc-700">
                          {prof.role === 'Professor' || prof.role === 'Personal' ? (
                            <GraduationCap className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Shield className="h-4 w-4 text-blue-400" />
                          )}
                          <span>{prof.role}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          prof.active 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : 'bg-zinc-500/10 text-zinc-600 border border-zinc-500/20'
                        }`}>
                          {prof.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(prof)} className="p-2 text-zinc-600 hover:text-zinc-900 bg-zinc-100 rounded-lg transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(prof.id)} className="p-2 text-rose-400 hover:text-rose-300 bg-rose-500/10 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              
              {professionals.length === 0 && isEditing !== 'new' && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-zinc-500">
                    Nenhum profissional cadastrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
