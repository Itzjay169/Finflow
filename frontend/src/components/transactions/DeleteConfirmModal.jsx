import React from 'react'
import { Modal, Button } from '../ui'
import { AlertTriangle, Trash2 } from 'lucide-react'

export const DeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  count = 1,
  isBulk = false,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isBulk ? `Delete ${count} Transactions?` : 'Delete Transaction?'}
      description="This action will permanently remove the record(s) from your ledger database."
      maxWidth="max-w-md"
    >
      <div className="space-y-4 pt-2 text-left">
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300 space-y-1">
            <p className="font-semibold text-rose-200">
              Irreversible Ledger Modification
            </p>
            <p>
              {isBulk
                ? `You are about to delete ${count} selected transactions. Associated summaries, cashflow stats, and charts will recalculate automatically.`
                : 'This transaction will be purged from your telemetry ledger and cannot be recovered.'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={loading}
            className="gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            {isBulk ? `Delete ${count} Records` : 'Delete Transaction'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
