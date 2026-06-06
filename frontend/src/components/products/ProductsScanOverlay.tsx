import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface ProductsScanOverlayProps {
  isOpen: boolean;
}

export default function ProductsScanOverlay({ isOpen }: ProductsScanOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className="w-full max-w-md rounded-4xl bg-white p-8 shadow-2xl"
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <Loader2 size={30} className="animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Идёт чтение накладной</h3>
              <p className="mt-2 text-sm text-slate-500">
                Система сама распознаёт позиции, количество и закупку. Обычно лучше всего читается одна чёткая страница.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
