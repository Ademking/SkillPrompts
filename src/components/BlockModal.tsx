import { useState } from "react"
import type { Block } from "~types"
import { Icons } from "~components/Icons"

const emptyBlock = { id: "", name: "", value: "" }

export function BlockModal({
    blocks,
    onSave,
    onClose,
}: {
    blocks: Block[]
    onSave: (blocks: Block[]) => void
    onClose: () => void
}) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState(emptyBlock)

    const handleEdit = (b: Block) => {
        setEditingId(b.id)
        setForm(b)
    }

    const handleDelete = (id: string) => {
        onSave(blocks.filter(b => b.id !== id))
    }

    const handleFormSave = () => {
        const name = form.name.trim()
        const value = form.value.trim()
        if (!name || !value) return
        const dup = blocks.some(b => b.id !== editingId && b.name.toLowerCase() === name.toLowerCase())
        if (dup) return
        const updated = editingId
            ? blocks.map(b => b.id === editingId ? { ...b, name, value } : b)
            : [...blocks, { id: String(Date.now()), name, value }]
        onSave(updated)
        setEditingId(null)
        setForm(emptyBlock)
    }

    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
        >
            <div
                className="plasmo-w-full plasmo-max-w-xl modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className="plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-2 plasmo-border-b plasmo-border-[var(--border)]">
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-[var(--accent)]" />
                            <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">Reusable Blocks</span>
                        </div>
                        <button onClick={onClose} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            <Icons.x />
                        </button>
                    </div>

                    <div className="plasmo-border-[var(--border)]">
                        <p className="plasmo-text-[12px] plasmo-text-[var(--dim)] plasmo-px-5 plasmo-pt-3">
                            Define reusable blocks of text that can be inserted into prompts. Unlike variables, blocks have fixed values that you manage here. Use them to store common instructions, context, or any text snippets you want to reuse across multiple prompts.
                        </p>
                    </div>

                    <div className="plasmo-p-5 plasmo-flex plasmo-flex-col plasmo-gap-3">
                        <div className="plasmo-flex plasmo-gap-2">
                            <input
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                                placeholder="block-name"
                                className="plasmo-flex-1 plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none focus:plasmo-border-[var(--accent)] placeholder:plasmo-text-[var(--dim)]"
                            />
                            <input
                                value={form.value}
                                onChange={e => setForm({ ...form, value: e.target.value })}
                                placeholder="Value"
                                className="plasmo-flex-[2] plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none focus:plasmo-border-[var(--accent)] placeholder:plasmo-text-[var(--dim)]"
                            />
                            <button
                                onClick={handleFormSave}
                                className="plasmo-h-9 plasmo-px-4 plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[13px] plasmo-font-light plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                            >
                                {editingId ? "Update" : "Add"}
                            </button>
                        </div>

                        {blocks.length === 0 ? (
                            <p className="plasmo-text-[12px] plasmo-text-[var(--dim)] plasmo-text-center plasmo-py-6">No blocks yet. Add a block to reuse values across prompts.</p>
                        ) : (
                            <div className="plasmo-flex plasmo-flex-col plasmo-gap-1 plasmo-max-h-[240px] plasmo-overflow-y-auto">
                                {blocks.map(b => (
                                    <div key={b.id} className="plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-3 plasmo-py-2 plasmo-border plasmo-border-[var(--border)]">
                                        <span className="plasmo-font-mono plasmo-text-[12px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1.5 plasmo-py-0.5">&#123;&#123;{b.name}&#125;&#125;</span>
                                        <span className="plasmo-flex-1 plasmo-text-[12px] plasmo-text-[var(--muted)] plasmo-truncate">{b.value}</span>
                                        <button onClick={() => handleEdit(b)} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                                            <Icons.edit />
                                        </button>
                                        <button onClick={() => handleDelete(b.id)} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] hover:plasmo-bg-red-500/10 hover:plasmo-text-red-500">
                                            <Icons.trash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <p className="plasmo-text-[11px] plasmo-text-[var(--dim)]">
                            Use <span className="plasmo-font-mono plasmo-text-amber-400">&#123;&#123;block-name&#125;&#125;</span> in any prompt template. Update once, updates everywhere.
                        </p>
                    </div>

                    <div className="plasmo-flex plasmo-items-center plasmo-justify-end plasmo-px-5 plasmo-py-2 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                        <button onClick={onClose} className="plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}