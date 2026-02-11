
import React from 'react';
import { UserRole } from '../types';
import { APP_CONFIG } from '../constants.tsx';

interface LayoutProps {
  children: React.ReactNode;
  user: any;
  onLogout: () => void;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, title }) => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-hospital-blue text-white flex flex-col shadow-xl z-10">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
             <i className="fas fa-hospital text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">{APP_CONFIG.NAME}</h1>
            <span className="text-[10px] uppercase tracking-widest text-blue-200 opacity-80 font-semibold">Hospitalar</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <div className="text-[10px] font-bold text-white/40 uppercase px-4 mb-2 tracking-widest">Navegação</div>
          {user.role === UserRole.ADMIN && (
            <>
              <a href="#/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-chart-line w-5"></i> Dashboard
              </a>
              <a href="#/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-users w-5"></i> Usuários
              </a>
              <a href="#/admin/rooms" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-door-open w-5"></i> Consultórios
              </a>
              <a href="#/admin/history" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-history w-5"></i> Histórico
              </a>
            </>
          )}
          {user.role === UserRole.RECEPTION && (
            <>
              <a href="#/reception" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-bullhorn w-5"></i> Chamar Paciente
              </a>
              <a href="#/reception/history" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-clock w-5"></i> Últimas Chamadas
              </a>
            </>
          )}
          {user.role === UserRole.CLINIC && (
            <>
              <a href="#/clinic" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition-colors">
                <i className="fas fa-user-md w-5"></i> Meu Consultório
              </a>
            </>
          )}
          <hr className="border-white/10 my-4" />
          <a href="#/panel" target="_blank" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-500/20 text-green-300 hover:bg-green-500/30 transition-colors">
            <i className="fas fa-tv w-5"></i> Abrir Painel TV
          </a>
        </nav>

        <div className="p-4 bg-black/20 mt-auto">
          <div className="flex items-center gap-3 px-4 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-blue-200 uppercase opacity-60">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 px-4 py-3 rounded-xl text-sm font-bold transition-colors"
          >
            <i className="fas fa-sign-out-alt"></i> Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative bg-white">
        <header className="h-20 border-b flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span className="flex items-center gap-2">
              <i className="far fa-calendar-alt"></i>
              {new Date().toLocaleDateString('pt-BR')}
            </span>
            <div className="w-px h-4 bg-slate-200"></div>
            <span className="flex items-center gap-2">
              <i className="far fa-clock"></i>
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
