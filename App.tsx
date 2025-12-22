import React, { useState, useEffect, useMemo } from 'react';
import { Layout } from './components/Layout';
import { BettingPage } from './pages/BettingPage';
import { AdminPage } from './pages/AdminPage';
import { User, Selection, Pool, RankingEntry, Round, LogEntry } from './types';
import { api } from './services/api';
import { MOCK_ROUNDS, MOCK_POOLS, MOCK_ALL_USERS, MOCK_LOGS } from './services/mockData';
import { 
  Trophy, ArrowRight, Beer, Users, Crown, 
  ClipboardList, PlusCircle, Star, Eye,
  UserPlus, ArrowLeft, CreditCard, Lock, Phone, Mail, User as UserIcon, Search,
  Zap, Coins, ShoppingBag
} from 'lucide-react';

// --- HELPERS ---
const formatCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const validateCPF = (cpf: string): boolean => {
  const cleanCPF = cpf.replace(/[^\d]+/g, '');
  return cleanCPF.length === 11 && !/^(\d)\1+$/.test(cleanCPF);
};

// --- COMPONENTS ---

const ProfilePage = ({ user, onSave, onCancel }: { user: User, onSave: (u: User) => void, onCancel: () => void }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone || '');
  const [password, setPassword] = useState(user.password || '');
  const [cpf, setCpf] = useState(user.cpf || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      alert("Nome e Email são obrigatórios.");
      return;
    }
    
    onSave({
      ...user,
      name,
      email,
      phone,
      password,
      cpf
    });
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-4 mb-6 border-b border-slate-100 pb-4">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
          <UserIcon size={32} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Meu Perfil</h2>
          <p className="text-slate-500 text-sm">Gerencie suas informações pessoais</p>
        </div>
        <div className="ml-auto">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'pro' ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
            {user.role}
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
            <input 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF</label>
            <input 
              type="text" 
              value={cpf} 
              readOnly
              className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none bg-slate-100 text-slate-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / WhatsApp</label>
            <input 
              type="text" 
              value={phone} 
              onChange={e => setPhone(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="(00) 00000-0000"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alterar Senha</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Digite nova senha para alterar"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2 rounded-lg text-slate-500 font-bold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit"
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2"
          >
            <ArrowRight size={18} /> Salvar Alterações
          </button>
        </div>
      </form>
    </div>
  );
};

const CreatePoolModal = ({ onClose, onSave, currentUser }: { onClose: () => void, onSave: (pool: Pool) => void, currentUser: User }) => {
  const [title, setTitle] = useState('');
  const [fee, setFee] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPool: Pool = {
      id: `p-new`, 
      title: title || 'Novo Bolão',
      creatorName: currentUser.name,
      entryFee: Number(fee) || 0,
      participantsCount: 1,
      participants: [currentUser.id],
      prizePool: Number(fee) || 0,
      status: 'open',
      startDate: startDate,
      endDate: endDate
    };
    onSave(newPool);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <PlusCircle className="text-orange-500" /> Criar Bolão
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft size={24} className="rotate-180" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Bolão</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Champions da Várzea"
              required
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Entrada (Fichas)</label>
             <input 
                type="number" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
                value={fee}
                onChange={e => setFee(e.target.value)}
                placeholder="Ex: 10"
                required
             />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Início</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Fim</label>
              <input 
                type="date" 
                className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Observações (Ganhadores, regras...)</label>
            <textarea 
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-orange-500 outline-none"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Vencedor leva tudo, Top 3 ganham..."
            />
          </div>
          <button type="submit" className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg transition-transform active:scale-95">
            Lançar Bolão
          </button>
        </form>
      </div>
    </div>
  );
};

const RankingModal = ({ data, title, onClose }: { data: RankingEntry[], title: string, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-0 max-w-lg w-full shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            {title}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full">
            <ArrowLeft size={20} className="rotate-180 text-slate-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-2 flex-1">
          {data.slice(0, 30).map((entry, index) => (
             <div key={entry.userId} className={`flex items-center justify-between p-3 rounded-lg border ${entry.userName === 'Você' ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${index < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}`}>
                    {entry.position}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-800 text-sm">{entry.userName}</span>
                    {entry.isPro && <span className="text-[10px] bg-black text-white px-1.5 rounded w-fit">PRO</span>}
                  </div>
                </div>
                <span className="font-mono font-bold text-orange-600">{entry.points} pts</span>
             </div>
          ))}
          {data.length === 0 && (
             <p className="text-center text-slate-400 py-4">Nenhum participante ainda.</p>
          )}
        </div>
      </div>
    </div>
  );
};

