import React from 'react';

import { MessageSquare, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const InterestModal = ({ isOpen, onClose, onConfirm }: Props) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-sm bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
            <MessageSquare className="text-blue-500" size={24} />
          </div>

          <h3 className="text-xl font-bold text-white mb-2">Aktywacja czatu</h3>
          <p className="text-slate-300 mb-8 text-sm leading-relaxed">
            Oznaczasz się jako wstępnie zainteresowany tą ofertą i aktywujesz prywatny czat z wynajmującym. Kontynuować?
          </p>

          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition-all"
            >
              Anuluj
            </button>
            <button 
              onClick={onConfirm} 
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-900/30 transition-all"
            >
              Potwierdzam
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
