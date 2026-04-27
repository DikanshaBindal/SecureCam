import React from 'react';
import { Shield, Wallet } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useBalance } from '../hooks/useBalance';

export const Navbar: React.FC = () => {
  const { address, connect, disconnect } = useWallet();
  const { xlmBalance, vaultBalance } = useBalance(address);

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-vault-500 p-2 rounded-lg animate-pulse-slow">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Secure<span className="text-vault-400">Cam</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-[10px] uppercase tracking-widest text-white/50">Stellar Testnet</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {address && (
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-white/40 uppercase tracking-tighter">XLM Balance</span>
                <span className="text-sm font-medium text-white">{parseFloat(xlmBalance).toLocaleString()} XLM</span>
              </div>
              <div className="flex flex-col items-end border-l border-white/10 pl-4">
                <span className="text-[10px] text-vault-400 uppercase tracking-tighter">$VAULT Token</span>
                <span className="text-sm font-bold text-vault-400">{parseFloat(vaultBalance).toLocaleString()} VAULT</span>
              </div>
            </div>
          )}

          {address ? (
            <div className="flex items-center gap-3">
              <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10">
                <span className="text-sm font-mono text-white/80">{truncate(address)}</span>
              </div>
              <button 
                onClick={disconnect}
                className="btn-secondary py-2"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button 
              onClick={connect}
              className="btn-primary flex items-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
