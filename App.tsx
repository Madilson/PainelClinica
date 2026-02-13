
import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import ReceptionDashboard from './pages/ReceptionDashboard';
import ClinicDashboard from './pages/ClinicDashboard';
import TvPanel from './pages/TvPanel';
import { User, UserRole } from './types';
import { APP_CONFIG } from './constants.tsx';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    // Basic persistent session
    const saved = localStorage.getItem(APP_CONFIG.STORAGE_KEYS.AUTH);
    if (saved) {
      setUser(JSON.parse(saved));
    }
    setLoading(false);

    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem(APP_CONFIG.STORAGE_KEYS.AUTH, JSON.stringify(userData));
    // Default redirects based on role
    if (userData.role === UserRole.ADMIN) window.location.hash = '#/admin';
    else if (userData.role === UserRole.RECEPTION) window.location.hash = '#/reception';
    else if (userData.role === UserRole.CLINIC) window.location.hash = '#/clinic';
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem(APP_CONFIG.STORAGE_KEYS.AUTH);
    window.location.hash = '#/';
  };

  if (loading) return null;

  // TV Panel is always accessible if hash matches
  if (hash === '#/panel') {
    return <TvPanel />;
  }

  // Not logged in
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // Routing
  const renderContent = () => {
    switch (hash) {
      case '#/admin':
      case '#/admin/users':
      case '#/admin/rooms':
      case '#/admin/history':
        return user.role === UserRole.ADMIN ? <AdminDashboard /> : <div className="p-10 text-center font-bold">Acesso Negado</div>;
      case '#/reception':
      case '#/reception/history':
        return user.role === UserRole.RECEPTION ? <ReceptionDashboard /> : <div className="p-10 text-center font-bold">Acesso Negado</div>;
      case '#/clinic':
        return <ClinicDashboard user={user} />;
      default:
        // Default landing based on role
        if (user.role === UserRole.ADMIN) return <AdminDashboard />;
        if (user.role === UserRole.RECEPTION) return <ReceptionDashboard />;
        if (user.role === UserRole.CLINIC) return <ClinicDashboard user={user} />;
        return <div className="p-10 text-center">Página não encontrada</div>;
    }
  };

  const getTitle = () => {
    if (hash.includes('admin')) return 'Painel Administrativo';
    if (hash.includes('reception')) return 'Central de Recepção';
    if (hash.includes('clinic')) return 'Espaço do Médico';
    return 'Dashboard';
  };

  return (
    <Layout user={user} onLogout={handleLogout} title={getTitle()}>
      {renderContent()}
    </Layout>
  );
};

export default App;
