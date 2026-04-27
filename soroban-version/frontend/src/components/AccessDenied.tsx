import React from 'react';
import { ShieldAlert, Lock, ArrowRight } from 'lucide-react';

interface AccessDeniedProps {
  connected: boolean;
  onConnect: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ connected, onConnect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 animate-glow border border-red-500/20">
        {connected ? <Lock className="text-red-500 w-10 h-10" /> : <ShieldAlert className="text-amber-500 w-10 h-10" />}
      </div>
      
      <h2 className="text-3xl font-bold mb-4">
        {connected ? "Identity Not Whitelisted" : "Secure Connection Required"}
      </h2>
      
      <p className="text-white/60 max-w-md mb-8 leading-relaxed">
        {connected 
          ? "Your wallet address is not registered in our decentralized registry. Please contact the security administrator to request access."
          : "Access to CCTV footage metadata is restricted to authorized personnel. Please connect your Freighter wallet to continue."}
      </p>

      {!connected && (
        <button 
          onClick={onConnect}
          className="btn-primary flex items-center gap-2 group px-8"
        >
          Initialize Connection
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      )}
    </div>
  );
};
