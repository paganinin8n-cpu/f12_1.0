import React, { useState, useMemo } from 'react';
import { Layout } from './components/Layout';
import { BettingPage } from './pages/BettingPage';
import { User, Selection, Pool, RankingEntry, Round } from './types';
import { getActiveRound, MOCK_USER, MOCK_PRO_USER, MOCK_ADMIN } from './services/mockData';
import { 
  CheckCircle, Trophy, ArrowRight, Beer, Users, Crown, 
  Calendar, Zap, Coins, ShoppingBag, Search, X, 
  ClipboardList, PlayCircle, PlusCircle, Star, Check, Eye
} from 'lucide-react';

// --- MOCK DATA GENERATORS ---

const generateMockRankings = (currentUserId: string): { general: RankingEntry[], pro: RankingEntry[] } => {
  const general: RankingEntry[] = [];
  // Generate top 50 random users
  for (let i = 1; i <= 50; i++) {
    general.push({
      userId: `u-${i}`,
      userName: `Treinador ${i}`,
      points: Math.floor(1500 - (i * 15) + (Math.random() * 10)),
      position: i,
      isPro: i % 4 === 0
    });
  }

  // Ensure current user is somewhere (e.g., pos 18)
  const userPos = 18;
  const existingUserIndex = general.findIndex(r => r.position === userPos);
  if (existingUserIndex !== -1) {
      general[existingUserIndex] = {
        userId: currentUserId,
        userName: 'Você',
        points: 1250,
        position: userPos,
        isPro: false
      };
  } else {
       general.push({
        userId: currentUserId,
        userName: 'Você',
        points: 1250,
        position: userPos,
        isPro: false
      });
  }

  // Sort just in case
  general.sort((a, b) => b.points - a.points);
  general.forEach((r, i) => r.position = i + 1);

  // Filter Pro
  const pro = general.filter(r => r.isPro || (r.userId === currentUserId && r.isPro));
  // Re-rank pro
  pro.sort((a, b) => b.points - a.points);
  pro.forEach((r, i) => r.position = i + 1);

  return { general, pro };
};

const MOCK_POOLS: Pool[] = [
  { id: 'p1', title: 'Bolão da Firma', creatorName: 'Chefe', entryFee: 10, participantsCount: 12, participants: ['u1'], prizePool: 120, status: 'open', startDate: '2025-10-20', endDate: '2025-11-20' },
  { id: 'p2', title: 'Elite do Futebol', creatorName: 'Pro Player', entryFee: 50, participantsCount: 5, participants: [], prizePool: 250, status: 'open', startDate: '2025-10-21', endDate: '2025-11-21' },
  { id: 'p3', title: 'Amigos do Churrasco', creatorName: 'Zezinho', entryFee: 5, participantsCount: 20, participants: [], prizePool: 100, status: 'open', startDate: '2025-10-22', endDate: '2025-11-22' },
];

// --- COMPONENTS ---

