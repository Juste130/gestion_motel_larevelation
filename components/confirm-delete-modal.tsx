import { Trash2 } from "lucide-react"

export function ConfirmDeleteModal({ label, onConfirm, onCancel }: { label: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} className="bg-white rounded-md shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200">
        <div className="w-11 h-11 rounded-sm bg-red-50 flex items-center justify-center mb-4">
          <Trash2 size={20} className="text-red-500" />
        </div>
        <h3 className="font-bold text-zinc-900 text-lg mb-1">Supprimer cet élément ?</h3>
        <p className="text-sm text-zinc-500 mb-5 truncate">« {label} »</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1 h-10">
            Annuler
          </button>
          <button onClick={onConfirm} className="btn-destructive flex-1 h-10">
            Supprimer
          </button>
        </div>
      </div>
    </div>
  )
}
