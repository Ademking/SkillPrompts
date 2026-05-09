import { useEffect, useMemo, useRef, useState } from "react"
import { Storage } from "@plasmohq/storage"
import "./style.css";
import Logo from "~components/Logo";

interface Prompt {
    id: string
    label: string
    description: string
    template: string
}

const PROMPTS_STORAGE_KEY = "skillprompts_prompts"
const THEME_STORAGE_KEY = "skillprompts_theme"
const emptyForm = { id: "", label: "", description: "", template: "" }

const isValidSlug = (slug: string): boolean => /^[a-z0-9_-]+$/.test(slug)

/* ── Icons ── */
const Icons = {
    copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
    check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
    plus: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    x: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    sun: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    moon: () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    search: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
}

/* ── Toast ── */
function Toast({ message, visible }: { message: string; visible: boolean }) {
    return (
        <div
            className={`plasmo-fixed plasmo-bottom-6 plasmo-left-1/2 plasmo--translate-x-1/2 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2.5 -xl plasmo-bg-[var(--card)] plasmo-border plasmo-border-[var(--border)] plasmo-shadow-[0_8px_32px_var(--shadow)] plasmo-text-[13px] plasmo-font-medium plasmo-text-[var(--text)] plasmo-transition-all plasmo-duration-300 ${visible ? "plasmo-opacity-100 plasmo-translate-y-0" : "plasmo-opacity-0 plasmo-translate-y-3 plasmo-pointer-events-none"
                }`}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="plasmo-text-emerald-500"><polyline points="20 6 9 17 4 12" /></svg>
            {message}
        </div>
    )
}

/* ── Prompt Card ── */
function PromptCard({
    prompt, onCopy, onEdit, onDelete, copiedId,
}: {
    prompt: Prompt; onCopy: (p: Prompt) => void; onEdit: (p: Prompt) => void; onDelete: (id: string) => void; copiedId: string | null
}) {
    const isCopied = copiedId === prompt.id
    return (
        <div className="plasmo-group plasmo-relative plasmo-flex plasmo-flex-col  plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--card)] plasmo-overflow-hidden plasmo-transition-all plasmo-duration-200 hover:plasmo-border-[var(--border-hover)] hover:plasmo-shadow-[0_8px_32px_var(--shadow)] hover:plasmo--translate-y-0.5">
            {/* Card header */}
            <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-3 plasmo-px-5 plasmo-pt-5 plasmo-pb-3">
                <div className="plasmo-min-w-0 plasmo-flex-1">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                        <span className="plasmo-text-[15px] plasmo-font-semibold plasmo-text-[var(--accent)] plasmo-bg-[var(--accent-bg)] plasmo-px-1.5 plasmo-py-0.5 ">/{prompt.label}</span>

                    </div>
                    {prompt.description && (
                        <p className="plasmo-mt-1 plasmo-text-[12px] plasmo-text-[var(--muted)] plasmo-line-clamp-1">{prompt.description}</p>
                    )}
                </div>
                <div className="plasmo-flex plasmo-shrink-0 plasmo-items-center plasmo-gap-0.5 plasmo-opacity-0 group-hover:plasmo-opacity-100 plasmo-transition-opacity plasmo-duration-200">
                    <button onClick={() => onEdit(prompt)} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center  plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]" aria-label="Edit">
                        <Icons.edit />
                    </button>
                    <button onClick={() => { if (window.confirm(`Delete "${prompt.label}"?`)) onDelete(prompt.id) }} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center  plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-red-500/10 hover:plasmo-text-red-500" aria-label="Delete">
                        <Icons.trash />
                    </button>
                </div>
            </div>

            {/* Template preview */}
            <div className="plasmo-mx-5 plasmo-mb-3">
                <pre className="plasmo-px-3 plasmo-py-3  plasmo-bg-[var(--code-bg)] plasmo-font-mono plasmo-text-[11px] plasmo-leading-relaxed plasmo-text-[var(--muted)] plasmo-overflow-hidden plasmo-border plasmo-border-[var(--border)]" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                    {prompt.template}
                </pre>
            </div>

            {/* Copy button */}
            <div className="plasmo-px-5 plasmo-pb-5 plasmo-mt-auto">
                <button
                    onClick={() => onCopy(prompt)}
                    className={`plasmo-flex plasmo-h-9 plasmo-w-full plasmo-items-center plasmo-justify-center plasmo-gap-1.5  plasmo-text-xs plasmo-font-medium plasmo-transition-all plasmo-duration-200 ${isCopied
                        ? "plasmo-bg-emerald-500/10 plasmo-text-emerald-500 plasmo-border plasmo-border-emerald-500/20"
                        : "plasmo-bg-[var(--hover)] plasmo-text-[var(--muted)] plasmo-border plasmo-border-[var(--border)] hover:plasmo-border-[var(--border-hover)] hover:plasmo-text-[var(--text)] hover:plasmo-bg-[var(--card)]"
                        }`}
                >
                    {isCopied ? <><Icons.check /> Copied</> : <><Icons.copy /> Copy Prompt</>}
                </button>
            </div>
        </div>
    )
}

