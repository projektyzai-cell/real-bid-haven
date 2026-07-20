import { MessageSquare, X } from "lucide-react";

interface InterestModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function InterestModal({ open, onClose, onConfirm }: InterestModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          aria-label="Zamknij"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900">Aktywacja czatu</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-600">
          Oznaczasz się jako wstępnie zainteresowany tą ofertą i aktywujesz prywatny czat z wynajmującym. Kontynuować?
        </p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
          >
            Anuluj
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:w-auto"
          >
            Potwierdzam
          </button>
        </div>
      </div>
    </div>
  );
}
