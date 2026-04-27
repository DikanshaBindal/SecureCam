import React from 'react';
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';

export type TxStep = 'IDLE' | 'PENDING' | 'SUBMITTED' | 'CONFIRMED' | 'FAILED';

interface TxStatusProps {
  step: TxStep;
  hash?: string;
  error?: string;
  onClear: () => void;
}

export const TxStatus: React.FC<TxStatusProps> = ({ step, hash, error, onClear }) => {
  if (step === 'IDLE') return null;

  return (
    <div className="fixed bottom-8 right-8 z-[100] animate-in slide-in-from-bottom-5">
      <div className={`glass-card p-4 min-w-[320px] flex items-center gap-4 border-l-4 ${
        step === 'CONFIRMED' ? 'border-l-green-500' : 
        step === 'FAILED' ? 'border-l-red-500' : 'border-l-vault-500'
      }`}>
        <div className="flex-shrink-0">
          {(step === 'PENDING' || step === 'SUBMITTED') && <Loader2 className="w-6 h-6 text-vault-400 animate-spin" />}
          {step === 'CONFIRMED' && <CheckCircle2 className="w-6 h-6 text-green-500" />}
          {step === 'FAILED' && <XCircle className="w-6 h-6 text-red-500" />}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white">
            {step === 'PENDING' && 'Awaiting Signature...'}
            {step === 'SUBMITTED' && 'Processing Transaction...'}
            {step === 'CONFIRMED' && 'Transaction Confirmed'}
            {step === 'FAILED' && 'Transaction Failed'}
          </p>
          
          {hash && (
            <a 
              href={`https://stellar.expert/explorer/testnet/tx/${hash}`}
              target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-vault-400 hover:underline flex items-center gap-1 mt-1"
            >
              View on Explorer <ExternalLink className="w-2 h-2" />
            </a>
          )}
          
          {error && <p className="text-[10px] text-red-400 mt-1 line-clamp-2">{error}</p>}
        </div>

        {(step === 'CONFIRMED' || step === 'FAILED') && (
          <button onClick={onClear} className="text-white/20 hover:text-white transition-colors">
            <XCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
