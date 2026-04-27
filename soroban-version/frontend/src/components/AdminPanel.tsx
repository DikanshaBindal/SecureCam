import React, { useState } from 'react';
import { Upload, UserPlus, Send, Hash, Tag } from 'lucide-react';

interface AdminPanelProps {
  onUpload: (hash: string, label: string) => void;
  onGrant: (address: string) => void;
  onRevoke: (address: string) => void;
  onSendXLM: (to: string, amount: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onUpload, onGrant, onRevoke, onSendXLM 
}) => {
  const [hash, setHash] = useState('');
  const [label, setLabel] = useState('');
  const [grantAddr, setGrantAddr] = useState('');
  const [revokeAddr, setRevokeAddr] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendAmount, setSendAmount] = useState('');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
      {/* Upload Footage */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <Upload className="text-vault-400 w-6 h-6" />
          <h2 className="text-xl font-bold">Register CCTV Footage</h2>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Hash className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <input 
              type="text" placeholder="IPFS Hash (e.g. Qm...)"
              className="input-field w-full pl-10"
              value={hash} onChange={(e) => setHash(e.target.value)}
            />
          </div>
          <div className="relative">
            <Tag className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <input 
              type="text" placeholder="Location Label (e.g. Front Gate)"
              className="input-field w-full pl-10"
              value={label} onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <button 
            onClick={() => onUpload(hash, label)}
            className="btn-primary w-full"
          >
            Deploy Metadata to Soroban
          </button>
        </div>
      </div>

      {/* Access Control */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6">
          <UserPlus className="text-vault-400 w-6 h-6" />
          <h2 className="text-xl font-bold">Whitelist Management</h2>
        </div>
        <div className="space-y-6">
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Wallet Address to Grant"
              className="input-field flex-1"
              value={grantAddr} onChange={(e) => setGrantAddr(e.target.value)}
            />
            <button 
              onClick={() => onGrant(grantAddr)}
              className="bg-green-600/20 text-green-400 px-4 py-2 rounded-lg border border-green-500/30 hover:bg-green-600/30 transition-all"
            >
              Grant
            </button>
          </div>
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Wallet Address to Revoke"
              className="input-field flex-1"
              value={revokeAddr} onChange={(e) => setRevokeAddr(e.target.value)}
            />
            <button 
              onClick={() => onRevoke(revokeAddr)}
              className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/30 hover:bg-red-600/30 transition-all"
            >
              Revoke
            </button>
          </div>
        </div>
      </div>

      {/* Send XLM */}
      <div className="glass-card lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <Send className="text-vault-400 w-6 h-6" />
          <h2 className="text-xl font-bold">Quick XLM Transfer</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" placeholder="Recipient Address"
            className="input-field md:col-span-2"
            value={sendTo} onChange={(e) => setSendTo(e.target.value)}
          />
          <input 
            type="number" placeholder="Amount"
            className="input-field"
            value={sendAmount} onChange={(e) => setSendAmount(e.target.value)}
          />
          <button 
            onClick={() => onSendXLM(sendTo, sendAmount)}
            className="btn-primary md:col-span-3 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" /> Sign & Transfer
          </button>
        </div>
      </div>
    </div>
  );
};
