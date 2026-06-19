import React, { useState, useEffect } from 'react';
import { connectWallet, simulateTrade } from '../lib/stellar';
import { Rocket, Wallet, ArrowRightLeft, Zap, Trophy, Shield, Volume2, VolumeX } from 'lucide-react';

const MOCK_LEADERBOARD = [
  { player: 'GAYL...A7X2', score: 342, isMe: false },
  { player: 'GBL3...9P4Z', score: 289, isMe: false },
  { player: 'GDX1...0B21', score: 215, isMe: false },
  { player: 'GCV9...4N55', score: 180, isMe: false },
];

export default function UIOverlay({ balances, setBalances, gameStarted, setGameStarted, resetGame, hasShield, setHasShield, hasAutoSell, setHasAutoSell, shipColor, setShipColor, isPaused, isMuted, setIsMuted }) {
  const [wallet, setWallet] = useState(null);
  const [tradingSell, setTradingSell] = useState(false);
  const [buyingFuel, setBuyingFuel] = useState(false);
  const [buyingShield, setBuyingShield] = useState(false);
  const [buyingAutoSell, setBuyingAutoSell] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  
  const isAnyBuying = buyingFuel || buyingShield || buyingAutoSell;
  const [leaderboard, setLeaderboard] = useState(MOCK_LEADERBOARD);

  useEffect(() => {
    if (!gameStarted) {
      const localScore = parseInt(localStorage.getItem('stellarHighScore') || '0');
      const localPlayer = localStorage.getItem('stellarHighPlayer') || 'Demo Player';
      
      let newBoard = [...MOCK_LEADERBOARD];
      if (localScore > 0) {
        newBoard.push({ player: localPlayer, score: localScore, isMe: true });
      }
      newBoard.sort((a, b) => b.score - a.score);
      setLeaderboard(newBoard.slice(0, 5));
    }
  }, [gameStarted]);

  const handleConnect = async () => {
    if (wallet) {
      setShowColorPicker(true);
      return;
    }
    const pubKey = await connectWallet();
    if (pubKey) {
      setWallet(pubKey);
      setShowColorPicker(true);
    }
  };

  const startGameWithColor = (color) => {
    setShipColor(color);
    setShowColorPicker(false);
    setGameStarted(true);
  };

  const handleSellOre = async () => {
    if (!wallet) return alert("Please connect Freighter wallet first!");
    if (balances.ORE < 10) return alert("Not enough ORE. You need 10 ORE to sell.");
    
    setTradingSell(true);
    const success = await simulateTrade("ORE", "XLM", 10);
    if (success) {
      setBalances(prev => ({ ...prev, ORE: prev.ORE - 10, XLM: prev.XLM + 5 }));
    }
    setTradingSell(false);
  };

  const handleBuyFuel = async () => {
    if (!wallet) return alert("Please connect Freighter wallet first!");
    if (balances.XLM < 2) return alert("Not enough XLM. You need 2 XLM to buy fuel.");
    
    setBuyingFuel(true);
    const success = await simulateTrade("XLM", "FUEL", 2);
    if (success) {
      setBalances(prev => ({ ...prev, XLM: prev.XLM - 2, FUEL: prev.FUEL + 100 }));
    }
    setBuyingFuel(false);
  };

  const handleBuyShield = async () => {
    if (!wallet) return alert("Please connect Freighter wallet first!");
    if (hasShield) return alert("You already have an active shield!");
    if (balances.XLM < 5) return alert("Not enough XLM. You need 5 XLM to buy a shield.");
    
    setBuyingShield(true);
    const success = await simulateTrade("XLM", "SHIELD", 5);
    if (success) {
      setBalances(prev => ({ ...prev, XLM: prev.XLM - 5 }));
      setHasShield(true);
    }
    setBuyingShield(false);
  };

  const handleBuyAutoSell = async () => {
    if (!wallet) return alert("Please connect Freighter wallet first!");
    if (hasAutoSell) return alert("You already have the Auto-Sell Module!");
    if (balances.XLM < 15) return alert("Not enough XLM. You need 15 XLM to buy Auto-Sell.");
    
    setBuyingAutoSell(true);
    const success = await simulateTrade("XLM", "AUTOSELL", 15);
    if (success) {
      setBalances(prev => ({ ...prev, XLM: prev.XLM - 15 }));
      setHasAutoSell(true);
    }
    setBuyingAutoSell(false);
  };

  const handleRestart = () => {
    setShowColorPicker(false);
    if (balances.SCORE > 0) {
      const currentHigh = parseInt(localStorage.getItem('stellarHighScore') || '0');
      if (balances.SCORE > currentHigh) {
        localStorage.setItem('stellarHighScore', balances.SCORE.toString());
        if (wallet && wallet !== "GA_MOCK_WALLET_DEMO_ACCOUNT_FOR_HACKATHON") {
          localStorage.setItem('stellarHighPlayer', `${wallet.substring(0, 4)}...${wallet.substring(52)}`);
        } else {
          localStorage.setItem('stellarHighPlayer', `Demo Player`);
        }
      }
    }
    resetGame();
    setGameStarted(false); 
  };

  if (!gameStarted && showColorPicker) {
    return (
      <div className="ui-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(5,5,16,0.95)', backdropFilter: 'blur(10px)', pointerEvents: 'auto', zIndex: 100 }}>
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '600px', width: '100%' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '30px', color: 'white' }}>Customize Your Ship</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Select an engine core color for your spaceship.</p>
          <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px' }}>
            <button className="glass-button" style={{ flex: 1, height: '120px', flexDirection: 'column', backgroundColor: 'rgba(0, 240, 255, 0.1)', border: '2px solid #00f0ff', color: '#00f0ff', fontSize: '1.2rem', justifyContent: 'center', gap: '10px' }} onClick={() => startGameWithColor('#00f0ff')}>
              <Rocket size={40} color="#00f0ff" />
              <span>Cyan</span>
            </button>
            <button className="glass-button" style={{ flex: 1, height: '120px', flexDirection: 'column', backgroundColor: 'rgba(157, 0, 255, 0.1)', border: '2px solid #9d00ff', color: '#9d00ff', fontSize: '1.2rem', justifyContent: 'center', gap: '10px' }} onClick={() => startGameWithColor('#9d00ff')}>
              <Rocket size={40} color="#9d00ff" />
              <span>Purple</span>
            </button>
            <button className="glass-button" style={{ flex: 1, height: '120px', flexDirection: 'column', backgroundColor: 'rgba(255, 215, 0, 0.1)', border: '2px solid #ffd700', color: '#ffd700', fontSize: '1.2rem', justifyContent: 'center', gap: '10px' }} onClick={() => startGameWithColor('#ffd700')}>
              <Rocket size={40} color="#ffd700" />
              <span>Gold</span>
            </button>
          </div>
          <button className="glass-button danger" style={{ padding: '10px 30px' }} onClick={() => setShowColorPicker(false)}>Cancel</button>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="ui-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(5,5,16,0.8)', backdropFilter: 'blur(5px)', pointerEvents: 'auto' }}>
        <div style={{ display: 'flex', gap: '40px', maxWidth: '1000px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
          
          {/* Sol Kısım: Oyun Açıklaması ve Başla Butonu */}
          <div className="glass-panel" style={{ flex: '1 1 400px', padding: '50px', textAlign: 'center' }}>
            <img src="/logo.png" alt="Stellar Odyssey" style={{ width: '100%', maxWidth: '300px', marginBottom: '20px', borderRadius: '15px', boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', fontSize: '1.1rem', lineHeight: '1.5' }}>
              A Web3 space survival game powered by Soroban smart contracts. Dodge asteroids, mine resources, and buy fuel to climb the galactic leaderboard!
            </p>
            
            {/* OYUN KONTROLLERİ */}
            <div style={{ marginBottom: '30px', padding: '15px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px' }}>
              <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>How to Play</h3>
              <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <kbd style={{ background: '#222', padding: '4px 8px', borderRadius: '4px', color: 'var(--accent-cyan)', borderBottom: '2px solid #111', fontFamily: 'monospace' }}>W A S D</kbd> Move Ship
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <kbd style={{ background: '#222', padding: '4px 8px', borderRadius: '4px', color: '#ff0055', borderBottom: '2px solid #111', fontFamily: 'monospace' }}>MOUSE</kbd> Aim & Shoot
                </div>
              </div>
            </div>

            <button className="glass-button" style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', padding: '15px' }} onClick={handleConnect}>
              {wallet && wallet !== "GA_MOCK_WALLET_DEMO_ACCOUNT_FOR_HACKATHON" ? <Rocket size={24} style={{ marginRight: '10px' }} /> : <Wallet size={24} style={{ marginRight: '10px' }} />}
              {wallet ? "Start Engine" : "Connect Wallet to Start"}
            </button>
          </div>

          {/* Sağ Kısım: Liderlik Tablosu */}
          <div className="glass-panel" style={{ flex: '1 1 400px', padding: '40px' }}>
            <h2 style={{ color: 'var(--accent-cyan)', marginBottom: '20px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Trophy size={24} /> Galactic Leaderboard
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {leaderboard.map((entry, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '8px', border: entry.isMe ? '1px solid var(--accent-cyan)' : 'none' }}>
                  <span style={{ color: entry.isMe ? 'var(--accent-cyan)' : 'white', fontWeight: entry.isMe ? 'bold' : 'normal' }}>
                    #{idx + 1} {entry.player} {entry.isMe && '(You)'}
                  </span>
                  <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{entry.score} px</span>
                </div>
              ))}
            </div>
            <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '20px' }}>Scores stored via Soroban (Testnet)</p>
          </div>

        </div>
      </div>
    );
  }

  // GAME OVER EKRANI
  if (balances.FUEL === 0 && balances.XLM < 2) {
    return (
      <div className="ui-container" style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.1)', backdropFilter: 'blur(5px)', pointerEvents: 'auto' }}>
        <div className="glass-panel" style={{ padding: '50px', textAlign: 'center', maxWidth: '500px', border: '1px solid rgba(255,0,0,0.5)' }}>
          <h1 className="game-title" style={{ fontSize: '3rem', marginBottom: '20px', background: 'linear-gradient(to right, #ff0055, #ff5500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            GAME OVER
          </h1>
          <p style={{ color: 'var(--text-primary)', marginBottom: '10px', fontSize: '1.1rem', lineHeight: '1.5' }}>
            You ran out of Fuel and don't have enough XLM to buy more.
          </p>
          <p style={{ marginBottom: '40px' }}>
            <strong style={{fontSize: '1.5rem', color: 'var(--accent-cyan)'}}>Final Score: {balances.SCORE} Parsecs</strong>
          </p>
          <button className="glass-button danger" style={{ width: '100%', justifyContent: 'center', fontSize: '1.2rem', padding: '15px' }} onClick={handleRestart}>
            <Rocket size={24} style={{ marginRight: '10px' }} />
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-container">
      {/* PAUSED EKRANI */}
      {isPaused && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, textAlign: 'center', pointerEvents: 'none' }}>
          <h2 style={{ fontSize: '4rem', color: 'white', letterSpacing: '10px', textShadow: '0 0 20px #00f0ff', margin: 0 }}>PAUSED</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', marginTop: '10px' }}>Press ESC to Resume</p>
        </div>
      )}

      {/* OUT OF FUEL EKRANI (Ortada) */}
      {gameStarted && balances.FUEL === 0 && balances.XLM >= 2 && !isPaused && (
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 50, textAlign: 'center', pointerEvents: 'none' }}>
          <h2 style={{ fontSize: '4rem', color: '#ff0055', letterSpacing: '5px', textShadow: '0 0 20px #ff0055', margin: 0, textTransform: 'uppercase' }}>Out Of Fuel!</h2>
          <p style={{ color: 'white', fontSize: '1.3rem', marginTop: '15px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '10px 20px', borderRadius: '8px', border: '1px solid rgba(255,0,85,0.5)' }}>Use the Neon Trade Post to Buy Fuel & Revive!</p>
        </div>
      )}

      {/* LOW FUEL WARNING */}
      {gameStarted && balances.FUEL > 0 && balances.FUEL <= 30 && !isPaused && (
        <div className="low-fuel-warning">
          ⚠️ LOW FUEL ⚠️
        </div>
      )}

      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo.png" alt="Logo" style={{ height: '50px', borderRadius: '8px', boxShadow: '0 0 10px rgba(0, 240, 255, 0.3)' }} />
          <div>
            <h1 className="game-title" style={{ fontSize: '1.5rem', marginBottom: '0' }}>Stellar Odyssey</h1>
            <p className="game-subtitle" style={{ marginTop: '5px' }}>Dodge Asteroids & Mine Ore!</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="glass-button" onClick={() => setIsMuted(!isMuted)} style={{ padding: '10px' }}>
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <button className="glass-button">
            <Wallet size={18} />
            {wallet && wallet !== "GA_MOCK_WALLET_DEMO_ACCOUNT_FOR_HACKATHON" ? `${wallet.substring(0, 6)}...${wallet.substring(52)}` : "Demo Mode"}
          </button>
        </div>
      </div>

      {/* Trade Panel */}
      <div className="trade-panel glass-panel">
        <h3 className="trade-title">Neon Trade Post</h3>
        
        <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "10px" }}>Sell Ore (10 Ore = 5 XLM)</p>
          <button className="glass-button" style={{ width: "100%", justifyContent: "center" }} onClick={handleSellOre} disabled={tradingSell || isPaused}>
            {tradingSell ? <div className="loader"></div> : <><ArrowRightLeft size={18} /> Sell 10 Ore</>}
          </button>
        </div>

        <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "10px" }}>Buy Fuel (2 XLM = 100 Fuel)</p>
          <button className="glass-button" style={{ width: "100%", justifyContent: "center" }} onClick={handleBuyFuel} disabled={isAnyBuying || isPaused}>
            {buyingFuel ? <div className="loader"></div> : <><Zap size={18} /> Buy 100 Fuel</>}
          </button>
        </div>

        <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "15px" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "10px" }}>Energy Shield (5 XLM)</p>
          <button className="glass-button" style={{ width: "100%", justifyContent: "center", border: hasShield ? '1px solid #00f0ff' : 'none' }} onClick={handleBuyShield} disabled={isAnyBuying || hasShield || balances.FUEL === 0 || isPaused}>
            {hasShield ? <><Shield size={18} color="#00f0ff" /> Shield Active</> : (buyingShield ? <div className="loader"></div> : <><Shield size={18} /> Buy Shield</>)}
          </button>
        </div>

        <div>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.8rem", marginBottom: "10px" }}>Auto-Sell Module (15 XLM)</p>
          <button className="glass-button" style={{ width: "100%", justifyContent: "center", border: hasAutoSell ? '1px solid #9d00ff' : 'none' }} onClick={handleBuyAutoSell} disabled={isAnyBuying || hasAutoSell || balances.FUEL === 0 || isPaused}>
            {hasAutoSell ? <><ArrowRightLeft size={18} color="#9d00ff" /> Module Active</> : (buyingAutoSell ? <div className="loader"></div> : <><ArrowRightLeft size={18} /> Buy Auto-Sell</>)}
          </button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="bottom-bar">
        <div className="dashboard glass-panel">
          <h3 style={{ marginBottom: '15px', color: balances.FUEL === 0 ? '#ff4444' : 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Rocket size={18} color={balances.FUEL === 0 ? "#ff4444" : "var(--accent-cyan)"} />
            {balances.FUEL === 0 ? "OUT OF FUEL!" : "Ship Status"}
          </h3>
          <div className="stat-row">
            <span className="stat-label">Distance (Score)</span>
            <span className="stat-value" style={{ color: "var(--accent-cyan)", fontWeight: "800" }}>{balances.SCORE} Parsecs</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">XLM Balance</span>
            <span className="stat-value">{balances.XLM.toFixed(2)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Fuel (Tokens)</span>
            <span className="stat-value" style={{ color: balances.FUEL < 20 ? "#ff4444" : "var(--accent-purple)" }}>{balances.FUEL}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Space Ore</span>
            <span className="stat-value" style={{ color: "#ffd700" }}>{balances.ORE}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
