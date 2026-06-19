import React, { Suspense, useState, useEffect, useRef } from 'react';
import Scene from './components/Scene';
import UIOverlay from './components/UIOverlay';
import './index.css';

function App() {
  const [balances, setBalances] = useState({
    XLM: 10,
    FUEL: 100,
    ORE: 0,
    SCORE: 0 
  });

  const [fuelEmpty, setFuelEmpty] = useState(false);
  const [crashFlash, setCrashFlash] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [hasAutoSell, setHasAutoSell] = useState(false);
  const [shipColor, setShipColor] = useState('#00f0ff');
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Müzik Oynatıcısı Referansı
  const audioRef = useRef(null);

  useEffect(() => {
    // Oyun durduysa müziği de durdur
    if (!gameStarted) {
      if (audioRef.current) audioRef.current.pause();
      return;
    }

    // Oyun başladıysa müziği başlat
    if (gameStarted && audioRef.current) {
      audioRef.current.volume = 0.4; // Müzik sesi rahatsız etmesin diye kısık tutuldu
      audioRef.current.play().catch(e => console.log("Tarayıcı otomatik oynatmaya izin vermedi (Dosya yok veya etkileşim bekleniyor):", e));
    }
  }, [gameStarted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Oyun Başladığında Yakıt ve Skor Döngüsü
  useEffect(() => {
    let interval;
    if (gameStarted && !fuelEmpty && !isPaused) {
      interval = setInterval(() => {
        setBalances(prev => {
          const newFuel = Math.max(0, prev.FUEL - 1);
          if (newFuel === 0) setFuelEmpty(true);
          return { ...prev, FUEL: newFuel };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, fuelEmpty, isPaused]);

  useEffect(() => {
    let interval;
    if (gameStarted && !fuelEmpty && !isPaused) {
      interval = setInterval(() => {
        setBalances(prev => ({ ...prev, SCORE: prev.SCORE + 1 }));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, fuelEmpty, isPaused]);

  // ESC ile Durdurma (Pause)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && gameStarted && balances.FUEL > 0) {
        setIsPaused(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, balances.FUEL]);

  useEffect(() => {
    if (balances.FUEL > 0 && fuelEmpty) {
      setFuelEmpty(false);
    }
  }, [balances.FUEL, fuelEmpty]);

  const handleMine = (amount) => {
    if (!fuelEmpty && gameStarted && !isPaused) {
      setBalances(prev => {
        let newOre = prev.ORE + amount;
        let newXlm = prev.XLM;
        
        if (hasAutoSell) {
          while (newOre >= 10) {
            newXlm += 5;
            newOre -= 10;
          }
        }
        
        return { ...prev, ORE: newOre, XLM: newXlm };
      });
    }
  };

  const handleCrash = () => {
    if (fuelEmpty || !gameStarted || isPaused) return;
    
    if (hasShield) {
      setHasShield(false);
      setCrashFlash('blue');
      setTimeout(() => setCrashFlash(false), 200);
      return;
    }

    setCrashFlash('red');
    setTimeout(() => setCrashFlash(false), 200);
    
    setBalances(prev => {
      const newFuel = Math.max(0, prev.FUEL - 20);
      if (newFuel === 0) setFuelEmpty(true);
      return { ...prev, FUEL: newFuel };
    });
  };

  const resetGame = () => {
    setBalances({ XLM: 10, FUEL: 100, ORE: 0, SCORE: 0 });
    setFuelEmpty(false);
    setHasShield(false);
    setHasAutoSell(false);
    setIsPaused(false);
  };

  return (
    <>
      {/* Public klasöründeki music.mp3 dosyasını arayan Audio Etiketi */}
      <audio ref={audioRef} src="/music.mp3" loop />
      
      {crashFlash && <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: crashFlash === 'blue' ? 'rgba(0,240,255,0.4)' : 'rgba(255,0,0,0.4)', zIndex: 5, pointerEvents: 'none'}} />}
      <UIOverlay balances={balances} setBalances={setBalances} gameStarted={gameStarted} setGameStarted={setGameStarted} resetGame={resetGame} hasShield={hasShield} setHasShield={setHasShield} hasAutoSell={hasAutoSell} setHasAutoSell={setHasAutoSell} shipColor={shipColor} setShipColor={setShipColor} isPaused={isPaused} isMuted={isMuted} setIsMuted={setIsMuted} />
      <Suspense fallback={<div className="ui-container" style={{justifyContent: 'center', alignItems: 'center'}}><div className="loader"></div></div>}>
        <Scene onMine={handleMine} onCrash={handleCrash} fuelEmpty={fuelEmpty} gameStarted={gameStarted} hasShield={hasShield} shipColor={shipColor} isPaused={isPaused} />
      </Suspense>
    </>
  );
}

export default App;
