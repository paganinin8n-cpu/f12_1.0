import React from 'react';
import { User } from '../types';
import { LogOut, Coins, User as UserIcon, Menu, Beer, PlusCircle, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
  onCreatePool?: () => void;
  onProfileClick?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, onNavigate, currentPage, onCreatePool, onProfileClick }) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            {/* Logo */}
            <div 
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => {
                onNavigate('dashboard');
                setIsMenuOpen(false); // Fix: Close menu when logo is clicked
              }}
            >
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                <span className="font-bold text-xl italic">F</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight group-hover:text-orange-100 transition-colors">
                Fantasy<span className="text-orange-500">12</span>
              </h1>
            </div>

            {/* Admin Panel Button - Next to Logo */}
            {user?.role === 'admin' && (
              <button 
                onClick={() => onNavigate('admin')}
                className="bg-slate-800 hover:bg-slate-700 text-orange-500 border border-orange-500/30 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1.5 rounded-md transition-all shadow-[0_0_10px_rgba(249,115,22,0.1)] flex items-center gap-1"
              >
                <ShieldAlert size={14} />
                <span className="hidden sm:inline">PAINEL</span> ADMIN
              </button>
            )}
          </div>

          {/* Desktop Nav */}
          {user && (
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex gap-4 text-sm font-medium">
                {/* Dashboard link removed as per request (Logo handles it) */}
                <button 
                  onClick={() => onNavigate('betting')}
                  className={`hover:text-orange-400 transition-colors ${currentPage === 'betting' ? 'text-orange-500' : 'text-slate-300'}`}
                >
                  Analisar
                </button>
                <button 
                  onClick={() => onNavigate('bar')}
                  className={`hover:text-orange-400 transition-colors flex items-center gap-1 ${currentPage === 'bar' ? 'text-orange-500' : 'text-slate-300'}`}
                >
                  <Beer size={16} /> BAR
                </button>
                {/* Admin Link removed from here, moved next to logo */}
              </nav>

              <div className="h-6 w-px bg-slate-700 mx-2"></div>

              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs text-slate-400">Fichas</span>
                  <span className="text-sm font-bold text-yellow-400 flex items-center gap-1">
                    <Coins size={14} />
                    {user.balance.toFixed(0)}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                   {user.role === 'pro' && onCreatePool && (
                      <button 
                        onClick={onCreatePool}
                        className="hidden md:flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full transition-colors border border-white/20"
                        title="Criar Bolão"
                      >
                        <PlusCircle size={14} />
                        <span className="uppercase tracking-wider">Bolão</span>
                      </button>
                   )}

                  <button 
                    onClick={onProfileClick}
                    className="w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
                    title="Meu Perfil"
                  >
                    <UserIcon size={16} />
                  </button>
                  <button onClick={onLogout} className="text-slate-400 hover:text-white" title="Sair">
                    <LogOut size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          {user && (
             <button 
               className="md:hidden text-slate-300 p-2"
               onClick={() => setIsMenuOpen(!isMenuOpen)}
             >
               <Menu size={24} />
             </button>
          )}
        </div>

        {/* Mobile Menu (The "3 Riscos") */}
        {isMenuOpen && user && (
          <div className="md:hidden bg-slate-800 border-t border-slate-700 py-2 shadow-2xl absolute w-full z-50">
            {/* Dashboard removed from list, but kept explicit actions */}
            <button onClick={() => {onNavigate('betting'); setIsMenuOpen(false)}} className="block w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white border-b border-slate-700/50">
              Fazer Análise
            </button>
            <button onClick={() => {onNavigate('bar'); setIsMenuOpen(false)}} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/50">
              <Beer size={16}/> BAR (Comprar Fichas)
            </button>
            <button onClick={() => {onProfileClick?.(); setIsMenuOpen(false)}} className="w-full text-left px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2 border-b border-slate-700/50">
              <UserIcon size={16}/> Meu Perfil
            </button>
            
            {user.role === 'pro' && onCreatePool && (
               <button onClick={() => {onCreatePool(); setIsMenuOpen(false)}} className="w-full text-left px-4 py-3 text-orange-400 hover:bg-slate-700 hover:text-orange-300 flex items-center gap-2 font-bold border-b border-slate-700/50">
                 <PlusCircle size={16}/> Criar Bolão
               </button>
            )}

            {/* Admin Panel REMOVED from here as per instructions */}

            <div className="pt-2 px-4 pb-2 bg-slate-900/50">
               <div className="flex justify-between items-center py-2">
                 <span className="text-yellow-400 font-bold flex items-center gap-2"><Coins size={16}/> {user.balance.toFixed(0)} Fichas</span>
                 <button onClick={onLogout} className="text-red-400 text-sm font-medium">Sair</button>
               </div>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-5xl">
        {children}
      </main>

      <footer className="bg-slate-900 text-slate-500 py-6 text-center text-sm">
        <p>&copy; 2024 Fantasy12. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};