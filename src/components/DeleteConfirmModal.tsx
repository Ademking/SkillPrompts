export function DeleteConfirmModal({
    label,
    onConfirm,
    onClose,
}: {
    label: string
    onConfirm: () => void
    onClose: () => void
}) {
    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={onClose}
        >
            <div
                className="plasmo-w-full plasmo-max-w-sm modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                    <div className="plasmo-p-5 plasmo-flex plasmo-flex-col plasmo-gap-3">
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-red-500" />
                            <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">
                                Delete skill
                            </span>
                        </div>
                        <p className="plasmo-text-[13px] plasmo-text-[var(--muted)] plasmo-leading-relaxed">
                            Are you sure you want to delete <span className="plasmo-font-semibold plasmo-text-[var(--text)]">/{label}</span>? This cannot be undone.
                        </p>
                    </div>
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-end plasmo-gap-2 plasmo-px-5 plasmo-py-3 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                        <button
                            onClick={onClose}
                            className="plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            className="plasmo-h-9 plasmo-px-4 plasmo-bg-red-500 plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
