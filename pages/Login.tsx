
import React, { useState } from 'react';
import { UserRole } from '../types';
import { getUsers } from '../store';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = getUsers();
    const user = users.find(u => u.username === username && u.active);
    
    // Simple mock auth
    if (user && password === '123456') {
      onLogin(user);
    } else {
      setError('Usuário ou senha inválidos, ou conta desativada.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-hospital-blue p-10 text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
            <i className="fas fa-heartbeat text-3xl text-white"></i>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">MedCall Pro</h1>
          <p className="text-blue-100/60 text-sm mt-1">Gestão Inteligente de Atendimento</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-medium border border-red-100 flex items-center gap-3">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Usuário</label>
            <div className="relative">
              <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: recepcao"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Senha</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-4 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                required
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 ml-1">* Use a senha padrão: 123456</p>
          </div>

          <button
            type="submit"
            className="w-full bg-hospital-blue hover:bg-blue-900 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
          >
            Acessar Sistema
          </button>
        </form>
        
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
           <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">Acesso Restrito a Funcionários</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
