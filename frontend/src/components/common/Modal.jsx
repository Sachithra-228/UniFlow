import { X } from "lucide-react";
import Button from "./Button";

function Modal({ isOpen, title, children, onClose, footer }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="glass-card fine-scrollbar max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl p-5 md:p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-xl font-semibold">{title}</h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 !p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {children}

        {footer ? <div className="mt-6 border-t border-[color:var(--border)] pt-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export default Modal;
