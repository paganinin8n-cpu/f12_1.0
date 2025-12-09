import React from 'react';
import { Game, Prediction } from '../types';
import { Check, Lock, Calendar, Clock, Zap, Crown } from 'lucide-react';

interface GameCardProps {
  game: Game;
  selections: Prediction[];
  onToggleSelection: (outcome: Prediction) => void;
  // New props for multipliers
  isDouble: boolean;
  isSuperDouble: boolean;
  onToggleDouble: () => void;
  onToggleSuper: () => void;
  disableDouble: boolean;
  disableSuper: boolean;
  isPro: boolean;
}

export const GameCard: React.FC<GameCardProps> = ({ 
  game, 
  selections, 
  onToggleSelection,
  isDouble,
  isSuperDouble,
  onToggleDouble,
  onToggleSuper,
  disableDouble,
  disableSuper,
  isPro
}) => {
  const dateObj = new Date(game.date);
  const dayStr = isNaN(dateObj.getTime()) ? '--/--' : dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }).toUpperCase();
  const timeStr = isNaN(dateObj.getTime()) ? '--:--' : dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getButtonClass = (outcome: Prediction) => {
    const isSelected = selections.includes(outcome);
    // Added 'relative' and fixed padding to ensure consistent size
    // Removed 'border-2' logic that might cause shift, using consistent border width
    const base = "flex-1 relative flex flex-col items-center justify-center py-4 px-2 rounded-md transition-all duration-200 border-2 font-semibold text-sm sm:text-base";
    
    if (isSelected) {
      return `${base} bg-green-600 border-green-700 text-white shadow-md`;
    }
    return `${base} bg-white border-orange-400 text-orange-600 hover:bg-orange-50`;
  };

  const isMultiSelectMode = isDouble || isSuperDouble;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4 relative overflow-hidden">
      {/* Header with improved Date/Time visibility */}
      <div className="flex justify-between items-center mb-4 bg-slate-50 -mx-4 -mt-4 px-4 py-2 border-b border-slate-100">
        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded">
          JOGO {game.order}
        </span>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
             <Calendar size={12} className="text-orange-500" /> 
             {dayStr}
          </div>
          <div className="flex items-center gap-1 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">
             <Clock size={12} className="text-orange-500" /> 
             {timeStr}
          </div>
        </div>
      </div>

      {/* Teams */}
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="flex-1 text-left">
          <span className="block font-bold text-slate-800 text-lg leading-tight">{game.teamA}</span>
          <span className="text-xs text-slate-400">Mandante</span>
        </div>
        <div className="px-4 text-slate-300 font-light text-xl">X</div>
        <div className="flex-1 text-right">
          <span className="block font-bold text-slate-800 text-lg leading-tight">{game.teamB}</span>
          <span className="text-xs text-slate-400">Visitante</span>
        </div>
      </div>

      {/* Betting Buttons */}
      <div className="flex gap-2 mb-3">
        <button 
          onClick={() => onToggleSelection('A')}
          className={getButtonClass('A')}
        >
          <span className="z-10">{game.teamA}</span>
          {selections.includes('A') && <Check size={14} className="absolute top-1 right-1 opacity-90" />}
        </button>

        <button 
          onClick={() => onToggleSelection('Draw')}
          className={getButtonClass('Draw')}
        >
          <span className="z-10">Empate</span>
          {selections.includes('Draw') && <Check size={14} className="absolute top-1 right-1 opacity-90" />}
        </button>

        <button 
          onClick={() => onToggleSelection('B')}
          className={getButtonClass('B')}
        >
          <span className="z-10">{game.teamB}</span>
          {selections.includes('B') && <Check size={14} className="absolute top-1 right-1 opacity-90" />}
        </button>
      </div>

      {/* Multiplier Buttons Row (Inside Card) */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button 
          onClick={onToggleDouble}
          disabled={disableDouble}
          className={`flex items-center justify-center gap-2 py-2 rounded-md border text-xs font-bold transition-all
            ${isDouble 
              ? 'bg-blue-600 text-white border-blue-700 shadow-md' 
              : disableDouble 
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50'
            }`}
        >
          <Zap size={14} />
          DUPLA (2x)
        </button>

        <button 
          onClick={onToggleSuper}
          disabled={disableSuper}
          className={`flex items-center justify-center gap-2 py-2 rounded-md border text-xs font-bold transition-all
            ${isSuperDouble 
              ? 'bg-purple-600 text-white border-purple-700 shadow-md' 
              : disableSuper 
                ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
                : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
            }`}
        >
          <Crown size={14} />
          SUPER (4x)
        </button>
      </div>

      {/* Selection Status Text */}
      <div className="min-h-[20px] flex items-center justify-center">
        {!isMultiSelectMode && selections.length > 0 && (
           <span className="text-[10px] text-green-600 font-medium flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
             <Check size={10} /> Selecionado
           </span>
        )}
      </div>

      {/* Overlay for "Finished" games */}
      {game.status === 'finished' && (
        <div className="absolute inset-0 bg-slate-100/80 flex items-center justify-center backdrop-blur-[1px] z-20">
          <div className="bg-white px-4 py-2 rounded-lg shadow border border-slate-300 flex items-center gap-2">
            <Lock size={16} className="text-slate-500" />
            <span className="font-bold text-slate-700">Jogo Encerrado</span>
          </div>
        </div>
      )}
    </div>
  );
};
