import { useEffect, useRef, useState } from "react"
import type { Prompt } from "~types"
import { Icons } from "~components/Icons"
import { Field } from "~components/Field"

const emptyForm = { id: "", label: "", description: "", template: "" }

const isValidSlug = (slug: string): boolean => /^[a-z0-9_-]+$/.test(slug)

export function FormModal({
    prompts,
    editingId,
    initialData,
    onSave,
    onClose,
}: {
    prompts: Prompt[]
    editingId: string | null
    initialData?: Prompt
    onSave: (data: Prompt) => void
    onClose: () => void
}) {
    const [formData, setFormData] = useState(
        initialData || (editingId ? prompts.find(p => p.id === editingId) || emptyForm : emptyForm)
    )
    const [formErrors, setFormErrors] = useState({ label: false, labelInvalid: false, labelDuplicate: false, template: false })
    const labelRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)
    const templateRef = useRef<HTMLDivElement>(null)
    const highlightInitRef = useRef(false)

    useEffect(() => {
        if (!templateRef.current || highlightInitRef.current) return
        templateRef.current.textContent = formData.template
        highlightInitRef.current = true
    }, [formData.template])

    useEffect(() => {
        if (!templateRef.current) return
        const el = templateRef.current
        const text = el.textContent || ""
        const regex = /\{\{\s*\w+\s*\}\}/g
        const ranges: Range[] = []
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null)
        const textNodes: Text[] = []
        let node
        while ((node = walker.nextNode())) textNodes.push(node as Text)

        for (const tn of textNodes) {
            const content = tn.nodeValue || ""
            let match
            while ((match = regex.exec(content)) !== null) {
                const range = document.createRange()
                range.setStart(tn, match.index)
                range.setEnd(tn, match.index + match[0].length)
                ranges.push(range)
            }
        }

        try {
            ; (CSS as any).highlights.delete("form-var-highlight")
            if (ranges.length > 0) {
                const highlight = new Highlight(...ranges)
                    ; (CSS as any).highlights.set("form-var-highlight", highlight)
            }
        } catch (e) {
            // ignore
        }
    }, [formData.template])

    useEffect(() => {
        setTimeout(() => labelRef.current?.focus(), 80)
    }, [])

    const handleSave = () => {
        const labelTrimmed = formData.label.trim()
        const labelEmpty = !labelTrimmed
        const labelInvalid = labelTrimmed && !isValidSlug(labelTrimmed)
        const labelDuplicate = prompts.some(p => p.id !== editingId && p.label.toLowerCase() === labelTrimmed.toLowerCase())
        const templateEmpty = !formData.template.trim()

        setFormErrors({
            label: labelEmpty,
            labelInvalid,
            labelDuplicate,
            template: templateEmpty
        })

        if (labelEmpty || labelInvalid || labelDuplicate || templateEmpty) return
        onSave(formData)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleSave()
        }
    }

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose()
        }
    }

    const inputCls = `plasmo-w-full plasmo-px-3.5 plasmo-py-2.5  plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none plasmo-transition-all plasmo-duration-150 focus:plasmo-border-[var(--accent)] focus:plasmo-ring-2 focus:plasmo-ring-[var(--accent-bg)] placeholder:plasmo-text-[var(--dim)]`

    return (
        <div
            className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
            onClick={handleBackdropClick}
            onKeyDown={handleKeyDown}
        >
            <div
                ref={modalRef}
                className="plasmo-w-full plasmo-max-w-4xl modal-content"
                onClick={e => e.stopPropagation()}
            >
                <div className=" plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                    {/* Form header */}
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-2 plasmo-border-b plasmo-border-[var(--border)]">
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            <div className="plasmo-w-2 plasmo-h-2 plasmo-bg-[var(--accent)]" />
                            <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">
                                {editingId ? "Edit Skill" : "New Skill"}
                            </span>
                        </div>
                        <button onClick={onClose} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center  plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                            <Icons.x />
                        </button>
                    </div>

                    {/* Form body */}
                    <div className="plasmo-p-5 plasmo-flex plasmo-flex-col plasmo-gap-4">
                        <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3.5">
                            <Field label="Command" error={formErrors.label || formErrors.labelInvalid || formErrors.labelDuplicate} errorMessage={formErrors.label ? "Required" : formErrors.labelDuplicate ? "Already exists" : "Only a-z, 0-9, - and _"}>
                                <div className="plasmo-relative">
                                    <span className="plasmo-absolute plasmo-left-3.5 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-[var(--dim)] plasmo-text-[13px] plasmo-font-mono plasmo-font-semibold plasmo-pointer-events-none">/</span>
                                    <input
                                        ref={labelRef}
                                        className={`${inputCls} plasmo-pl-7 ${formErrors.label || formErrors.labelInvalid || formErrors.labelDuplicate ? "plasmo-border-red-500/50 plasmo-ring-2 plasmo-ring-red-500/10" : ""}`}
                                        placeholder="command-name"
                                        value={formData.label}
                                        onChange={e => {
                                            const val = e.target.value.toLowerCase().replace(/ /g, '-')
                                            setFormData({ ...formData, label: val });
                                            setFormErrors(x => ({
                                                ...x,
                                                label: false,
                                                labelInvalid: val.length > 0 && !isValidSlug(val),
                                                labelDuplicate: val.length > 0 && prompts.some(p => p.id !== editingId && p.label.toLowerCase() === val.toLowerCase())
                                            }))
                                        }}
                                        onKeyDown={e => {
                                            if (e.key === ' ') {
                                                e.preventDefault()
                                                const input = e.currentTarget
                                                const newVal = input.value + '-'
                                                setFormData({ ...formData, label: newVal });
                                                setFormErrors(x => ({
                                                    ...x,
                                                    label: false,
                                                    labelInvalid: newVal.length > 0 && !isValidSlug(newVal),
                                                    labelDuplicate: newVal.length > 0 && prompts.some(p => p.id !== editingId && p.label.toLowerCase() === newVal.toLowerCase())
                                                }))
                                            }
                                        }}
                                    />
                                </div>
                            </Field>
                            <Field label="Description">
                                <input
                                    className={inputCls}
                                    placeholder="What it does"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </Field>
                        </div>
                        <Field label="Template" error={formErrors.template}>
                            <style>{`
                                ::highlight(form-var-highlight) {
                                    background-color: rgba(245, 158, 11, 0.18);
                                    color: #F59E0B;
                                    border-radius: 2px;
                                }
                                [contenteditable][data-placeholder]:empty::before {
                                    content: attr(data-placeholder);
                                    color: var(--dim);
                                    pointer-events: none;
                                }
                            `}</style>
                            <div
                                ref={templateRef}
                                contentEditable
                                suppressContentEditableWarning
                                className={`plasmo-w-full plasmo-px-3.5 plasmo-py-3 plasmo-font-mono plasmo-text-[12px] plasmo-leading-relaxed plasmo-outline-none plasmo-whitespace-pre-wrap plasmo-break-words plasmo-overflow-y-auto plasmo-transition-all plasmo-duration-150 focus:plasmo-border-[var(--accent)] focus:plasmo-ring-2 focus:plasmo-ring-[var(--accent-bg)] plasmo-border ${formErrors.template ? "plasmo-border-red-500/50 plasmo-ring-2 plasmo-ring-red-500/10" : "plasmo-border-[var(--border)]"} plasmo-bg-[var(--input-bg)] plasmo-text-[var(--text)]`}
                                style={{ caretColor: 'var(--text)', height: '160px', maxHeight: '160px' }}
                                onInput={() => {
                                    const val = templateRef.current?.textContent || ""
                                    setFormData(prev => ({ ...prev, template: val }))
                                    setFormErrors(x => ({ ...x, template: false }))
                                }}
                                onKeyDown={e => {
                                    if (e.key === "Tab") {
                                        e.preventDefault()
                                        document.execCommand("insertText", false, "  ")
                                    }
                                }}
                                data-placeholder="You are an expert at..."
                            ></div>
                            <p className="plasmo-mt-1.5 plasmo-text-[11px] plasmo-text-[var(--dim)]">
                                Tip: Use <span className="plasmo-font-mono plasmo-text-amber-400">&#123;&#123;variable&#125;&#125;</span> to add variables to your prompt
                            </p>
                        </Field>
                    </div>

                    {/* Form footer */}
                    <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-2 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                        <span className="plasmo-text-[11px] plasmo-text-[var(--dim)]"></span>
                        <div className="plasmo-flex plasmo-gap-2">
                            <button onClick={onClose} className="plasmo-h-9 plasmo-px-4  plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                                Cancel
                            </button>
                            <button onClick={handleSave} className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-9 plasmo-px-4  plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]">
                                <Icons.check /> Save
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