/* ── Form Field ── */
function Field({ label, error, errorMessage, children }: { label: string; error?: boolean; errorMessage?: string; children: React.ReactNode }) {
    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5">
            <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-widest">{label}</label>
            {children}
            {error && <p className="plasmo-text-[10.5px] plasmo-text-red-400">{errorMessage || "Required"}</p>}
        </div>
    )
}

/* ── Main ── */
function OptionsIndex() {
    const storage = useMemo(() => new Storage({ area: "local" }), [])
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [isDark, setIsDark] = useState(true)
    const [hasLoadedStorage, setHasLoadedStorage] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [toastVisible, setToastVisible] = useState(false)
    const [formData, setFormData] = useState(emptyForm)
    const [formErrors, setFormErrors] = useState({ label: false, labelInvalid: false, labelDuplicate: false, template: false })
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const labelRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        let cancelled = false

        const load = async () => {
            try {
                const savedPrompts = await storage.get<Prompt[]>(PROMPTS_STORAGE_KEY)
                let nextPrompts = Array.isArray(savedPrompts) ? savedPrompts : []

                if (nextPrompts.length === 0) {
                    const legacyPrompts = window.localStorage.getItem(PROMPTS_STORAGE_KEY)
                    if (legacyPrompts) {
                        try {
                            nextPrompts = JSON.parse(legacyPrompts)
                            await storage.set(PROMPTS_STORAGE_KEY, nextPrompts)
                        } catch {
                            nextPrompts = []
                        }
                    }
                }

                const savedTheme = await storage.get<"light" | "dark">(THEME_STORAGE_KEY)
                const legacyTheme = window.localStorage.getItem(THEME_STORAGE_KEY)

                if (!cancelled) {
                    setPrompts(nextPrompts)
                    const storedPreference = savedTheme ?? legacyTheme
                    setIsDark(storedPreference ? storedPreference === "dark" : true)
                    setHasLoadedStorage(true)
                }
            } catch (err) {
                if (!cancelled) {
                    setPrompts([])
                    setIsDark(true)
                    setHasLoadedStorage(true)
                }
            }
        }

        load()

        storage.watch({
            [PROMPTS_STORAGE_KEY]: (change: { newValue?: Prompt[] }) => {
                setPrompts(Array.isArray(change.newValue) ? change.newValue : [])
            },
            [THEME_STORAGE_KEY]: (change: { newValue?: "light" | "dark" }) => {
                setIsDark(change.newValue !== "light")
            }
        })

        return () => {
            cancelled = true
        }
    }, [storage])

    useEffect(() => {
        if (!hasLoadedStorage) return
        try {
            storage.set(PROMPTS_STORAGE_KEY, prompts)
        } catch (err) {
            // ignore
        }
    }, [prompts, storage, hasLoadedStorage])

    const filteredPrompts = useMemo(() => {
        const q = searchTerm.toLowerCase().trim()
        const visiblePrompts = !q ? prompts : prompts.filter(p =>
            p.label.toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q) ||
            p.template.toLowerCase().includes(q)
        )
        return [...visiblePrompts].sort((a, b) => Number(b.id) - Number(a.id))
    }, [prompts, searchTerm])

    const showToast = (message: string) => {
        setToastVisible(true)
        if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current)
        toastTimeoutRef.current = setTimeout(() => setToastVisible(false), 1800)
    }

    const handleCopy = async (prompt: Prompt) => {
        await navigator.clipboard.writeText(prompt.template)
        setCopiedId(prompt.id)
        showToast(`Copied "${prompt.label}" template`)
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
        copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 1600)
    }

    const openForm = (prompt?: Prompt) => {
        setFormData(prompt ? { ...prompt } : emptyForm)
        setEditingId(prompt?.id ?? null)
        setFormErrors({ label: false, labelInvalid: false, labelDuplicate: false, template: false })
        setShowForm(true)
        setTimeout(() => labelRef.current?.focus(), 80)
    }

    const closeForm = () => { setShowForm(false); setEditingId(null); setFormData(emptyForm) }

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
        if (editingId) {
            setPrompts(p => p.map(x => x.id === editingId ? { ...x, ...formData } : x))
        } else {
            setPrompts(p => [...p, { ...formData, id: String(Date.now()) }])
        }
        closeForm()
    }

    const handleDelete = (id: string) => setPrompts(p => p.filter(x => x.id !== id))

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") closeForm()
        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave()
    }

    /* ── Modal backdrop click ── */
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            closeForm()
        }
    }

    /* ── CSS vars ── */
    const theme = isDark ? {
        "--bg": "#0a0a0c",
        "--card": "#121214",
        "--border": "rgba(255,255,255,0.06)",
        "--border-hover": "rgba(255,255,255,0.12)",
        "--hover": "rgba(255,255,255,0.04)",
        "--text": "rgba(255,255,255,0.9)",
        "--muted": "rgba(255,255,255,0.38)",
        "--dim": "rgba(255,255,255,0.18)",
        "--code-bg": "rgba(0,0,0,0.35)",
        "--shadow": "rgba(0,0,0,0.5)",
        "--input-bg": "rgba(255,255,255,0.03)",
        "--scroll-track": "rgba(255,255,255,0.04)",
        "--scroll-thumb": "rgba(255,255,255,0.14)",
        "--accent": "#148EFF",
        "--accent-bg": "rgba(20,142,255,0.12)",
        "--accent-border": "rgba(20,142,255,0.3)",
    } : {
        "--bg": "#f5f5f7",
        "--card": "#ffffff",
        "--border": "rgba(0,0,0,0.07)",
        "--border-hover": "rgba(0,0,0,0.14)",
        "--hover": "rgba(0,0,0,0.03)",
        "--text": "#0f1117",
        "--muted": "rgba(15,17,23,0.45)",
        "--dim": "rgba(15,17,23,0.25)",
        "--code-bg": "rgba(0,0,0,0.03)",
        "--shadow": "rgba(0,0,0,0.06)",
        "--input-bg": "#ffffff",
        "--scroll-track": "rgba(15,17,23,0.05)",
        "--scroll-thumb": "rgba(15,17,23,0.15)",
        "--accent": "#148EFF",
        "--accent-bg": "rgba(20,142,255,0.08)",
        "--accent-border": "rgba(20,142,255,0.25)",
    }

    const inputCls = `plasmo-w-full plasmo-px-3.5 plasmo-py-2.5  plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none plasmo-transition-all plasmo-duration-150 focus:plasmo-border-[var(--accent)] focus:plasmo-ring-2 focus:plasmo-ring-[var(--accent-bg)] placeholder:plasmo-text-[var(--dim)]`

    return (
        <div
            style={{ ...theme, background: "var(--bg)", color: "var(--text)", minHeight: "100vh" } as React.CSSProperties}
            onKeyDown={handleKeyDown}
        >
            <style>{`
                * {
                    scrollbar-width: thin;
                    scrollbar-color: var(--scroll-thumb) var(--scroll-track);
                    font-family: ui-monospace, "Roboto Mono", "Source Code Pro", source-code-pro,
    "SF Mono", "IBM Plex Mono", Inconsolata, Menlo, Consolas, "Droid Sans Mono",
    "DMCA Sans Serif", "Hack", "DejaVu Sans Mono", "Bitstream Vera Sans Mono",
    monospace;
                }

                *::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }

                *::-webkit-scrollbar-track {
                    background: var(--scroll-track);
                }

                *::-webkit-scrollbar-thumb {
                    background-color: var(--scroll-thumb);
                    border: 2px solid var(--scroll-track);
                    border-radius: 999px;
                }

                *::-webkit-scrollbar-thumb:hover {
                    background-color: var(--border-hover);
                }

                @keyframes modal-fade-in {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }

                @keyframes overlay-fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                .modal-overlay { animation: overlay-fade-in 0.15s ease-out; }
                .modal-content { animation: modal-fade-in 0.2s ease-out; }
            `}</style>

            {/* ── Toast ── */}
            <Toast message="Copied to clipboard" visible={toastVisible} />

            {/* ── Form Modal ── */}
            {showForm && (
                <div
                    className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(12px)" }}
                    onClick={handleBackdropClick}
                >
                    <div
                        ref={modalRef}
                        className="plasmo-w-full plasmo-max-w-2xl modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className=" plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                            {/* Form header */}
                            <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-4 plasmo-border-b plasmo-border-[var(--border)]">
                                <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                                    <div className="plasmo-w-2 plasmo-h-2  plasmo-bg-[var(--accent)]" />
                                    <span className="plasmo-text-[14px] plasmo-font-semibold plasmo-text-[var(--text)]">
                                        {editingId ? "Edit command" : "New command"}
                                    </span>
                                </div>
                                <button onClick={closeForm} className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
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
                                    <textarea
                                        className={`${inputCls} plasmo-font-mono plasmo-text-[12px] plasmo-resize-y plasmo-min-h-[120px] plasmo-leading-relaxed plasmo-py-3 ${formErrors.template ? "plasmo-border-red-500/50 plasmo-ring-2 plasmo-ring-red-500/10" : ""}`}
                                        placeholder="You are an expert at..."
                                        value={formData.template}
                                        onChange={e => { setFormData({ ...formData, template: e.target.value }); setFormErrors(x => ({ ...x, template: false })) }}
                                        rows={8}
                                    />
                                </Field>
                            </div>

                            {/* Form footer */}
                            <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-5 plasmo-py-4 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                                <span className="plasmo-text-[11px] plasmo-text-[var(--dim)]"><kbd className="plasmo-px-1 plasmo-py-1  plasmo-bg-[var(--code-bg)] plasmo-border plasmo-border-[var(--border)]">⌘↵</kbd> save · <kbd className="plasmo-px-1 plasmo-py-0.5  plasmo-bg-[var(--code-bg)] plasmo-border plasmo-border-[var(--border)]">Esc</kbd> cancel</span>
                                <div className="plasmo-flex plasmo-gap-2">
                                    <button onClick={closeForm} className="plasmo-h-9 plasmo-px-4 -xl plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                                        Cancel
                                    </button>
                                    <button onClick={handleSave} className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-9 plasmo-px-4 -xl plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]">
                                        <Icons.check /> Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="plasmo-max-w-7xl plasmo-mx-auto plasmo-px-6 plasmo-py-8 plasmo-flex plasmo-flex-col plasmo-gap-6">

                {/* ── Header ── */}
                <header className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-4">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3.5">
                        <Logo width={42} height={42} color={isDark ? "var(--accent)" : "#148EFF"} />
                        <div className="plasmo-flex plasmo-flex-col plasmo-items-start plasmo-leading-tight">
                            <span className="plasmo-text-[22px] plasmo-font-semibold plasmo-tracking-tight" style={{ color: isDark ? "#FFFFFF" : "#0F1117" }}>
                                SkillPrompts
                            </span>
                            <span className="plasmo-text-[11px] plasmo-text-[var(--muted)]">v1.0</span>
                        </div>
                    </div>

                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                        <button
                            onClick={() => { const next = !isDark; setIsDark(next); storage.set(THEME_STORAGE_KEY, next ? "dark" : "light") }}
                            className="plasmo-flex plasmo-h-9 plasmo-w-9 plasmo-items-center plasmo-justify-center -xl plasmo-border plasmo-border-[var(--border)] plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Icons.sun /> : <Icons.moon />}
                        </button>
                        <button
                            onClick={() => openForm()}
                            className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4 -xl plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[13px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            <Icons.plus /> Add Command
                        </button>
                    </div>
                </header>

                {/* ── Search ── */}
                {prompts.length > 0 && (
                    <div className="plasmo-relative">
                        <div className="plasmo-absolute plasmo-left-4 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-[var(--dim)] plasmo-pointer-events-none">
                            <Icons.search />
                        </div>
                        <input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Search prompts..."
                            className={`${inputCls} plasmo-pl-10`}
                        />
                    </div>
                )}

                {/* ── Prompt grid ── */}
                <div className="plasmo-grid plasmo-grid-cols-[repeat(auto-fill,minmax(280px,1fr))] plasmo-gap-4">
                    {filteredPrompts.length === 0 ? (
                        <div className="plasmo-col-span-full plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-24 plasmo-gap-5">
                            <div className="plasmo-w-14 plasmo-h-14 -2xl plasmo-bg-[var(--hover)] plasmo-border plasmo-border-[var(--border)] plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-[var(--dim)]">
                                <Logo width={24} height={24} color="var(--dim)" />
                            </div>
                            <div className="plasmo-text-center">
                                <p className="plasmo-text-[14px] plasmo-font-medium plasmo-text-[var(--muted)]">
                                    {searchTerm ? `No results for "${searchTerm}"` : "No prompts yet"}
                                </p>
                                <p className="plasmo-text-[12.5px] plasmo-text-[var(--dim)] plasmo-mt-1">
                                    {searchTerm ? "Try a different search term" : "Click \"Add Command\" to create your first one"}
                                </p>
                            </div>
                            {!searchTerm && (
                                <button
                                    onClick={() => openForm()}
                                    className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4 -xl plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                                >
                                    <Icons.plus /> Add Command
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredPrompts.map(p => (
                            <PromptCard
                                key={p.id}
                                prompt={p}
                                onCopy={handleCopy}
                                onEdit={openForm}
                                onDelete={handleDelete}
                                copiedId={copiedId}
                            />
                        ))
                    )}
                </div>

            </div>
        </div>
    )
}

export default OptionsIndex
