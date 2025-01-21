import { CheckCircle2, XCircle, Loader2, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TransactionToastProps {
  status: 'success' | 'error' | 'pending';
  message: string;
  hash?: string;
  onClose: () => void;
}

export const TransactionToast = ({ status, message, hash, onClose }: TransactionToastProps) => {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="mb-6 w-full"
      >
        <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-lg 
                      w-full flex items-start gap-3">
          {status === 'pending' && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
          {status === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
          
          <div className="flex-1">
            <div className="text-white font-medium mb-1">{message}</div>
            {hash && (
              <a 
                href={`https://explorer.multiversx.com/transactions/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-white/60 hover:text-white flex items-center gap-1.5"
              >
                View on Explorer
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <button 
            onClick={onClose}
            className="text-white/40 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}; 