const ViewBetModal = ({ selections, round, onClose }: { selections: Selection[], round: Round, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-xl p-0 max-w-sm w-full shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-orange-500" size={18} />
            <h3 className="text-base font-bold">Seu Palpite - {round.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} className="rotate-180" />
          </button>
        </div>

        <div className="overflow-y-auto p-2 space-y-2 flex-1">
          {round.games.map(game => {
            const userSelection = selections.find(s => s.gameId === game.id);
            if (!userSelection) return null;

            const outcomes = userSelection.outcome;
            const isDouble = userSelection.isDouble;
            const isSuper = userSelection.isSuperDouble;

            return (
              <div key={game.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-2 text-xs">
                <div className="flex justify-between items-center mb-1.5 border-b border-slate-50 pb-1">
                   <span className="text-xs font-bold text-slate-400 px-1">JOGO {game.order}</span>
                   <div className="flex gap-1">
                      {isDouble && <span className="text-[9px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Zap size={8}/> 2x</span>}
                      {isSuper && <span className="text-[9px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded flex items-center gap-0.5"><Crown size={8}/> 4x</span>}
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 items-center">
                  <div className={`p-1.5 rounded text-center border transition-colors relative
                    ${outcomes.includes('A') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <span className="font-bold block leading-tight truncate">{game.teamA}</span>
                  </div>

                  <div className={`p-1.5 rounded text-center border transition-colors relative
                    ${outcomes.includes('Draw') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <span className="font-bold block">X</span>
                  </div>

                  <div className={`p-1.5 rounded text-center border transition-colors relative
                    ${outcomes.includes('B') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-300'}`}>
                    <span className="font-bold block leading-tight truncate">{game.teamB}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const BarPage = ({ onBuy }: { onBuy: (item: string, cost: number, type: 'chips' | 'fichas' | 'powerup', rewardKey?: string, rewardAmount?: number) => void }) => {
  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <div className="text-center mb-8 relative">
        <div className="inline-block bg-orange-100 text-orange-700 px-4 py-1 rounded-full text-xs font-bold mb-2 uppercase tracking-wide border border-orange-200">
          Mercado da Bola
        </div>
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 font-serif">
          Bar do <span className="text-orange-500 italic">Fantasy12</span>
        </h2>
        <p className="text-slate-500 mt-2">Abasteça seu estoque de fichas e garanta vantagens táticas.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative">
          <div className="bg-slate-900 p-4 flex items-center gap-2">
            <div className="bg-yellow-500 p-2 rounded-lg text-slate-900">
              <Coins size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">O Caixa</h3>
              <p className="text-slate-400 text-xs">Compre fichas (R$ 0,50 / ficha)</p>
            </div>
          </div>
          
          <div className="p-6 space-y-4 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
             <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-700 font-bold text-lg border-4 border-white shadow-sm">
                      10
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-800">Fichas de Prata</span>
                      <span className="text-xs text-slate-500">Pacote Iniciante</span>
                   </div>
                </div>
                <button onClick={() => onBuy('10 Fichas', 5, 'fichas')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                   R$ 5,00
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:shadow-md transition-shadow relative overflow-hidden">
                <div className="absolute -right-4 -top-4 bg-red-500 text-white text-[10px] font-bold px-6 py-1 rotate-45">POPULAR</div>
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-yellow-300 flex items-center justify-center text-yellow-800 font-bold text-lg border-4 border-white shadow-sm">
                      20
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-800">Fichas de Ouro</span>
                      <span className="text-xs text-slate-500">O dobro da diversão</span>
                   </div>
                </div>
                <button onClick={() => onBuy('20 Fichas', 10, 'fichas')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                   R$ 10,00
                </button>
             </div>

             <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-100 to-yellow-50 border border-yellow-300 rounded-xl hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-xl border-4 border-white shadow-sm">
                      100
                   </div>
                   <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Maleta de Fichas</span>
                      <span className="text-xs text-slate-600">Para grandes apostadores</span>
                   </div>
                </div>
                <button onClick={() => onBuy('100 Fichas', 50, 'fichas')} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition-colors">
                   R$ 50,00
                </button>
             </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
           <div className="bg-orange-600 p-4 flex items-center gap-2">
            <div className="bg-white/20 p-2 rounded-lg text-white">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Menu Tático</h3>
              <p className="text-orange-100 text-xs">Troque fichas por vantagens</p>
            </div>
          </div>

          <div className="p-6">
             <div className="mb-6">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Duplas (2x Pontos)</h4>
                <div className="space-y-3">
                   <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-slate-800 text-lg group-hover:text-orange-600">1x</span>
                         <span className="text-sm text-slate-600">Dupla Simples</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">4 Fichas</span>
                         <button onClick={() => onBuy('1 Dupla', 4, 'powerup', 'doubles', 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-orange-500 hover:text-white rounded-full transition-colors text-slate-400">
                            <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                   <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-dashed border-slate-200">
                      <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-slate-800 text-lg group-hover:text-orange-600">3x</span>
                         <span className="text-sm text-slate-600">Combo Tático</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">10 Fichas</span>
                         <button onClick={() => onBuy('3 Duplas', 10, 'powerup', 'doubles', 3)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-orange-500 hover:text-white rounded-full transition-colors text-slate-400">
                            <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                   <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-dashed border-slate-200">
                      <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-slate-800 text-lg group-hover:text-orange-600">10x</span>
                         <span className="text-sm text-slate-600">Estratégia Total</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">20 Fichas</span>
                         <button onClick={() => onBuy('10 Duplas', 20, 'powerup', 'doubles', 10)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-orange-500 hover:text-white rounded-full transition-colors text-slate-400">
                            <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

             <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-1">Super Duplas (4x Pontos)</h4>
                <div className="space-y-3">
                   <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-slate-800 text-lg group-hover:text-purple-600">1x</span>
                         <span className="text-sm text-slate-600">Super Jogada</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">5 Fichas</span>
                         <button onClick={() => onBuy('1 Super Dupla', 5, 'powerup', 'superDoubles', 1)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-purple-500 hover:text-white rounded-full transition-colors text-slate-400">
                            <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                   <div className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-2 rounded-lg transition-colors border border-dashed border-slate-200">
                      <div className="flex items-center gap-3">
                         <span className="font-serif font-bold text-slate-800 text-lg group-hover:text-purple-600">4x</span>
                         <span className="text-sm text-slate-600">Mestre da Rodada</span>
                      </div>
                      <div className="flex items-center gap-2">
                         <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">20 Fichas</span>
                         <button onClick={() => onBuy('4 Super Duplas', 20, 'powerup', 'superDoubles', 4)} className="w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-purple-500 hover:text-white rounded-full transition-colors text-slate-400">
                            <ShoppingBag size={14} />
                         </button>
                      </div>
                   </div>
                </div>
             </div>

          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ 
  user, 
  onNavigate, 
  pools, 
  joinPool,
  openRankingModal,
  openPoolRanking,
  currentRankings,
  hasBet,
  onOpenViewBet,
  activeRound
}: { 
  user: User, 
  onNavigate: (p: string) => void,
  pools: Pool[],
  joinPool: (id: string) => void,
  openRankingModal: (type: 'general' | 'pro') => void,
  openPoolRanking: (pool: Pool) => void,
  currentRankings: { general: RankingEntry[], pro: RankingEntry[] },
  hasBet: boolean,
  onOpenViewBet: () => void,
  activeRound: Round | null
}) => {
  const [rankingTab, setRankingTab] = useState<'general' | 'pro'>('general');
  const [poolTab, setPoolTab] = useState<'my' | 'all'>('my');
  const [searchPool, setSearchPool] = useState('');

  const displayedRankings = rankingTab === 'general' ? currentRankings.general : currentRankings.pro;
  const top5 = displayedRankings.slice(0, 5);
  const userRankEntry = displayedRankings.find(r => r.userId === user.id);
  const isUserInTop5 = userRankEntry && userRankEntry.position <= 5;

  const myPools = pools.filter(p => p.participants.includes(user.id) || p.creatorName === user.name); 
  const availablePools = pools.filter(p => !p.participants.includes(user.id) && p.creatorName !== user.name);
  
  const filteredAvailable = availablePools.filter(p => p.title.toLowerCase().includes(searchPool.toLowerCase()));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border-2 border-orange-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-xl">
             <div className="flex items-center gap-2 mb-2 text-orange-400 font-bold uppercase tracking-widest text-xs">
                <ClipboardList size={16} />
                <span>Prancheta Tática</span>
             </div>
             <h2 className="text-3xl md:text-5xl font-black italic tracking-tight mb-4 drop-shadow-md font-sans">
                Fala, <span className="text-orange-500">Professor!</span> 🍺
             </h2>
             <p className="text-slate-200 text-lg md:text-xl font-medium leading-relaxed">
                A <span className="text-orange-400 font-bold">{activeRound?.title || 'Rodada'}</span> já começou e a galera no bar tá dizendo que você não acerta nem jogo treino.
             </p>
             <p className="text-slate-400 mt-2 text-sm">
                Vai deixar barato ou vai analisar e mostrar quem manda?
             </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              disabled={hasBet}
              onClick={() => !hasBet && onNavigate('betting')}
              className={`group relative px-8 py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 uppercase tracking-wide
                ${hasBet 
                  ? 'bg-white text-orange-600 border-2 border-orange-500 cursor-default shadow-sm' 
                  : 'bg-orange-600 text-white shadow-[0_4px_0_rgb(124,45,18)] active:shadow-none active:translate-y-1 hover:bg-orange-500'
                }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold italic text-xs border-2 
                ${hasBet ? 'bg-orange-100 border-orange-500 text-orange-600' : 'bg-white text-orange-600 border-transparent'}`}>
                F12
              </div>
              {hasBet ? 'PEDIDO FEITO' : 'BORA MISTER!'}
            </button>

            {hasBet && (
              <button 
                onClick={onOpenViewBet}
                className="px-6 py-4 rounded-xl font-bold text-lg border-2 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
              >
                <Eye size={20} />
                Visualizar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Classificação Mensal
          </h3>
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
              onClick={() => setRankingTab('general')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${rankingTab === 'general' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Geral
            </button>
            <button 
              onClick={() => setRankingTab('pro')}
              className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-1 ${rankingTab === 'pro' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Crown size={14} className={rankingTab === 'pro' ? 'text-black' : 'text-slate-400'} /> PRO
            </button>
          </div>
        </div>

        <div className="p-0">
          <table className="w-full text-sm">
             <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                   <th className="px-4 py-3 text-left w-16">Pos</th>
                   <th className="px-4 py-3 text-left">Treinador</th>
                   <th className="px-4 py-3 text-right">Pts</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {top5.map((entry) => (
                   <tr key={entry.userId} className={`${entry.userId === user.id ? 'bg-orange-50' : ''}`}>
                      <td className="px-4 py-3 font-bold text-slate-600">#{entry.position}</td>
                      <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                         {entry.userName}
                         {entry.isPro && <span className="bg-black text-white text-[10px] px-1.5 rounded font-bold">PRO</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600">{entry.points}</td>
                   </tr>
                ))}
                
                {!isUserInTop5 && userRankEntry && (
                  <>
                    <tr>
                      <td colSpan={3} className="px-4 py-2 bg-slate-50 text-center text-xs text-slate-400">...</td>
                    </tr>
                    <tr className="bg-orange-50 border-l-4 border-orange-400">
                      <td className="px-4 py-3 font-bold text-slate-600">#{userRankEntry.position}</td>
                      <td className="px-4 py-3 font-bold text-slate-800 flex items-center gap-2">
                         {userRankEntry.userName} (Você)
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-orange-600">{userRankEntry.points}</td>
                    </tr>
                  </>
                )}
             </tbody>
          </table>
          <button 
            onClick={() => openRankingModal(rankingTab)}
            className="w-full py-3 text-center text-orange-600 text-sm font-bold hover:bg-orange-50 transition-colors border-t border-slate-100"
          >
            Ver Ranking Completo
          </button>
        </div>
      </div>

      <div className="py-2">
        <button
          onClick={() => onNavigate('bar')}
          className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 group hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10 transform group-hover:scale-150 transition-transform duration-700"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm border border-white/30">
                  <Beer size={32} className="text-white fill-white/20" />
               </div>
               <div className="text-left">
                  <h3 className="text-2xl font-black italic tracking-tight">Bora pro Bar F12</h3>
                  <p className="text-orange-100 text-sm font-medium">Faltou ficha? A resenha continua no balcão!</p>
               </div>
            </div>
            <div className="bg-white text-orange-600 rounded-full p-2 group-hover:translate-x-2 transition-transform shadow-lg">
               <ArrowRight size={24} />
            </div>
          </div>
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
           <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="text-blue-500" /> Bolões
           </h3>
           <div className="flex gap-2">
             <button 
                onClick={() => setPoolTab('my')}
                className={`text-sm font-bold px-3 py-1.5 rounded-full border transition-colors ${poolTab === 'my' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}
             >
                Meus Bolões
             </button>
             <button 
                onClick={() => setPoolTab('all')}
                className={`text-sm font-bold px-3 py-1.5 rounded-full border transition-colors ${poolTab === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-300'}`}
             >
                Disponíveis
             </button>
           </div>
        </div>

        {poolTab === 'all' && (
           <div className="relative">
              <Search className="absolute left-3 top-3 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar bolão por nome..." 
                value={searchPool}
                onChange={(e) => setSearchPool(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none"
              />
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           {poolTab === 'my' ? (
              user.role !== 'pro' ? (
                <div className="col-span-full bg-slate-50 border border-slate-200 rounded-xl p-8 text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} className="text-yellow-600" />
                    </div>
                    <h4 className="text-lg font-bold text-slate-800 mb-2">Área Exclusiva PRO</h4>
                    <p className="text-slate-500 max-w-md mb-6 text-sm">
                        Apenas jogadores PRO podem criar e participar de Bolões privados. Faça o upgrade para desbloquear esta funcionalidade.
                    </p>
                    <button 
                      onClick={() => setPoolTab('all')}
                      className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors"
                    >
                      Ver Bolões Disponíveis
                    </button>
                </div>
              ) : (
                myPools.length > 0 ? (
                    myPools.map(pool => (
                    <div key={pool.id} className="bg-white p-5 rounded-xl border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-slate-800">{pool.title}</h4>
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">ATIVO</span>
                        </div>
                        <div className="text-sm text-slate-500 mb-4 flex items-center gap-2">
                            <Star size={14} className="text-yellow-500" /> Seus Pontos: {1250} {/* Mock */}
                        </div>
                        <button 
                            onClick={() => openPoolRanking(pool)}
                            className="w-full py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Ver Classificação
                        </button>
                    </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500 mb-2">Você não está participando de nenhum bolão.</p>
                    <button onClick={() => setPoolTab('all')} className="text-orange-600 font-bold hover:underline">Buscar Bolões</button>
                    </div>
                )
              )
           ) : (
              filteredAvailable.length > 0 ? (
                 filteredAvailable.map(pool => (
                    <div key={pool.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-1">
                          <h4 className="font-bold text-slate-800">{pool.title}</h4>
                          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-100 flex items-center gap-1">
                             <Coins size={12}/> {pool.entryFee}
                          </span>
                       </div>
                       <p className="text-xs text-slate-400 mb-3">Criado por: {pool.creatorName}</p>
                       <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                          <span className="flex items-center gap-1"><Users size={14}/> {pool.participantsCount} part.</span>
                          <span className="flex items-center gap-1"><Trophy size={14} className="text-yellow-500"/> {pool.prizePool}</span>
                       </div>
                       <div className="flex gap-2">
                           <button 
                               onClick={() => openPoolRanking(pool)}
                               className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                           >
                               Ranking
                           </button>

                           <button 
                              onClick={() => joinPool(pool.id)} 
                              disabled={user.role !== 'pro'}
                              className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2
                                ${user.role === 'pro' 
                                    ? 'bg-slate-900 text-white hover:bg-slate-800' 
                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                              title={user.role !== 'pro' ? "Exclusivo para PRO" : ""}
                           >
                              {user.role !== 'pro' && <Lock size={14} />}
                              Entrar
                           </button>
                       </div>
                    </div>
                 ))
              ) : (
                 <div className="col-span-full text-center py-10 text-slate-400">
                    Nenhum bolão encontrado.
                 </div>
              )
           )}
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('login');
  const [user, setUser] = useState<User | null>(null);
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [pools, setPools] = useState<Pool[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, roundsData, poolsData, logsData] = await Promise.all([
          api.getUsers(),
          api.getRounds(),
          api.getPools(),
          api.getLogs()
        ]);
        setAllUsers(usersData);
        setAllRounds(roundsData);
        setPools(poolsData);
        setLogs(logsData);
      } catch (error) {
        console.warn("API Offline or connection refused. Loading MOCK DATA for safety.");
        setAllUsers(MOCK_ALL_USERS);
        setAllRounds(MOCK_ROUNDS);
        setPools(MOCK_POOLS);
        setLogs(MOCK_LOGS);
      }
    };
    fetchData();
  }, []);

  const [showCreatePool, setShowCreatePool] = useState(false);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [lastBetSelections, setLastBetSelections] = useState<Selection[]>([]);
  const [showViewBetModal, setShowViewBetModal] = useState(false);
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [regName, setRegName] = useState('');
  const [regCpf, setRegCpf] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [isEmailManual, setIsEmailManual] = useState(false);

  useEffect(() => {
    if (!isEmailManual && regName) {
      const slug = regName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '');
      if (slug) {
        setRegEmail(`${slug}@gmail.com`);
      }
    }
  }, [regName, isEmailManual]);

  const refreshData = async () => {
      try {
          const [u, r, p, l] = await Promise.all([
              api.getUsers(),
              api.getRounds(),
              api.getPools(),
              api.getLogs()
          ]);
          setAllUsers(u);
          setAllRounds(r);
          setPools(p);
          setLogs(l);
          
          if (user) {
              const updatedMe = u.find((x: User) => x.id === user.id);
              if (updatedMe) setUser(updatedMe);
          }
      } catch (e) { console.error(e); }
  };

  const handleGoogleLogin = () => {
     setTimeout(() => {
        const mockGoogleName = "Usuário Google";
        const mockGoogleEmail = "usuario.google@gmail.com";
        setRegName(mockGoogleName);
        setRegEmail(mockGoogleEmail);
        setIsEmailManual(true);
        alert("Dados recuperados do Google com sucesso!");
     }, 500);
  }

  const mockRankings = useMemo(() => {
      const currentId = user ? user.id : 'guest';
      const general: RankingEntry[] = [];
      for (let i = 1; i <= 50; i++) {
        general.push({
          userId: `u-${i}`,
          userName: `Treinador ${i}`,
          points: Math.floor(1500 - (i * 15) + (Math.random() * 10)),
          position: i,
          isPro: i % 4 === 0
        });
      }
      general.push({ userId: currentId, userName: 'Você', points: 1250, position: 18, isPro: user?.role === 'pro' });
      general.sort((a,b) => b.points - a.points);
      general.forEach((r, i) => r.position = i + 1);

      const pro = general.filter(r => r.isPro || r.userId === currentId);
      pro.forEach((r, i) => r.position = i + 1);
      
      return { general, pro };
  }, [user]);

  const [rankingModalType, setRankingModalType] = useState<'general' | 'pro' | 'pool' | null>(null);
  const [selectedPoolRanking, setSelectedPoolRanking] = useState<{title: string, data: RankingEntry[]} | null>(null);

  const activeRound = allRounds[0];

  const handleLogin = async (role: 'user' | 'pro' | 'admin') => {
    const demoUser = allUsers.find(u => u.role === role);
    if (demoUser) {
        setUser(demoUser);
        setCurrentPage('dashboard');
        api.createLog({ action: 'Login', details: `Usuário ${role} logou`, type: 'info', userId: demoUser.id, userName: demoUser.name })
           .catch(() => {});
    } else {
        alert(`Nenhum usuário com permissão ${role} encontrado. Crie uma conta primeiro.`);
        setCurrentPage('login');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
    setHasPlacedBet(false);
    setLastBetSelections([]);
    setIsRegistering(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regCpf || !regPassword) {
      alert("Por favor preencha Nome, CPF e Senha.");
      return;
    }
    if (!validateCPF(regCpf)) {
      alert("CPF inválido.");
      return;
    }

    try {
        const newUser = await api.register({
            name: regName,
            email: regEmail,
            cpf: regCpf,
            password: regPassword,
            phone: regPhone,
            role: 'user'
        });
        
        setUser(newUser);
        setAllUsers([...allUsers, newUser]);
        await api.createLog({ action: 'Cadastro', details: 'Novo usuário registrado', type: 'success', userId: newUser.id, userName: newUser.name });
        
        setCurrentPage('dashboard');
        setIsRegistering(false);
        alert("Conta criada com sucesso! Bem-vindo ao Fantasy12.");
    } catch (err: any) {
        alert(err.message || "Erro ao criar conta");
    }
  };

  const handleUpdateProfile = async (updatedUser: User) => {
     try {
         const result = await api.updateUser(updatedUser.id, updatedUser);
         setUser(result);
         setAllUsers(allUsers.map(u => u.id === result.id ? result : u));
         await api.createLog({ action: 'Perfil', details: 'Usuário atualizou dados', type: 'info', userId: result.id, userName: result.name });
         alert("Perfil atualizado com sucesso!");
         setCurrentPage('dashboard');
     } catch (err) {
         alert("Erro ao atualizar perfil");
     }
  };

  const handleCreatePool = async (newPool: Pool) => {
    if (!user) return;
    try {
        const created = await api.createPool({ ...newPool, creatorId: user.id });
        setPools([...pools, created]);
        await api.createLog({ action: 'Criar Bolão', details: `Bolão "${created.title}" criado`, type: 'success', userId: user.id, userName: user.name });
    } catch (err) {
        alert("Erro ao criar bolão");
    }
  };

  const handleJoinPool = async (poolId: string) => {
    if (!user) return;

    if (user.role !== 'pro') {
       alert("Apenas usuários PRO podem participar de Bolões Exclusivos. Atualize sua conta para competir!");
       return;
    }

    try {
        await api.joinPool(poolId, user.id);
        await refreshData();
        await api.createLog({ action: 'Entrar Bolão', details: `Entrou no bolão ID ${poolId}`, type: 'success', userId: user.id, userName: user.name });
        alert(`Você entrou no bolão com sucesso!`);
    } catch (err: any) {
        alert(err.message || "Erro ao entrar no bolão");
    }
  };

  const handleOpenPoolRanking = (pool: Pool) => {
      const poolRankings: RankingEntry[] = [];
      const participants = pool.participants.length > 0 ? pool.participants : ['u1', 'u2'];

      participants.forEach((pid, index) => {
          poolRankings.push({
              userId: pid,
              userName: `Participante ${index + 1}`, 
              points: Math.floor(100 + Math.random() * 50),
              position: index + 1,
              isPro: false
          });
      });
      
      poolRankings.sort((a,b) => b.points - a.points);
      poolRankings.forEach((r, i) => r.position = i + 1);

      setSelectedPoolRanking({
          title: `Ranking: ${pool.title}`,
          data: poolRankings
      });
      setRankingModalType('pool');
  }

  const handleBuy = async (item: string, cost: number, type: 'chips' | 'fichas' | 'powerup', rewardKey?: string, rewardAmount?: number) => {
    if (!user) return;
    
    // Determine how many chips to add if buying chips
    let fichasAdded = 0;
    if (type === 'fichas') {
         fichasAdded = item === '10 Fichas' ? 10 : item === '20 Fichas' ? 20 : 100;
    }

    // Call API for processing payment (which updates DB)
    try {
        // We only simulate payment processing for now
        // For PowerUps (buying with chips), we'd need a different endpoint or handle it in updateUser logic as before
        // But requested was "processPayment" API
        
        if (type === 'fichas') {
             const updatedUser = await api.processPayment({
                 userId: user.id,
                 packageType: item,
                 priceCents: cost * 100, // Convert to cents
                 fichasAdded: fichasAdded
             });
             setUser(updatedUser);
             setAllUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
             alert(`Compra de ${item} realizada com sucesso!`);
        } else {
             // Logic for buying powerups with chips (Client-side validation first)
             if (user.balance < cost) {
                 alert("Saldo insuficiente!");
                 return;
             }
             
             let newInventory = { ...user.inventory };
             if (rewardKey === 'doubles') {
                 newInventory.doubles += (rewardAmount || 0);
             } else if (rewardKey === 'superDoubles') {
                 newInventory.superDoubles += (rewardAmount || 0);
             }

             const updatedUser = await api.updateUser(user.id, {
                 balance: user.balance - cost,
                 inventory: newInventory
             });
             setUser(updatedUser);
             setAllUsers(allUsers.map(u => u.id === user.id ? updatedUser : u));
             alert(`Você trocou ${cost} fichas por ${item}!`);
             await api.createLog({ action: 'Troca', details: `Trocou fichas por ${item}`, type: 'info', userId: user.id, userName: user.name });
        }
    } catch (err) {
        console.error(err);
        alert("Erro ao processar transação.");
    }
  };

  const handleSubmitBet = async (selections: Selection[], cost: number) => {
    alert(`Aposta enviada! Custo: ${cost} fichas.`);
    if (user) {
        await api.createLog({ action: 'Aposta', details: `Realizou aposta na rodada ${activeRound.title}`, type: 'success', userId: user.id, userName: user.name }).catch(() => {});
    }
    setLastBetSelections(selections);
    setHasPlacedBet(true);
    setCurrentPage('dashboard');
  };

  if (currentPage === 'login' && !user) {
    if (isRegistering) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 animate-in fade-in zoom-in duration-300">
           <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full relative">
              <button 
                onClick={() => setIsRegistering(false)}
                className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold"
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              
              <div className="text-center mb-6 mt-6">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30">
                  <UserPlus className="text-white" size={24} />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Criar Nova Conta</h2>
                <p className="text-slate-500 text-sm">Preencha os dados para começar a apostar.</p>
              </div>

              <div className="mb-6">
                 <button 
                    onClick={handleGoogleLogin}
                    className="w-full bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
                 >
                    <div className="w-5 h-5">
                       <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                       </svg>
                    </div>
                    Cadastrar com Google
                 </button>
                 <div className="relative flex py-4 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Ou preencha</span>
                    <div className="flex-grow border-t border-slate-200"></div>
                 </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        value={regName}
                        onChange={e => setRegName(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="Seu Nome"
                        required
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CPF *</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        value={regCpf}
                        onChange={e => setRegCpf(formatCPF(e.target.value))}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="000.000.000-00"
                        maxLength={14}
                        required
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="password"
                        value={regPassword}
                        onChange={e => setRegPassword(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="******"
                        required
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp (Opcional)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="text"
                        value={regPhone}
                        onChange={e => setRegPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                      <input 
                        type="email"
                        value={regEmail}
                        onChange={e => {
                           setRegEmail(e.target.value);
                           setIsEmailManual(true);
                        }}
                        className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none ${isEmailManual ? 'border-slate-300 bg-white' : 'border-slate-200 bg-slate-50 text-slate-600'}`}
                        placeholder="seu@email.com"
                      />
                    </div>
                    {!isEmailManual && regName && (
                       <p className="text-[10px] text-slate-400 mt-1 italic">Email gerado automaticamente. Clique para editar.</p>
                    )}
                 </div>

                 <button 
                   type="submit" 
                   className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-600/20 transition-all active:scale-95 mt-4"
                 >
                   Confirmar Cadastro
                 </button>
              </form>
           </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/30">
            <span className="font-bold text-3xl text-white italic">F</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Fantasy<span className="text-orange-500">12</span></h1>
          <p className="text-slate-500 mb-8">Aposte na rodada, desafie seus amigos e suba no ranking.</p>
          
          <div className="space-y-3">
            <button 
              onClick={() => handleLogin('user')}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors border border-slate-200"
            >
              Entrar como Usuário
            </button>
            <button 
              onClick={() => handleLogin('pro')}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-lg transition-colors shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
            >
              <Crown size={18} className="text-yellow-400" />
              Entrar como PRO
            </button>
            
            <div className="pt-4 border-t border-slate-100 mt-4">
               <button 
                  onClick={() => setIsRegistering(true)}
                  className="w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-md shadow-green-600/20 flex items-center justify-center gap-2"
               >
                  <UserPlus size={18} /> Criar Nova Conta
               </button>
            </div>

            <button 
              onClick={() => handleLogin('admin')}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 underline mt-2"
            >
              Acesso Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      onNavigate={setCurrentPage} 
      currentPage={currentPage}
      onCreatePool={() => setShowCreatePool(true)}
      onProfileClick={() => setCurrentPage('profile')}
    >
      {currentPage === 'dashboard' && user && activeRound && (
        <Dashboard 
           user={user} 
           onNavigate={setCurrentPage}
           pools={pools}
           joinPool={handleJoinPool}
           openRankingModal={setRankingModalType}
           openPoolRanking={handleOpenPoolRanking}
           currentRankings={mockRankings}
           hasBet={hasPlacedBet}
           onOpenViewBet={() => setShowViewBetModal(true)}
           activeRound={activeRound}
        />
      )}
      
      {currentPage === 'betting' && user && activeRound && (
        <BettingPage 
          round={activeRound} 
          user={user}
          onSubmitBet={handleSubmitBet}
        />
      )}

      {currentPage === 'bar' && (
        <BarPage onBuy={handleBuy} />
      )}

      {currentPage === 'profile' && user && (
        <ProfilePage 
          user={user}
          onSave={handleUpdateProfile}
          onCancel={() => setCurrentPage('dashboard')}
        />
      )}

      {currentPage === 'admin' && (
        <AdminPage 
          rounds={allRounds}
          setRounds={setAllRounds}
          users={allUsers}
          setUsers={setAllUsers}
          logs={logs}
        />
      )}

      {showCreatePool && user && (
        <CreatePoolModal 
           currentUser={user} 
           onClose={() => setShowCreatePool(false)} 
           onSave={handleCreatePool} 
        />
      )}

      {rankingModalType && (
         <RankingModal 
            title={
                rankingModalType === 'general' ? 'Classificação Geral' : 
                rankingModalType === 'pro' ? 'Classificação PRO' : 
                selectedPoolRanking?.title || 'Classificação'
            }
            data={
                rankingModalType === 'general' ? mockRankings.general : 
                rankingModalType === 'pro' ? mockRankings.pro :
                selectedPoolRanking?.data || []
            }
            onClose={() => {
                setRankingModalType(null);
                setSelectedPoolRanking(null);
            }}
         />
      )}

      {showViewBetModal && lastBetSelections.length > 0 && activeRound && (
         <ViewBetModal 
            selections={lastBetSelections}
            round={activeRound}
            onClose={() => setShowViewBetModal(false)}
         />
      )}

    </Layout>
  );
};

export default App;