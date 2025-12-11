
import React, { useState, useEffect } from 'react';
import { Round, User, Game, GameStatus, RoundStatus, Role, LogEntry } from '../types';
import { api } from '../services/api'; // Import API Client
import { 
  Users, Calendar, Save, Plus, 
  Coins, Zap, Crown, Minus, Edit3, XCircle, ScrollText, Search, Filter,
  UserPlus, Mail, Lock, Phone, CreditCard
} from 'lucide-react';

// --- HELPER FUNCTIONS ---
const getGameDateTime = (isoString: string) => {
  const dateObj = new Date(isoString);
  if (isNaN(dateObj.getTime())) return { date: '', time: '' };
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');

  return {
      date: `${year}-${month}-${day}`,
      time: `${hours}:${minutes}`
  };
};

const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  return cleanCPF.length === 11 && !/^(\d)\1+$/.test(cleanCPF);
};

const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

// --- COMPONENTS ---

const AssetControl = ({ 
  value, 
  onDecrease, 
  onIncrease, 
  icon: Icon, 
  colorClass, 
  bgClass 
}: { 
  value: number, 
  onDecrease: () => void, 
  onIncrease: () => void, 
  icon: any,
  colorClass: string,
  bgClass: string
}) => (
  <div className={`flex items-center justify-between gap-2 px-2 py-1 rounded-lg border ${bgClass} border-opacity-50 min-w-[100px]`}>
     <div className="flex items-center gap-1.5">
        <Icon size={14} className={colorClass} />
        <span className={`font-bold font-mono text-sm ${colorClass}`}>{value}</span>
     </div>
     <div className="flex items-center gap-1">
        <button 
          onClick={onDecrease}
          className="w-5 h-5 flex items-center justify-center bg-white rounded border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Minus size={10} />
        </button>
        <button 
          onClick={onIncrease}
          className="w-5 h-5 flex items-center justify-center bg-white rounded border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Plus size={10} />
        </button>
     </div>
  </div>
);

// --- USER CREATOR COMPONENT ---
const UserCreator = ({ onCancel, onSave }: { onCancel: () => void, onSave: (u: User) => void }) => {
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<Role>('user');

  useEffect(() => {
    if (name) {
      const slug = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
      if (slug) {
        setEmail(`${slug}@gmail.com`);
      }
    }
  }, [name]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !cpf || !password) {
      alert("Por favor, preencha os campos obrigatórios (Nome, CPF, Senha).");
      return;
    }

    if (!validateCPF(cpf)) {
      alert("CPF inválido. Por favor verifique.");
      return;
    }

    const newUser: User = {
      id: `u-new`, // ID assigned by backend
      name,
      cpf,
      email,
      password,
      phone,
      role,
      balance: 0,
      inventory: { doubles: 0, superDoubles: 0 }
    };

    onSave(newUser);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border-2 border-green-400 mb-8 p-6 animate-in slide-in-from-top-4">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <UserPlus className="text-green-500" /> Cadastrar Novo Usuário
        </h3>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <XCircle size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
            <input 
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Ex: João da Silva"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF *</label>
            <div className="relative">
              <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="text"
                value={cpf}
                onChange={handleCpfChange}
                className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="000.000.000-00"
                maxLength={14}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha *</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input 
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="******"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Conta</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value as Role)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-white"
            >
              <option value="user">Usuário Padrão</option>
              <option value="pro">Jogador PRO</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
        </div>

        <div className="border-t border-slate-100 my-4 pt-4">
          <p className="text-xs font-bold text-slate-400 uppercase mb-3">Dados de Contato (Opcional)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email (Automático)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none bg-slate-50"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
           <button 
             type="submit"
             className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 flex items-center gap-2"
           >
             <Save size={20} /> Salvar Usuário
           </button>
        </div>
      </form>
    </div>
  );
};


