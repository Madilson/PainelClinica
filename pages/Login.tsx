
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
    
    // Autenticação mockada: admin/admin ou senha padrão 123456 para outros usuários
    const isValidAdmin = username === 'admin' && password === 'admin';
    const isValidOther = user && password === '123456';

    if (isValidAdmin || isValidOther) {
      onLogin(user || users.find(u => u.username === 'admin'));
    } else {
      setError('Usuário ou senha inválidos, ou conta desativada.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 hover:shadow-blue-500/10">
        <div className="bg-hospital-blue p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0 100 L100 0 L100 100 Z" fill="white" />
            </svg>
          </div>
          <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/20 backdrop-blur-sm relative z-10">
            <i className="fas fa-heartbeat text-4xl text-white"></i>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight relative z-10">MedCall <span className="text-blue-400">Pro</span></h1>
          <p className="text-blue-100/60 text-sm mt-2 font-medium tracking-wide relative z-10 uppercase">Gestão Hospitalar</p>
        </div>
        
        <form onSubmit={handleLogin} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-3 animate-headshake">
              <i className="fas fa-exclamation-triangle"></i>
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Usuário de Acesso</label>
            <div className="relative group">
              <i className="fas fa-user absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Senha Privada</label>
            <div className="relative group">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium"
                required
              />
            </div>
            <div className="flex justify-between items-center mt-2 px-1">
               <p className="text-[10px] text-slate-400 font-bold uppercase">Senha Admin: admin</p>
               <a href="#" className="text-[10px] text-blue-500 font-bold uppercase hover:underline">Esqueceu?</a>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-hospital-blue hover:bg-blue-900 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
          >
            ENTRAR NO SISTEMA
            <i className="fas fa-arrow-right text-xs transition-transform group-hover:translate-x-1"></i>
          </button>
        </form>
        
        <div className="p-6 bg-slate-50 text-center border-t border-slate-100">
           <p className="text-slate-400 text-[9px] uppercase font-black tracking-[0.3em]">Ambiente Seguro & Criptografado</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
