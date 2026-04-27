import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AdminPanel } from './components/AdminPanel';
import { FootageViewer } from './components/FootageViewer';
import { AccessDenied } from './components/AccessDenied';
import { TxStatus } from './components/TxStatus';
import type { TxStep } from './components/TxStatus';
import { useWallet } from './hooks/useWallet';
import { ADMIN_ADDRESS } from './constants';
import { Shield, LayoutDashboard, Database, UserCheck } from 'lucide-react';

// Mock Data for Demo
const MOCK_RECORDS = [
  { id: 1, hash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco', label: 'Main Entrance - South', timestamp: '2024-03-27 10:22:45', uploader: ADMIN_ADDRESS },
  { id: 2, hash: 'QmZ4tj8f37Lao556uK6aA0F8F1Sj3u9KsdX32a8G8A1Q7t', label: 'Data Center - Floor 2', timestamp: '2024-03-27 11:15:12', uploader: ADMIN_ADDRESS },
];

const App: React.FC = () => {
  const { address, connect } = useWallet();
  const [isVerified, setIsVerified] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [txStep, setTxStep] = useState<TxStep>('IDLE');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (address) {
      setIsAdmin(address === ADMIN_ADDRESS);
      // In production, call is_verified on-chain
      setIsVerified(address === ADMIN_ADDRESS || address.startsWith('GC')); // Simplified logic for demo
    }
  }, [address]);

  const handleAction = async (_actionName: string) => {
    setTxStep('PENDING');
    setError('');
    
    // Simulate Blockchain Latency
    setTimeout(() => setTxStep('SUBMITTED'), 1500);
    setTimeout(() => {
      setTxHash('5a8d9...f4e2');
      setTxStep('CONFIRMED');
    }, 4000);
  };

  return (
    <div className="min-h-screen pb-20">
      <Navbar />

      <main className="max-w-7xl mx-auto pt-32 px-6">
        {!address || (!isAdmin && !isVerified) ? (
          <AccessDenied connected={!!address} onConnect={connect} />
        ) : (
          <div className="space-y-12">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-4xl font-black tracking-tighter mb-2">
                  <span className="gradient-text">Security Dashboard</span>
                </h1>
                <p className="text-white/40 flex items-center gap-2">
                  {isAdmin ? (
                    <><Shield className="w-4 h-4" /> Administrative Access Active</>
                  ) : (
                    <><UserCheck className="w-4 h-4" /> Verified Observer Status</>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <div className="glass px-4 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                  <Database className="w-3 h-3 text-vault-400" />
                  Source: Soroban RPC
                </div>
              </div>
            </header>

            {isAdmin && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <LayoutDashboard className="w-5 h-5 text-vault-400" />
                  <h2 className="text-lg font-bold uppercase tracking-widest text-white/60">Admin Controls</h2>
                </div>
                <AdminPanel 
                  onUpload={() => handleAction('upload')}
                  onGrant={() => handleAction('grant')}
                  onRevoke={() => handleAction('revoke')}
                  onSendXLM={() => handleAction('send')}
                />
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Database className="w-5 h-5 text-vault-400" />
                <h2 className="text-lg font-bold uppercase tracking-widest text-white/60">On-Chain Metadata</h2>
              </div>
              <FootageViewer records={MOCK_RECORDS} />
            </section>
          </div>
        )}
      </main>

      <TxStatus 
        step={txStep} 
        hash={txHash} 
        error={error} 
        onClear={() => setTxStep('IDLE')} 
      />
    </div>
  );
};

export default App;
