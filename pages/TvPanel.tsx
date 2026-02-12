
import React, { useState, useEffect, useRef } from 'react';
import { getLatestCall, getHistory, realTime } from '../store';
import { PatientCall } from '../types';

const TvPanel: React.FC = () => {
  const [currentCall, setCurrentCall] = useState<PatientCall | null>(null);
  const [history, setHistory] = useState<PatientCall[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setCurrentCall(getLatestCall());
    const fullHistory = getHistory();
    setHistory(fullHistory.slice(1, 6));

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const handleNewCall = (call: PatientCall) => {
      setCurrentCall(call);
      const updatedHistory = getHistory();
      setHistory(updatedHistory.slice(1, 6));
      triggerNotification(call);
    };

    realTime.on('new_call', handleNewCall);

    return () => clearInterval(timer);
  }, []);

  const triggerNotification = (call: PatientCall) => {
    // Resetar estados de animação para forçar re-execução (importante para re-chamadas)
    setIsAnimating(false);
    setIsFlashing(false);
    
    // Pequeno delay para o navegador processar o reset antes da nova animação
    setTimeout(() => {
      setIsAnimating(true);
      setIsFlashing(true);
      
      // Tocar o DING
      if (isAudioEnabled && audioRef.current) {
         audioRef.current.currentTime = 0;
         audioRef.current.play().then(() => {
           // Após o sinal sonoro, fazemos o anúncio por voz do nome
           setTimeout(() => {
             announcePatient(call);
           }, 1500); // Delay ideal para transição entre DING e VOZ
         }).catch(e => console.error('Erro áudio:', e));
      }

      // Parar o flash após 3 segundos
      setTimeout(() => setIsFlashing(false), 3000);
      // Parar animação de destaque após 10 segundos
      setTimeout(() => setIsAnimating(false), 10000);
    }, 50);
  };

  const announcePatient = (call: PatientCall) => {
    if (!window.speechSynthesis) return;
    
    // Importante: Cancelar qualquer fala anterior para não encavalar
    window.speechSynthesis.cancel();
    
    const textToSpeak = `Atenção. Paciente: ${call.patientName}. Por favor, compareça à sala ${call.roomName}.`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    
    utterance.lang = 'pt-BR';
    utterance.rate = 0.85; // Velocidade levemente reduzida para maior clareza hospitalar
    utterance.pitch = 1.05; // Tom levemente mais agudo para melhor audição em ambientes ruidosos
    utterance.volume = 1;
    
    window.speechSynthesis.speak(utterance);
  };

  const enableAudio = () => {
    setIsAudioEnabled(true);
    if (audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current?.pause();
      }).catch(e => console.log('Audio unlock:', e));
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  if (!isAudioEnabled) {
    return (
      <div className="h-screen w-screen bg-[#0A3D62] flex items-center justify-center text-white flex-col p-10 text-center">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse border border-white/20">
          <i className="fas fa-volume-up text-5xl"></i>
        </div>
        <h1 className="text-5xl font-black mb-6">MedCall Pro</h1>
        <p className="text-blue-200 mb-12 max-w-lg text-2xl font-light leading-relaxed">
          Para ativar as <strong>notificações sonoras</strong> e o <strong>anúncio por voz</strong>, clique no botão abaixo.
        </p>
        <button 
          onClick={enableAudio}
          className="bg-green-500 hover:bg-green-600 text-white font-black py-8 px-16 rounded-3xl text-3xl shadow-2xl shadow-green-500/40 transition-all active:scale-95 flex items-center gap-6"
        >
          <i className="fas fa-play"></i>
          ATIVAR PAINEL TV
        </button>
      </div>
    );
  }

  return (
    <div className={`h-screen w-screen transition-colors duration-500 flex flex-col overflow-hidden select-none ${
      isFlashing ? 'bg-white' : 'bg-[#0A3D62]'
    }`}>
      {/* Som de Notificação Hospitalar */}
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" preload="auto" />

      {/* Header */}
      <header className={`h-[12vh] border-b flex items-center justify-between px-12 transition-colors duration-200 ${
        isFlashing ? 'bg-slate-100 border-slate-300' : 'bg-black/20 border-white/10'
      }`}>
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
            <i className={`fas fa-hospital text-4xl ${isFlashing ? 'text-blue-600' : 'text-[#0A3D62]'}`}></i>
          </div>
          <div className={isFlashing ? 'text-slate-800' : 'text-white'}>
            <h1 className="text-4xl font-black tracking-tighter">MedCall <span className="text-blue-500">Pro</span></h1>
            <p className="text-sm uppercase tracking-widest font-bold opacity-70">Painel de Atendimento</p>
          </div>
        </div>
        
        <div className="flex items-center gap-10">
          <div className="text-right">
            <div className={`text-6xl font-black leading-none ${isFlashing ? 'text-slate-800' : 'text-white'}`}>
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className={`text-sm font-bold uppercase tracking-widest mt-1 ${isFlashing ? 'text-slate-500' : 'text-blue-300'}`}>
              {currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
            </div>
          </div>
          <button 
            onClick={toggleFullscreen}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
              isFlashing ? 'bg-slate-200 text-slate-600' : 'bg-white/10 text-white'
            }`}
          >
            <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
          </button>
        </div>
      </header>

      {/* Área de Chamada Principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-10 relative">
        {currentCall ? (
          <div 
            key={currentCall.id + (isAnimating ? '-anim' : '')} 
            className={`w-full max-w-[95%] flex flex-col items-center animate-patient-entry transition-all duration-700 ${
              isAnimating ? 'scale-105' : 'scale-100 opacity-90'
            }`}
          >
            <div className="mb-8">
              <span className={`inline-block px-12 py-4 rounded-full font-black text-4xl uppercase tracking-[0.4em] shadow-2xl transition-all duration-500 ${
                isFlashing ? 'bg-blue-600 text-white' : (isAnimating ? 'bg-green-500 text-white animate-bounce animate-glow-pulse' : 'bg-slate-700 text-slate-300')
              }`}>
                 {isAnimating ? 'Chamando' : 'Em Atendimento'}
              </span>
            </div>
            
            <div className="w-full text-center mb-12">
              <h2 className={`text-[12vw] leading-none font-black uppercase transition-all duration-500 ${
                isFlashing ? 'text-blue-900' : (isAnimating ? 'text-yellow-300' : 'text-white opacity-80')
              } drop-shadow-[0_10px_10px_rgba(0,0,0,0.3)]`}>
                {currentCall.patientName}
              </h2>
            </div>

            <div className={`flex items-stretch gap-12 w-full justify-center transition-all duration-700 ${!isAnimating && 'scale-95'}`}>
              <div className={`p-12 rounded-[4rem] shadow-2xl flex flex-col items-center min-w-[450px] transition-all duration-500 ${
                isFlashing ? 'bg-blue-100 text-blue-900' : (isAnimating ? 'bg-white text-[#0A3D62]' : 'bg-slate-800 text-white border border-white/10')
              }`}>
                <span className="text-4xl font-bold uppercase opacity-60 mb-2">Consultório</span>
                <span className={`text-[16rem] leading-none font-black tracking-tighter transition-transform duration-500 ${isAnimating ? 'scale-110' : 'scale-100'}`}>
                  {currentCall.roomName}
                </span>
              </div>
              
              <div className="flex flex-col justify-center text-left max-w-4xl">
                <div className={`flex items-center gap-8 text-5xl font-bold mb-6 p-10 rounded-3xl border transition-all duration-500 ${
                  isFlashing ? 'bg-white border-blue-200 text-blue-900' : (isAnimating ? 'bg-white/10 border-white/10 text-blue-100' : 'bg-transparent border-white/5 text-white/40')
                }`}>
                   <i className={`fas fa-user-md text-6xl ${isFlashing ? 'text-blue-600' : (isAnimating ? 'text-blue-400' : 'text-slate-600')}`}></i>
                   <div>
                     <p className={`text-xl uppercase opacity-60 mb-1 ${isFlashing ? 'text-blue-500' : (isAnimating ? 'text-blue-300' : 'text-slate-500')}`}>Médico(a) Responsável</p>
                     <p>{currentCall.doctorName}</p>
                   </div>
                </div>
                {currentCall.ticketNumber && (
                  <div className={`text-5xl font-bold ml-4 transition-all duration-500 ${isFlashing ? 'text-blue-800' : (isAnimating ? 'text-white' : 'text-white/30')}`}>
                    Senha: <span className={isAnimating ? 'text-yellow-400' : 'text-slate-500'}>{currentCall.ticketNumber}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`text-center transition-opacity duration-1000 ${isFlashing ? 'opacity-0' : 'opacity-20'}`}>
            <i className="fas fa-hospital-user text-[18rem] mb-12"></i>
            <p className="text-6xl font-black uppercase tracking-[0.5em]">Livre para Chamada</p>
          </div>
        )}
      </main>

      {/* Footer (Histórico) */}
      <footer className={`h-[22vh] border-t transition-colors duration-200 p-8 ${
        isFlashing ? 'bg-slate-200 border-slate-300' : 'bg-black/40 border-white/10'
      }`}>
        <div className="max-w-[100%] mx-auto flex gap-10 h-full items-center">
          <div className="w-72 flex flex-col justify-center border-r border-black/10 pr-10">
            <h3 className={`text-3xl font-black uppercase leading-none mb-2 ${isFlashing ? 'text-blue-900' : 'text-blue-400'}`}>Anteriores</h3>
            <p className={`text-sm font-bold uppercase tracking-widest ${isFlashing ? 'text-slate-500' : 'text-white/40'}`}>Últimas chamadas</p>
          </div>
          <div className="flex-1 flex gap-8 overflow-hidden h-full">
            {history.map((call) => (
              <div key={call.id} className={`flex-1 rounded-[3rem] p-6 border flex flex-col justify-between transition-colors duration-200 ${
                isFlashing ? 'bg-white border-white text-slate-800' : 'bg-white/5 border-white/10 text-white'
              }`}>
                <p className="text-3xl font-black truncate uppercase tracking-tighter">{call.patientName}</p>
                <div className="flex items-center justify-between mt-auto">
                  <span className={`px-6 py-2 rounded-2xl text-2xl font-black ${
                    isFlashing ? 'bg-blue-100 text-blue-700' : 'bg-blue-600 text-white'
                  }`}>SALA {call.roomName}</span>
                  <span className="opacity-40 font-mono text-2xl">{new Date(call.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
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
