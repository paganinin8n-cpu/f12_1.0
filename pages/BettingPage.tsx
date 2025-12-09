import React, { useState, useEffect, useMemo } from 'react';
import { Round, Prediction, Selection, User } from '../types';
import { GameCard } from '../components/GameCard';
import { Calculator, ChevronRight, Coins, Ticket, Crown, Zap, ShoppingBag } from 'lucide-react';

interface BettingPageProps {
  round: Round;
  user: User;
  onSubmitBet: (selections: Selection[], cost: number) => void;
}

export const BettingPage: React.FC<BettingPageProps> = ({ round, user, onSubmitBet }) => {
  // Map gameId to Selections
  const [selectionsMap, setSelectionsMap] = useState<Record<string, Selection>>({});
  const [baseStake] = useState(10); // 10 Fichas

  // Free resources logic
  const isPro = user.role === 'pro';
  const freeDoublesLimit = isPro ? 4 : 2; // Updated: User 2, Pro 4
  const freeSuperDoubleLimit = isPro ? 1 : 0; // Updated: Pro 1, User 0

  // Paid Inventory (from user object)
  const paidDoubles = user.inventory?.doubles || 0;
  const paidSuperDoubles = user.inventory?.superDoubles || 0;
  
  // We assume for this prototype that the user always has their "Daily/Round" free ticket available
  const hasFreeTicket = true; 

  // Initialize map
  useEffect(() => {
    const initialMap: Record<string, Selection> = {};
    round.games.forEach(g => {
      initialMap[g.id] = {
        gameId: g.id,
        outcome: [],
        isDouble: false,
        isSuperDouble: false
      };
    });
    setSelectionsMap(initialMap);
  }, [round]);

  // Count current usage
  const currentDoublesUsed = Object.values(selectionsMap).filter((s: Selection) => s.isDouble).length;
  const currentSupersUsed = Object.values(selectionsMap).filter((s: Selection) => s.isSuperDouble).length;

  const handleToggleSelection = (gameId: string, outcome: Prediction) => {
    setSelectionsMap(prev => {
      const current = prev[gameId];
      if (!current) return prev;

      let newOutcomes = [...current.outcome];
      const exists = newOutcomes.includes(outcome);
      const maxSelections = current.isSuperDouble ? 3 : (current.isDouble ? 2 : 1);

      if (exists) {
        newOutcomes = newOutcomes.filter(o => o !== outcome);
      } else {
        if (newOutcomes.length < maxSelections) {
          newOutcomes.push(outcome);
        } else {
          if (maxSelections === 1) {
             newOutcomes = [outcome];
          } 
        }
      }

      return {
        ...prev,
        [gameId]: {
          ...current,
          outcome: newOutcomes
        }
      };
    });
  };

  const toggleMultiplier = (gameId: string, type: 'double' | 'super') => {
    setSelectionsMap(prev => {
      const current = prev[gameId];
      if (!current) return prev;

      let isDouble = current.isDouble;
      let isSuperDouble = current.isSuperDouble;
      let newOutcomes = current.outcome;

      if (type === 'double') {
        const willBeDouble = !isDouble;
        const totalDoublesAvailable = freeDoublesLimit + paidDoubles;

        // Check limits before enabling
        if (willBeDouble && currentDoublesUsed >= totalDoublesAvailable) {
            alert(`Você atingiu o limite total de Duplas (Grátis + Pagas). Vá ao Bar comprar mais!`);
            return prev;
        }

        isDouble = willBeDouble;
        if (isDouble) isSuperDouble = false;
        
        // Truncate if turning off
        if (!isDouble && !isSuperDouble && newOutcomes.length > 1) {
            newOutcomes = [newOutcomes[0]];
        }
      } else {
        // Super Double
        const willBeSuper = !isSuperDouble;
        const totalSupersAvailable = freeSuperDoubleLimit + paidSuperDoubles;

        // Check limits
        if (willBeSuper && totalSupersAvailable === 0) {
            alert("Você não possui Super Duplas disponíveis. Usuários PRO ganham 1 grátis, ou compre no Bar.");
            return prev;
        }
        if (willBeSuper && currentSupersUsed >= totalSupersAvailable) {
             alert(`Você atingiu o limite total de Super Duplas. Vá ao Bar comprar mais!`);
             return prev;
        }

        isSuperDouble = willBeSuper;
        if (isSuperDouble) isDouble = false;
        
        // Truncate if turning off
        if (!isDouble && !isSuperDouble && newOutcomes.length > 1) {
            newOutcomes = [newOutcomes[0]];
        }
      }

      return {
        ...prev,
        [gameId]: {
          ...current,
          isDouble,
          isSuperDouble,
          outcome: newOutcomes
        }
      };
    });
  };

  const calculatedCost = useMemo(() => {
    if (hasFreeTicket) return 0;
    
    // Normal calculation if not free ticket
    let multiplier = 1;
    Object.values(selectionsMap).forEach((sel: Selection) => {
      if (sel.isDouble) multiplier *= 2;
      if (sel.isSuperDouble) multiplier *= 4;
    });
    return baseStake * multiplier;
  }, [selectionsMap, baseStake, hasFreeTicket]);

  const filledGamesCount = Object.values(selectionsMap).filter((s: Selection) => s.outcome.length > 0).length;
  const isReady = filledGamesCount === 12;
  const incompleteCount = 12 - filledGamesCount;

  // Calculate remaining inventories for display
  const remainingFreeDoubles = Math.max(0, freeDoublesLimit - currentDoublesUsed);
  const remainingPaidDoubles = paidDoubles - Math.max(0, currentDoublesUsed - freeDoublesLimit);

  const remainingFreeSupers = Math.max(0, freeSuperDoubleLimit - currentSupersUsed);
  const remainingPaidSupers = paidSuperDoubles - Math.max(0, currentSupersUsed - freeSuperDoubleLimit);

  return (
    <div className="pb-24">
      <div className="mb-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Análise: {round.title}</h2>
                <div className="flex items-center text-sm text-slate-500 mt-1 gap-2">
                <span className={`px-2 py-0.5 rounded text-white text-xs ${round.status === 'open' ? 'bg-green-500' : 'bg-slate-400'}`}>
                    {round.status === 'open' ? 'ABERTA' : round.status.toUpperCase()}
                </span>
                <span>Fecha em: {new Date(round.endDate).toLocaleDateString()}</span>
                </div>
            </div>
            
            {hasFreeTicket && (
                <div className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-yellow-200">
                    <Ticket size={16} />
                    BILHETE GRÁTIS ATIVO
                </div>
            )}
        </div>
      </div>

      {/* Free Boosters Status - Split between Free and Paid */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
         <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
           <span className="text-sm font-bold text-slate-700">Seus bônus da rodada:</span>
           <span className="text-[10px] text-slate-400">*Bônus grátis são consumidos primeiro</span>
         </div>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
             {/* Doubles Section */}
             <div className="flex flex-col gap-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                 <div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
                     <Zap size={16} /> Duplas (2x)
                 </div>
                 <div className="flex gap-4 text-xs">
                     <div className={`flex items-center gap-1 ${remainingFreeDoubles > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                         <span>Grátis:</span>
                         <span className="bg-white px-2 py-0.5 rounded border border-blue-200">{remainingFreeDoubles}/{freeDoublesLimit}</span>
                     </div>
                     <div className={`flex items-center gap-1 ${remainingPaidDoubles > 0 ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                         <span>Pagas (Estoque):</span>
                         <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{remainingPaidDoubles}</span>
                     </div>
                 </div>
             </div>

             {/* Super Doubles Section */}
             <div className="flex flex-col gap-2 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                 <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                     <Crown size={16} /> Super (4x)
                 </div>
                 <div className="flex gap-4 text-xs">
                     <div className={`flex items-center gap-1 ${isPro && remainingFreeSupers > 0 ? 'text-purple-600 font-bold' : 'text-slate-400'}`}>
                         <span>{isPro ? 'Grátis:' : 'Grátis (PRO):'}</span>
                         <span className="bg-white px-2 py-0.5 rounded border border-purple-200">{remainingFreeSupers}/{freeSuperDoubleLimit}</span>
                     </div>
                     <div className={`flex items-center gap-1 ${remainingPaidSupers > 0 ? 'text-green-600 font-bold' : 'text-slate-400'}`}>
                         <span>Pagas (Estoque):</span>
                         <span className="bg-white px-2 py-0.5 rounded border border-slate-200">{remainingPaidSupers}</span>
                     </div>
                 </div>
             </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Game List */}
        <div className="lg:col-span-2">
          {round.games.map(game => {
            const selection = selectionsMap[game.id] || { outcome: [], isDouble: false, isSuperDouble: false };
            const totalDoubles = freeDoublesLimit + paidDoubles;
            const totalSupers = freeSuperDoubleLimit + paidSuperDoubles;

            return (
              <div key={game.id} className="relative group">
                 <GameCard 
                    game={game}
                    selections={selection.outcome}
                    onToggleSelection={(outcome) => handleToggleSelection(game.id, outcome)}
                    isDouble={selection.isDouble}
                    isSuperDouble={selection.isSuperDouble}
                    // Multiplier Props
                    onToggleDouble={() => toggleMultiplier(game.id, 'double')}
                    onToggleSuper={() => toggleMultiplier(game.id, 'super')}
                    disableDouble={!selection.isDouble && currentDoublesUsed >= totalDoubles}
                    disableSuper={!selection.isSuperDouble && currentSupersUsed >= totalSupers}
                    isPro={isPro} // Kept for logic internal to card if needed, though mostly handled here
                 />
              </div>
            );
          })}
        </div>

        {/* Floating/Sticky Sidebar for Ticket Summary */}
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-xl shadow-lg border border-slate-200 p-6">
             <h3 className="text-lg font-bold border-b border-slate-100 pb-4 mb-4 flex items-center gap-2">
               <Calculator size={20} className="text-orange-500"/> 
               Resumo da Análise
             </h3>

             <div className="space-y-4 mb-6">
               <div className="flex justify-between text-sm">
                 <span className="text-slate-500">Jogos Selecionados</span>
                 <span className={`font-bold ${isReady ? 'text-green-600' : 'text-orange-500'}`}>{filledGamesCount}/12</span>
               </div>
             </div>

             <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
               <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Custo Total</span>
               <div className="text-3xl font-bold text-slate-800 flex items-center gap-1">
                 <Coins className="text-yellow-500" />
                 {calculatedCost}
               </div>
               {hasFreeTicket && (
                   <div className="text-xs text-green-600 font-bold mt-1">
                       100% OFF (Bilhete Grátis)
                   </div>
               )}
             </div>

             <button 
                disabled={!isReady}
                onClick={() => onSubmitBet(Object.values(selectionsMap) as Selection[], calculatedCost)}
                className={`w-full py-4 rounded-lg font-bold text-lg shadow transition-transform active:scale-95 flex items-center justify-center gap-2
                  ${isReady 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
             >
                {isReady ? 'Finalizar Análise' : 'Complete 12 Jogos'}
                {isReady && <ChevronRight size={20} />}
             </button>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-4 lg:hidden z-40">
        <div className="flex items-center justify-between gap-4 max-w-5xl mx-auto">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">Custo (Fichas)</span>
            <div className="flex items-center gap-1">
                <Coins size={16} className="text-yellow-500"/>
                <span className="text-xl font-bold text-slate-800">{calculatedCost}</span>
            </div>
          </div>
          <button 
              disabled={!isReady}
              onClick={() => onSubmitBet(Object.values(selectionsMap) as Selection[], calculatedCost)}
              className={`px-6 py-3 rounded-lg font-bold text-sm shadow transition-colors flex items-center gap-2
                ${isReady 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'bg-slate-200 text-slate-400'}`}
           >
              {isReady ? 'Finalizar' : `${incompleteCount} restantes`}
              {isReady && <ChevronRight size={16} />}
           </button>
        </div>
      </div>
    </div>
  );
};