interface RoundEditorProps {
  roundData: Round;
  isNew: boolean;
  onDraftChange: (field: keyof Round, value: any) => void;
  onGameChange: (gameId: string, field: keyof Game, value: any) => void;
  onGameDateChange: (gameId: string, type: 'date' | 'time', value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const RoundEditor: React.FC<RoundEditorProps> = ({ 
  roundData, 
  isNew, 
  onDraftChange, 
  onGameChange, 
  onGameDateChange, 
  onSave, 
  onCancel 
}) => (
  <div className={`bg-white rounded-xl shadow-lg border-2 ${isNew ? 'border-green-400 mb-8' : 'border-orange-200'} overflow-hidden`}>
    {/* Editor Header */}
    <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1 w-full">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Nome da Rodada</label>
            <input 
                type="text"
                value={roundData.title}
                onChange={(e) => onDraftChange('title', e.target.value)}
                placeholder="Ex: Rodada #10 - Brasileirão"
                className="font-bold text-lg text-slate-800 bg-white border border-slate-300 rounded px-3 py-2 w-full focus:ring-2 focus:ring-orange-500 outline-none"
            />
            <div className="flex gap-4 mt-2">
                <div>
                    <span className="text-xs text-slate-400 block">ID (Auto)</span>
                    <span className="text-xs font-mono text-slate-600">{roundData.id}</span>
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2">
            <select 
                value={roundData.status}
                onChange={(e) => onDraftChange('status', e.target.value as RoundStatus)}
                className="text-sm font-bold uppercase px-3 py-2 rounded-lg border bg-white focus:ring-2 focus:ring-orange-500"
            >
                <option value="draft">Rascunho</option>
                <option value="open">Aberta</option>
                <option value="closed">Fechada</option>
                <option value="settled">Liquidada</option>
            </select>
            
            <button 
                onClick={onCancel}
                className="p-2 rounded-lg border bg-white border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors text-slate-500"
                title="Cancelar"
            >
                <XCircle size={20} />
            </button>
        </div>
    </div>

    {/* Games Table Editor */}
    <div className="p-4 overflow-x-auto bg-slate-50/30">
        <table className="w-full text-sm">
            <thead>
            <tr className="bg-slate-100 text-slate-500 border-b border-slate-200">
                <th className="text-left py-2 px-3 font-medium w-10">#</th>
                <th className="text-left py-2 px-3 font-medium w-32">Data</th>
                <th className="text-left py-2 px-3 font-medium w-24">Hora</th>
                <th className="text-left py-2 px-3 font-medium">Mandante</th>
                <th className="text-center py-2 px-3 font-medium w-24">Placar</th>
                <th className="text-right py-2 px-3 font-medium">Visitante</th>
                <th className="text-center py-2 px-3 font-medium w-32">Status</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
            {roundData.games.map(game => {
                const { date, time } = getGameDateTime(game.date);
                return (
                <tr key={game.id} className="hover:bg-orange-50/10">
                <td className="py-2 px-3 text-slate-400 font-mono text-xs">{game.order}</td>
                <td className="py-2 px-3">
                    <input 
                        type="date"
                        value={date}
                        onChange={(e) => onGameDateChange(game.id, 'date', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </td>
                <td className="py-2 px-3">
                    <input 
                        type="time"
                        value={time}
                        onChange={(e) => onGameDateChange(game.id, 'time', e.target.value)}
                        className="w-full text-xs border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </td>
                <td className="py-2 px-3">
                    <input 
                        type="text"
                        value={game.teamA}
                        onChange={(e) => onGameChange(game.id, 'teamA', e.target.value)}
                        placeholder="Mandante"
                        className="w-full font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </td>
                <td className="py-2 px-3">
                    <div className="flex items-center justify-center gap-1">
                    <input 
                        type="number" 
                        className="w-10 text-center border border-slate-300 rounded p-1 focus:ring-1 focus:ring-orange-500 outline-none font-bold"
                        value={game.scoreA ?? ''}
                        placeholder="-"
                        onChange={(e) => onGameChange(game.id, 'scoreA', e.target.value === '' ? null : Number(e.target.value))}
                    />
                    <span className="text-slate-300">:</span>
                    <input 
                        type="number" 
                        className="w-10 text-center border border-slate-300 rounded p-1 focus:ring-1 focus:ring-orange-500 outline-none font-bold"
                        value={game.scoreB ?? ''}
                        placeholder="-"
                        onChange={(e) => onGameChange(game.id, 'scoreB', e.target.value === '' ? null : Number(e.target.value))}
                    />
                    </div>
                </td>
                <td className="py-2 px-3">
                    <input 
                        type="text"
                        value={game.teamB}
                        onChange={(e) => onGameChange(game.id, 'teamB', e.target.value)}
                        placeholder="Visitante"
                        className="w-full text-right font-bold text-slate-700 border border-slate-300 rounded px-2 py-1 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </td>
                <td className="py-2 px-3 text-center">
                    <select 
                    value={game.status}
                    onChange={(e) => onGameChange(game.id, 'status', e.target.value)}
                    className="text-xs border border-slate-300 rounded px-2 py-1 bg-white outline-none w-full"
                    >
                    <option value="scheduled">Agendado</option>
                    <option value="live">Ao Vivo</option>
                    <option value="finished">Finalizado</option>
                    <option value="cancelled">Cancelado</option>
                    </select>
                </td>
                </tr>
                );
            })}
            </tbody>
        </table>
        
        <div className="mt-6 flex justify-end gap-3">
            <button 
                onClick={onCancel}
                className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
            >
                Cancelar
            </button>
            <button 
                onClick={onSave}
                className={`font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-transform active:scale-95 text-white
                    ${isNew ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/20'}`}
            >
                <Save size={20} />
                {isNew ? 'Criar Rodada' : 'Salvar Alterações'}
            </button>
        </div>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

interface AdminPageProps {
  rounds: Round[];
  setRounds: React.Dispatch<React.SetStateAction<Round[]>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  logs: LogEntry[];
}

export const AdminPage: React.FC<AdminPageProps> = ({ rounds, setRounds, users, setUsers, logs }) => {
  const [activeTab, setActiveTab] = useState<'rounds' | 'users' | 'logs'>('rounds');
  
  // State for Draft Editing ('new' indicates creating a round)
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [draftRound, setDraftRound] = useState<Round | null>(null);

  // State for User Creation
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // State for Log Filters
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState<string>('all');

  // Helper: Generate Empty Round
  const generateEmptyRound = (): Round => {
    const id = `r-${Date.now()}`;
    return {
      id,
      title: '', 
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'draft',
      games: Array.from({ length: 12 }).map((_, i) => ({
        id: `g-new-${Date.now()}-${i}`, // Temporary ID
        roundId: id, // Updated from rodadaId
        teamA: '',
        teamB: '',
        date: new Date().toISOString(),
        status: 'scheduled',
        order: i + 1,
        scoreA: null,
        scoreB: null
      }))
    };
  };

  // --- ROUND FUNCTIONS ---

  const handleCreateRound = () => {
    const newRound = generateEmptyRound();
    setDraftRound(newRound);
    setEditingRoundId('new');
  };

  const handleStartEditing = (round: Round) => {
    if (editingRoundId === round.id) {
      setEditingRoundId(null);
      setDraftRound(null);
    } else {
      setEditingRoundId(round.id);
      setDraftRound(JSON.parse(JSON.stringify(round)));
    }
  };

  const handleDraftChange = (field: keyof Round, value: any) => {
    if (!draftRound) return;
    setDraftRound({ ...draftRound, [field]: value });
  };

  const handleDraftGameChange = (gameId: string, field: keyof Game, value: any) => {
    if (!draftRound) return;
    
    const updatedGames = draftRound.games.map(g => {
      if (g.id !== gameId) return g;
      return { ...g, [field]: value };
    });

    setDraftRound({ ...draftRound, games: updatedGames });
  };

  const handleDraftGameDateChange = (gameId: string, type: 'date' | 'time', value: string) => {
    if (!draftRound) return;

    const updatedGames = draftRound.games.map(g => {
      if (g.id !== gameId) return g;
      
      const currentIso = g.date;
      let newDateObj = new Date(currentIso);
      
      if (isNaN(newDateObj.getTime())) newDateObj = new Date();

      if (type === 'date') {
          const [year, month, day] = value.split('-').map(Number);
          newDateObj.setFullYear(year);
          newDateObj.setMonth(month - 1);
          newDateObj.setDate(day);
      } else {
          const [hours, minutes] = value.split(':').map(Number);
          newDateObj.setHours(hours);
          newDateObj.setMinutes(minutes);
      }

      return { ...g, date: newDateObj.toISOString() };
    });

    setDraftRound({ ...draftRound, games: updatedGames });
  }

  const handleSaveChanges = async () => {
    if (!draftRound) return;

    if (!draftRound.title.trim()) {
        alert("Por favor, insira um nome para a rodada.");
        return;
    }

    const confirmMsg = editingRoundId === 'new' 
        ? "Deseja criar esta nova rodada?" 
        : "Deseja salvar todas as alterações desta rodada?";

    if (window.confirm(confirmMsg)) {
      try {
          let savedRound: Round;
          
          if (editingRoundId === 'new') {
             // API Call to Create
             savedRound = await api.createRound(draftRound);
             setRounds(prev => [savedRound, ...prev]);
             alert("Nova rodada criada com sucesso!");
          } else {
             // API Call to Update
             savedRound = await api.updateRound(draftRound.id, draftRound);
             setRounds(prev => prev.map(r => r.id === savedRound.id ? savedRound : r));
             alert("Rodada atualizada com sucesso!");
          }
          setEditingRoundId(null);
          setDraftRound(null);
      } catch (error) {
          console.error(error);
          alert("Erro ao salvar rodada. Verifique o console.");
      }
    }
  };

  const handleCancel = () => {
      setEditingRoundId(null);
      setDraftRound(null);
  };

  // --- USER FUNCTIONS ---
  
  const handleCreateUser = async (newUser: User) => {
    try {
        const created = await api.register(newUser); // Reuse register for creation by admin
        setUsers(prev => [created, ...prev]);
        setIsCreatingUser(false);
        alert("Usuário criado com sucesso!");
    } catch (e) {
        alert("Erro ao criar usuário.");
    }
  };

  const handleUpdateUserRole = async (userId: string, role: Role) => {
    try {
        const updated = await api.updateUser(userId, { role });
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (e) {
        alert("Erro ao atualizar permissão.");
    }
  };

  const handleUpdateAsset = async (userId: string, type: 'balance' | 'doubles' | 'superDoubles', amount: number) => {
    // We need to calculate new values based on current state to send to API
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser) return;

    let updateData: any = {};
    if (type === 'balance') {
        updateData.balance = Math.max(0, currentUser.balance + amount);
    } else {
        const currentQty = currentUser.inventory?.[type] || 0;
        const newQty = Math.max(0, currentQty + amount);
        updateData.inventory = {
            ...currentUser.inventory,
            [type]: newQty
        };
    }

    try {
        const updated = await api.updateUser(userId, updateData);
        setUsers(prev => prev.map(u => u.id === userId ? updated : u));
    } catch (e) {
        alert("Erro ao atualizar saldo/estoque.");
    }
  };

  // --- LOG FILTER LOGIC ---
  const filteredLogs = logs.filter(log => {
      const searchLower = logSearch.toLowerCase();
      const matchesSearch = 
          log.userName.toLowerCase().includes(searchLower) ||
          log.action.toLowerCase().includes(searchLower) ||
          log.details.toLowerCase().includes(searchLower);
          
      const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;

      return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Painel Administrativo</h2>
        <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1">
          <button 
            onClick={() => setActiveTab('rounds')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'rounds' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Calendar size={16} /> Rodadas
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'users' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Users size={16} /> Usuários
          </button>
          <button 
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-colors ${activeTab === 'logs' ? 'bg-orange-500 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ScrollText size={16} /> Logs
          </button>
        </div>
      </div>

      {/* --- ROUNDS TAB --- */}
      {activeTab === 'rounds' && (
        <div className="space-y-6">
          
          {!editingRoundId && (
              <button 
                  onClick={handleCreateRound}
                  className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition-colors flex items-center justify-center gap-2"
              >
                  <Plus size={24} /> Criar Nova Rodada
              </button>
          )}

          {editingRoundId === 'new' && draftRound && (
              <RoundEditor 
                roundData={draftRound} 
                isNew={true}
                onDraftChange={handleDraftChange}
                onGameChange={handleDraftGameChange}
                onGameDateChange={handleDraftGameDateChange}
                onSave={handleSaveChanges}
                onCancel={handleCancel}
              />
          )}

          {rounds.map(round => {
            const isEditing = editingRoundId === round.id;
            
            if (isEditing && draftRound) {
                return (
                  <RoundEditor 
                    key={round.id}
                    roundData={draftRound} 
                    isNew={false}
                    onDraftChange={handleDraftChange}
                    onGameChange={handleDraftGameChange}
                    onGameDateChange={handleDraftGameDateChange}
                    onSave={handleSaveChanges}
                    onCancel={handleCancel}
                  />
                );
            }

            return (
              <div key={round.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all hover:shadow-md">
                <div className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-slate-800">{round.title}</h3>
                    <div className="flex gap-2 text-xs text-slate-500 mt-1">
                      <span>ID: {round.id}</span>
                      <span>•</span>
                      <span>Jogos: {round.games.length}</span>
                      <span>•</span>
                      <span>Início: {new Date(round.startDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase px-3 py-1.5 rounded-lg border
                        ${round.status === 'open' ? 'bg-green-100 text-green-700 border-green-200' : 
                        round.status === 'closed' ? 'bg-red-100 text-red-700 border-red-200' :
                        round.status === 'settled' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-slate-100 text-slate-600 border-slate-200'}`}>
                        {round.status}
                    </span>
                    
                    <button 
                      onClick={() => handleStartEditing(round)}
                      disabled={editingRoundId === 'new'}
                      className={`p-2 rounded-lg border transition-colors flex items-center gap-2 text-sm font-bold bg-white border-slate-200 hover:bg-orange-50 hover:text-orange-600
                        ${editingRoundId === 'new' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Edit3 size={16} /> Editar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- USERS TAB --- */}
      {activeTab === 'users' && (
        <div className="space-y-6">
           {!isCreatingUser && (
             <button 
               onClick={() => setIsCreatingUser(true)}
               className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 font-bold hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-colors flex items-center justify-center gap-2"
             >
               <UserPlus size={24} /> Cadastrar Novo Usuário
             </button>
           )}

           {isCreatingUser && (
             <UserCreator 
               onCancel={() => setIsCreatingUser(false)}
               onSave={handleCreateUser}
             />
           )}

           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
             <table className="w-full text-sm">
               <thead>
                 <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                   <th className="text-left py-3 px-4 font-medium">Usuário</th>
                   <th className="text-center py-3 px-4 font-medium">Role</th>
                   <th className="text-left py-3 px-4 font-medium">Fichas</th>
                   <th className="text-left py-3 px-4 font-medium">Duplas (2x)</th>
                   <th className="text-left py-3 px-4 font-medium">Super (4x)</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {users.map(user => (
                   <tr key={user.id} className="hover:bg-slate-50/50">
                     <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700">{user.name}</span>
                          <span className="text-xs text-slate-400">{user.email}</span>
                          {user.cpf && <span className="text-[10px] text-slate-400 mt-0.5 font-mono">CPF: {user.cpf}</span>}
                        </div>
                     </td>
                     <td className="py-3 px-4 text-center">
                       <select 
                         value={user.role}
                         onChange={(e) => handleUpdateUserRole(user.id, e.target.value as Role)}
                         className={`text-xs font-bold uppercase px-2 py-1 rounded border outline-none
                           ${user.role === 'admin' ? 'bg-slate-800 text-white border-slate-900' :
                             user.role === 'pro' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                             'bg-white text-slate-600 border-slate-200'}`}
                       >
                         <option value="user">USER</option>
                         <option value="pro">PRO</option>
                         <option value="admin">ADMIN</option>
                       </select>
                     </td>
                     
                     <td className="py-3 px-4">
                        <AssetControl 
                          value={user.balance}
                          icon={Coins}
                          colorClass="text-yellow-600"
                          bgClass="bg-yellow-50 border-yellow-100"
                          onDecrease={() => handleUpdateAsset(user.id, 'balance', -10)}
                          onIncrease={() => handleUpdateAsset(user.id, 'balance', 10)}
                        />
                     </td>

                     <td className="py-3 px-4">
                        <AssetControl 
                          value={user.inventory?.doubles || 0}
                          icon={Zap}
                          colorClass="text-blue-600"
                          bgClass="bg-blue-50 border-blue-100"
                          onDecrease={() => handleUpdateAsset(user.id, 'doubles', -1)}
                          onIncrease={() => handleUpdateAsset(user.id, 'doubles', 1)}
                        />
                     </td>

                     <td className="py-3 px-4">
                        <AssetControl 
                          value={user.inventory?.superDoubles || 0}
                          icon={Crown}
                          colorClass="text-purple-600"
                          bgClass="bg-purple-50 border-purple-100"
                          onDecrease={() => handleUpdateAsset(user.id, 'superDoubles', -1)}
                          onIncrease={() => handleUpdateAsset(user.id, 'superDoubles', 1)}
                        />
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {/* --- LOGS TAB --- */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
           {/* Filters Bar */}
           <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
               <div className="flex-1 relative">
                   <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                   <input 
                     type="text"
                     placeholder="Buscar por usuário ou ação..."
                     value={logSearch}
                     onChange={(e) => setLogSearch(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500"
                   />
               </div>
               <div className="relative w-full md:w-48">
                   <Filter size={18} className="absolute left-3 top-3 text-slate-400" />
                   <select 
                     value={logTypeFilter}
                     onChange={(e) => setLogTypeFilter(e.target.value)}
                     className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-orange-500 bg-white"
                   >
                       <option value="all">Todos os Tipos</option>
                       <option value="success">Sucesso</option>
                       <option value="warning">Aviso</option>
                       <option value="error">Erro</option>
                       <option value="info">Info</option>
                   </select>
               </div>
           </div>

           {/* Logs Table */}
           <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium w-40">Data/Hora</th>
                    <th className="text-left py-3 px-4 font-medium w-48">Usuário</th>
                    <th className="text-left py-3 px-4 font-medium w-40">Ação</th>
                    <th className="text-left py-3 px-4 font-medium">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map(log => {
                    const date = new Date(log.timestamp);
                    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
                    
                    let typeColor = 'bg-slate-100 text-slate-600';
                    if (log.type === 'success') typeColor = 'bg-green-100 text-green-700';
                    if (log.type === 'warning') typeColor = 'bg-yellow-100 text-yellow-700';
                    if (log.type === 'error') typeColor = 'bg-red-100 text-red-700';

                    return (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-xs font-mono text-slate-500">{formattedDate}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700">{log.userName}</span>
                            <span className="text-[10px] text-slate-400">{log.userId}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${typeColor}`}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{log.details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
                    <XCircle size={32} className="opacity-20" />
                    <span>Nenhum registro encontrado para os filtros selecionados.</span>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
};
