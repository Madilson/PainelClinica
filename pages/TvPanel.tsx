
import React, { useState, useEffect, useRef } from 'react';
import { getLatestCall, getHistory, realTime } from '../store';
import { PatientCall } from '../types';

const TvPanel: React.FC = () => {
  const [currentCall, setCurrentCall] = useState<PatientCall | null>(null);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Carga inicial dos dados
    setCurrentCall(getLatestCall());
    const fullHistory = getHistory();
    setHistory(fullHistory.slice(1, 6));

    // Atualização do relógio
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Ouvir chamadas em tempo real via BroadcastChannel
    const handleNewCall = (call: PatientCall) => {
      setCurrentCall(call);
      // Pega o histórico atualizado
      const updatedHistory = getHistory();
      setHistory(updatedHistory.slice(1, 6));
      triggerNotification();
    };

    realTime.on('new_call', handleNewCall);

    return () => clearInterval(timer);
  }, []);

  const triggerNotification = () => {
    setIsAnimating(true);
    if (isAudioEnabled && audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play().catch(e => console.error('Erro ao reproduzir áudio:', e));
    }
    // Remove a animação de destaque após 8 segundos
    setTimeout(() => setIsAnimating(false), 8000);
  };

  const enableAudio = () => {
    setIsAudioEnabled(true);
    // Tenta tocar um som mudo para "desbloquear" o contexto de áudio do navegador
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
      }).catch(e => console.log('Audio unlock check:', e));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // Se o áudio não estiver habilitado, mostra tela de ativação (Exigência dos Navegadores)
  if (!isAudioEnabled) {
    return (
      <div className="h-screen w-screen bg-[#0A3D62] flex items-center justify-center text-white flex-col p-10 text-center">
        <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
          <i className="fas fa-volume-up text-4xl"></i>
        </div>
        <h1 className="text-4xl font-bold mb-4">Painel de Atendimento</h1>
        <p className="text-blue-200 mb-10 max-w-md text-lg">
          Para que o sistema possa emitir os alertas sonoros das chamadas, clique no botão abaixo para iniciar o monitoramento.
        </p>
        <button 
          onClick={enableAudio}
          className="bg-green-500 hover:bg-green-600 text-white font-black py-6 px-12 rounded-2xl text-2xl shadow-2xl shadow-green-500/30 transition-all active:scale-95 flex items-center gap-4"
        >
          <i className="fas fa-play"></i>
          INICIAR PAINEL
        </button>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen bg-[#0A3D62] text-white flex flex-col overflow-hidden select-none transition-colors duration-500 ${isAnimating ? 'bg-[#0e4b78]' : ''}`}>
      {/* Som de Notificação Hospitalar */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header do Painel */}
      <header className="h-[12vh] border-b border-white/10 flex items-center justify-between px-12 bg-black/20">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <i className="fas fa-hospital text-4xl text-[#0A3D62]"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter">MedCall <span className="text-blue-400">Pro</span></h1>
            <p className="text-blue-300 text-sm uppercase tracking-widest font-bold opacity-70">Painel de Chamadas em Tempo Real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="text-right">
            <div className="text-6xl font-black text-white leading-none">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-sm text-blue-300 font-bold uppercase tracking-widest mt-1">
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
          </div>
          <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            title="Tela Cheia"
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
        </div>
      </header>

      {/* Área Principal de Chamada */}
      <main className="flex-1 flex flex-col items-center justify-center px-10 relative">
        {currentCall ? (
          <div className={`w-full max-w-[95%] flex flex-col items-center transition-all duration-700 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
            <div className="mb-6">
              <span className={`inline-block bg-green-500 text-white px-10 py-3 rounded-full font-black text-3xl uppercase tracking-[0.4em] shadow-xl ${isAnimating ? 'animate-bounce' : ''}`}>
                 Atenção
              </span>
            </div>
            
            <div className="w-full text-center overflow-hidden mb-10">
              <h2 className={`text-[11vw] leading-none font-black uppercase drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-colors duration-300 ${isAnimating ? 'text-yellow-300' : 'text-white'}`}>
                {currentCall.patientName}
              </h2>
            </div>

            <div className="flex items-stretch gap-10 w-full justify-center">
              <div className="bg-white text-[#0A3D62] p-10 rounded-[4rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] flex flex-col items-center min-w-[400px]">
                <span className="text-4xl font-bold uppercase opacity-50 mb-2">Consultório</span>
                <span className="text-[14rem] leading-none font-black tracking-tighter">{currentCall.roomName}</span>
              </div>
              
              <div className="flex flex-col justify-center text-left max-w-3xl">
                <div className="flex items-center gap-6 text-5xl font-bold text-blue-100 mb-4 bg-white/10 p-8 rounded-3xl border border-white/10">
                   <i className="fas fa-user-md text-blue-400"></i>
                   <div>
                     <p className="text-xl uppercase opacity-60 text-blue-300 mb-1">Médico(a) Responsável</p>
                     <p>{currentCall.doctorName}</p>
                   </div>
                </div>
                {currentCall.ticketNumber && (
                  <div className="text-4xl font-bold text-white/80 ml-4">
                    Senha: <span className="text-yellow-400">{currentCall.ticketNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center opacity-20">
            <i className="fas fa-hospital-user text-[15rem] mb-10"></i>
            <p className="text-5xl font-black uppercase tracking-[0.5em]">Aguardando Chamada</p>
          </div>
        )}
      </main>

      {/* Rodapé com Histórico (Últimas 5) */}
      <footer className="h-[22vh] bg-black/40 border-t border-white/10 p-8">
        <div className="max-w-[100%] mx-auto flex gap-8 h-full items-center">
          <div className="w-64 flex flex-col justify-center border-r border-white/10 pr-8">
            <h3 className="text-2xl font-black uppercase text-blue-400 leading-none mb-2">Histórico</h3>
            <p className="text-xs text-white/40 font-bold uppercase tracking-widest">Chamadas anteriores</p>
          </div>
          <div className="flex-1 flex gap-6 overflow-hidden h-full">
            {history.length === 0 ? (
               <div className="flex items-center text-white/20 font-bold italic text-xl">Nenhum registro anterior...</div>
            ) : (
              history.map((call) => (
                <div key={call.id} className="flex-1 bg-white/5 rounded-[2.5rem] p-6 border border-white/10 flex flex-col justify-between hover:bg-white/10 transition-all">
                  <p className="text-3xl font-black text-white truncate uppercase tracking-tighter">{call.patientName}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="bg-blue-600 text-white px-5 py-1 rounded-2xl text-xl font-black">SALA {call.roomName}</span>
                    <span className="text-white/40 font-mono text-xl">{new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TvPanel;
