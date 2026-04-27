import React from 'react';
import { Play, Calendar, MapPin, HardDrive, ExternalLink, Database } from 'lucide-react';

interface Footage {
  id: number;
  hash: string;
  label: string;
  timestamp: string;
  uploader: string;
}

interface FootageViewerProps {
  records: Footage[];
}

export const FootageViewer: React.FC<FootageViewerProps> = ({ records }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between group">
        <h2 className="text-2xl font-bold gradient-text">Available Records</h2>
        <div className="bg-white/5 px-4 py-1 rounded-full border border-white/10 text-xs text-white/40">
          {records.length} Secure Logs Found
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {records.length === 0 ? (
          <div className="col-span-full py-20 text-center glass-card">
            <Database className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/60">No footage records found on-chain.</p>
          </div>
        ) : (
          records.map((record) => (
            <div key={record.id} className="glass-card group hover:scale-[1.02]">
              <div className="relative h-40 mb-4 rounded-xl overflow-hidden bg-black/50 border border-white/5">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-vault-500 flex items-center justify-center cursor-pointer shadow-glow">
                    <Play className="text-white w-6 h-6 ml-1" />
                  </div>
                </div>
                <div className="absolute top-3 left-3 bg-vault-500/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                  Live Feed
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-vault-400" />
                  {record.label}
                </h3>
                
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Calendar className="w-4 h-4" />
                  {record.timestamp}
                </div>

                <div className="flex flex-col gap-1 p-3 bg-black/20 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] text-white/30 truncate">
                    <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Hash</span>
                    <a 
                      href={`https://ipfs.io/ipfs/${record.hash}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-vault-400 hover:underline flex items-center gap-1"
                    >
                      {record.hash.slice(0, 10)}... <ExternalLink className="w-2 h-2" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-white/30">
                    <span>Uploader</span>
                    <span>{record.uploader.slice(0, 4)}...{record.uploader.slice(-4)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