// 1. Create Pool Modal
const CreatePoolModal = ({ onClose, onSave, currentUser }: { onClose: () => void, onSave: (pool: Pool) => void, currentUser: User }) => {
  const [title, setTitle] = useState('');
  const [fee, setFee] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPool: Pool = {
      id: `p-${Date.now()}`,
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
            <X size={24} />
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

// 2. Ranking Modal (Top 30)
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
            <X size={20} className="text-slate-500" />
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

// 3. View Bet Modal (Read-only visual)
const ViewBetModal = ({ selections, round, onClose }: { selections: Selection[], round: Round, onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl p-0 max-w-2xl w-full shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-orange-500" size={20} />
            <h3 className="text-lg font-bold">Seu Palpite - {round.title}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {round.games.map(game => {
            const userSelection = selections.find(s => s.gameId === game.id);
            if (!userSelection) return null; // Should not happen for a placed bet

            const outcomes = userSelection.outcome;
            const isDouble = userSelection.isDouble;
            const isSuper = userSelection.isSuperDouble;

            return (
              <div key={game.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex justify-between items-center mb-3 border-b border-slate-50 pb-2">
                   <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">JOGO {game.order}</span>
                   <div className="flex gap-2">
                      {isDouble && <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1"><Zap size={10}/> DUPLA</span>}
                      {isSuper && <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1"><Crown size={10}/> SUPER</span>}
                   </div>
                </div>

                <div className="grid grid-cols-3 gap-2 items-center">
                  {/* Team A */}
                  <div className={`p-3 rounded-lg text-center border-2 transition-colors relative
                    ${outcomes.includes('A') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    <span className="font-bold text-sm block leading-tight">{game.teamA}</span>
                    {outcomes.includes('A') && <Check size={12} className="absolute top-1 right-1 text-white/80" />}
                  </div>

                  {/* Draw */}
                  <div className={`p-3 rounded-lg text-center border-2 transition-colors relative
                    ${outcomes.includes('Draw') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    <span className="font-bold text-sm block">Empate</span>
                    {outcomes.includes('Draw') && <Check size={12} className="absolute top-1 right-1 text-white/80" />}
                  </div>

                  {/* Team B */}
                  <div className={`p-3 rounded-lg text-center border-2 transition-colors relative
                    ${outcomes.includes('B') 
                      ? 'bg-green-600 border-green-600 text-white shadow-sm' 
                      : 'bg-slate-50 border-transparent text-slate-400'}`}>
                    <span className="font-bold text-sm block leading-tight">{game.teamB}</span>
                    {outcomes.includes('B') && <Check size={12} className="absolute top-1 right-1 text-white/80" />}
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

// 4. Bar Page (Menu Style)
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
        {/* Section 1: Fichas (Cashier) */}
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
             {/* R$ 5 */}
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

             {/* R$ 10 */}
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

             {/* R$ 50 */}
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

        {/* Section 2: Power Ups (Menu) */}
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
                   {/* 1 Dupla */}
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
                   {/* 3 Duplas */}
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
                   {/* 10 Duplas */}
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
                   {/* 1 Super */}
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
                   {/* 4 Super */}
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

// 5. Dashboard (Updated with Rankings, Pools and View Bet)
const Dashboard = ({ 
  user, 
  onNavigate, 
  pools, 
  joinPool,
  openRankingModal,
  openPoolRanking,
  currentRankings,
  hasBet,
  onOpenViewBet
}: { 
  user: User, 
  onNavigate: (p: string) => void,
  pools: Pool[],
  joinPool: (id: string) => void,
  openRankingModal: (type: 'general' | 'pro') => void,
  openPoolRanking: (pool: Pool) => void,
  currentRankings: { general: RankingEntry[], pro: RankingEntry[] },
  hasBet: boolean,
  onOpenViewBet: () => void
}) => {
  const [rankingTab, setRankingTab] = useState<'general' | 'pro'>('general');
  const [poolTab, setPoolTab] = useState<'my' | 'all'>('my');
  const [searchPool, setSearchPool] = useState('');

  const activeRound = getActiveRound();
  
  // Filter Rankings
  const displayedRankings = rankingTab === 'general' ? currentRankings.general : currentRankings.pro;
  const top5 = displayedRankings.slice(0, 5);
  const userRankEntry = displayedRankings.find(r => r.userId === user.id);
  const isUserInTop5 = userRankEntry && userRankEntry.position <= 5;

  // Filter Pools
  const myPools = pools.filter(p => p.participants.includes(user.id) || p.creatorName === user.name); 
  const availablePools = pools.filter(p => !p.participants.includes(user.id) && p.creatorName !== user.name);
  
  const filteredAvailable = availablePools.filter(p => p.title.toLowerCase().includes(searchPool.toLowerCase()));

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. Welcome Banner (Fun/Boteco Style) */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-2xl relative overflow-hidden border-2 border-orange-500/20">
        {/* Background Patterns */}
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
                A <span className="text-orange-400 font-bold">{activeRound.title}</span> já começou e a galera no bar tá dizendo que você não acerta nem jogo treino.
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
              {/* Custom F12 Logo Icon */}
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

      {/* 2. Rankings Section */}
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
                
                {/* User Pinned Row if not in top 5 */}
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

      {/* CTA to Bar */}
      <div className="py-2">
        <button
          onClick={() => onNavigate('bar')}
          className="w-full relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-orange-500 p-6 text-white shadow-xl shadow-orange-500/20 group hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-1"
        >
          {/* Decorative Elements */}
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

      {/* 3. Pools Section (Bolões) */}
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
                       <button onClick={() => joinPool(pool.id)} className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors">
                          Entrar no Bolão
                       </button>
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

const AdminPage = () => (
  <div className="text-center py-12">
    <h2 className="text-2xl font-bold text-slate-800">Painel do Administrador</h2>
    <p className="text-slate-500 mt-2">Funcionalidades de gestão de rodadas e usuários virão aqui.</p>
  </div>
);

// --- MAIN APP ---

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(MOCK_USER); // Default to standard user
  
  // App Data State
  const [pools, setPools] = useState<Pool[]>(MOCK_POOLS);
  const [showCreatePool, setShowCreatePool] = useState(false);
  const [hasPlacedBet, setHasPlacedBet] = useState(false);
  const [lastBetSelections, setLastBetSelections] = useState<Selection[]>([]);
  const [showViewBetModal, setShowViewBetModal] = useState(false);
  
  // Rankings State
  const [rankings] = useState(() => generateMockRankings(user ? user.id : 'u1'));
  const [rankingModalType, setRankingModalType] = useState<'general' | 'pro' | 'pool' | null>(null);
  const [selectedPoolRanking, setSelectedPoolRanking] = useState<{title: string, data: RankingEntry[]} | null>(null);

  // Actions
  const handleLogin = (role: 'user' | 'pro' | 'admin') => {
    if (role === 'admin') setUser(MOCK_ADMIN);
    else if (role === 'pro') setUser(MOCK_PRO_USER);
    else setUser(MOCK_USER);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
    setHasPlacedBet(false);
    setLastBetSelections([]);
  };

  const handleCreatePool = (newPool: Pool) => {
    setPools([...pools, newPool]);
  };

  const handleJoinPool = (poolId: string) => {
    if (!user) return;
    const pool = pools.find(p => p.id === poolId);
    if (!pool) return;

    if (user.balance < pool.entryFee) {
       alert("Saldo insuficiente para entrar neste bolão. Vá ao Bar comprar fichas!");
       return;
    }

    // Deduct balance and add to pool
    setUser({ ...user, balance: user.balance - pool.entryFee });
    setPools(pools.map(p => {
       if (p.id === poolId) {
          return { 
             ...p, 
             participants: [...p.participants, user.id],
             participantsCount: p.participantsCount + 1,
             prizePool: p.prizePool + pool.entryFee
          };
       }
       return p;
    }));
    alert(`Você entrou no bolão "${pool.title}" com sucesso!`);
  };

  const handleOpenPoolRanking = (pool: Pool) => {
      // Mock generating a ranking for this pool based on participants
      const poolRankings: RankingEntry[] = [];
      const participants = pool.participants.length > 0 ? pool.participants : ['u1', 'u2', 'u3']; // Fallback for mock

      participants.forEach((pid, index) => {
          poolRankings.push({
              userId: pid,
              userName: pid === user?.id ? 'Você' : `Participante ${index + 1}`,
              points: Math.floor(100 + Math.random() * 50),
              position: index + 1,
              isPro: false
          });
      });
      
      // Ensure User is in if participating
      if (pool.participants.includes(user?.id || '')) {
          const uEntry = poolRankings.find(r => r.userId === user?.id);
          if (!uEntry) {
              poolRankings.push({
                  userId: user!.id,
                  userName: 'Você',
                  points: 120,
                  position: 1,
                  isPro: user!.role === 'pro'
              });
          }
      }

      poolRankings.sort((a,b) => b.points - a.points);
      poolRankings.forEach((r, i) => r.position = i + 1);

      setSelectedPoolRanking({
          title: `Ranking: ${pool.title}`,
          data: poolRankings
      });
      setRankingModalType('pool');
  }

  const handleBuy = (item: string, cost: number, type: 'chips' | 'fichas' | 'powerup', rewardKey?: string, rewardAmount?: number) => {
    alert(`Simulação: Você comprou ${item} por ${type === 'fichas' ? 'R$' : ''} ${cost} ${type !== 'fichas' ? 'Fichas' : ''}.`);
    
    if (user) {
        let updatedUser = { ...user };
        
        if (type === 'fichas') {
             const addedChips = item === '10 Fichas' ? 10 : item === '20 Fichas' ? 20 : 100;
             updatedUser.balance += addedChips;
        } else if (type === 'powerup' && rewardKey && rewardAmount) {
             // Deduct cost
             if (updatedUser.balance < cost) {
                 alert("Saldo insuficiente!");
                 return;
             }
             updatedUser.balance -= cost;
             
             // Add to inventory
             if (rewardKey === 'doubles') {
                 updatedUser.inventory.doubles += rewardAmount;
             } else if (rewardKey === 'superDoubles') {
                 updatedUser.inventory.superDoubles += rewardAmount;
             }
        }
        
        setUser(updatedUser);
    }
  };

  const handleSubmitBet = (selections: Selection[], cost: number) => {
    alert(`Aposta enviada! Custo: ${cost} fichas.`);
    setLastBetSelections(selections);
    setHasPlacedBet(true);
    setCurrentPage('dashboard');
  };

  if (!user) {
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
            <button 
              onClick={() => handleLogin('admin')}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 underline"
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
    >
      {currentPage === 'dashboard' && (
        <Dashboard 
           user={user} 
           onNavigate={setCurrentPage}
           pools={pools}
           joinPool={handleJoinPool}
           openRankingModal={setRankingModalType}
           openPoolRanking={handleOpenPoolRanking}
           currentRankings={rankings}
           hasBet={hasPlacedBet}
           onOpenViewBet={() => setShowViewBetModal(true)}
        />
      )}
      
      {currentPage === 'betting' && (
        <BettingPage 
          round={getActiveRound()} 
          user={user}
          onSubmitBet={handleSubmitBet}
        />
      )}

      {currentPage === 'bar' && (
        <BarPage onBuy={handleBuy} />
      )}

      {currentPage === 'admin' && (
        <AdminPage />
      )}

      {/* Modals */}
      {showCreatePool && (
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
                rankingModalType === 'general' ? rankings.general : 
                rankingModalType === 'pro' ? rankings.pro :
                selectedPoolRanking?.data || []
            }
            onClose={() => {
                setRankingModalType(null);
                setSelectedPoolRanking(null);
            }}
         />
      )}

      {showViewBetModal && lastBetSelections.length > 0 && (
         <ViewBetModal 
            selections={lastBetSelections}
            round={getActiveRound()}
            onClose={() => setShowViewBetModal(false)}
         />
      )}

    </Layout>
  );
};

export default App;