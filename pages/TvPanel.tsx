
import React, { useState, useEffect, useRef } from 'react';
import { getLatestCall, getHistory, realTime } from '../store';
import { PatientCall, Room } from '../types';

const TvPanel: React.FC = () => {
  const [currentCall, setCurrentCall] = useState<PatientCall | null>(null);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initial load
    setCurrentCall(getLatestCall());
    setHistory(getHistory().slice(1, 6)); // Previous 5 calls

    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Listen for new calls
    realTime.on('new_call', (call: PatientCall) => {
      setCurrentCall(call);
      setHistory(getHistory().slice(1, 6));
      triggerNotification();
    });

    return () => clearInterval(timer);
  }, []);

  const triggerNotification = () => {
    setIsAnimating(true);
    if (audioRef.current) {
       audioRef.current.currentTime = 0;
       audioRef.current.play().catch(e => console.log('Audio error:', e));
    }
    setTimeout(() => setIsAnimating(false), 5000);
  };

  return (
    <div className="h-screen w-screen bg-[#0A3D62] text-white flex flex-col overflow-hidden select-none">
      {/* Hidden Audio Element - Hospital Ding */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header */}
      <header className="h-[12vh] border-b border-white/10 flex items-center justify-between px-16 bg-black/10">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg">
            <i className="fas fa-heartbeat text-4xl text-[#0A3D62]"></i>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tight">MedCall Pro</h1>
            <p className="text-blue-200 text-lg uppercase tracking-widest font-bold opacity-60">Centro Médico Integrado</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-6xl font-light text-white font-mono">
            {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-lg text-blue-300 font-bold uppercase tracking-wider">
            {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
          </div>
        </div>
      </header>

      {/* Main Content (Active Call) */}
      <main className="flex-1 flex flex-col items-center justify-center px-10 relative">
        {currentCall ? (
          <div className={`w-full max-w-7xl flex flex-col items-center transition-all duration-700 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
            <div className="mb-4">
              <span className={`inline-block bg-green-500 text-white px-8 py-2 rounded-full font-black text-2xl uppercase tracking-[0.3em] ${isAnimating ? 'animate-bounce' : ''}`}>
                 Chamando Agora
              </span>
            </div>
            
            <h2 className={`text-[12rem] leading-none font-black text-center mb-8 drop-shadow-2xl ${isAnimating ? 'text-yellow-300' : 'text-white'}`}>
              {currentCall.patientName.toUpperCase()}
            </h2>

            <div className="flex items-center gap-12 w-full justify-center">
              <div className="bg-white text-[#0A3D62] p-12 rounded-[3rem] shadow-2xl flex flex-col items-center min-w-[350px]">
                <span className="text-3xl font-bold uppercase opacity-60 mb-2">Consultório</span>
                <span className="text-[12rem] leading-none font-black">{currentCall.roomName}</span>
              </div>
              <div className="text-left max-w-2xl">
                <div className="flex items-center gap-4 text-4xl font-bold text-blue-200 mb-2">
                   <i className="fas fa-user-md"></i>
                   {currentCall.doctorName}
                </div>
                <div className="text-2xl text-blue-300/80 italic font-medium">
                   Aguardando no setor de atendimento principal
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center opacity-30">
            <i className="fas fa-hospital-user text-9xl mb-6"></i>
            <p className="text-4xl font-bold uppercase tracking-[0.5em]">Aguardando Chamadas</p>
          </div>
        )}
      </main>

      {/* Footer (History) */}
      <footer className="h-[25vh] bg-black/30 border-t border-white/10 p-8">
        <div className="max-w-screen-2xl mx-auto flex gap-6 h-full items-center">
          <div className="w-48 flex flex-col justify-center border-r border-white/10 pr-6">
            <h3 className="text-xl font-black uppercase text-blue-300 leading-tight">Últimas Chamadas</h3>
          </div>
          <div className="flex-1 flex gap-4 overflow-hidden h-full py-2">
            {history.map((call, idx) => (
              <div key={call.id} className="flex-1 bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col justify-between animate-fade-in">
                <p className="text-2xl font-bold text-white truncate">{call.patientName}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-xl text-lg font-black">SALA {call.roomName}</span>
                  <span className="text-white/40 font-mono text-lg">{new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TvPanel;
