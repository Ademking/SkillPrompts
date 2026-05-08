import { useEffect, useMemo, useRef, useState } from "react"
import { Storage } from "@plasmohq/storage"
import "./style.css";

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
const Icon = ({ d, size = 16 }: { d: string; size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d={d} />
    </svg>
)

const Icons = {
    copy: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>,
    check: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
    edit: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
    trash: () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>,
    plus: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
    x: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
    sun: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>,
    moon: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>,
    search: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
}

/* ── Prompt Card ── */
function PromptCard({
    prompt, onCopy, onEdit, onDelete, copiedId,
}: {
    prompt: Prompt; onCopy: (p: Prompt) => void; onEdit: (p: Prompt) => void; onDelete: (id: string) => void; copiedId: string | null
}) {
    const isCopied = copiedId === prompt.id
    return (
        <div className="plasmo-relative plasmo-flex plasmo-flex-col plasmo-rounded-xl plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--card)] plasmo-overflow-hidden plasmo-transition-all plasmo-duration-200 hover:plasmo-border-[var(--border-hover)] hover:plasmo-shadow-[0_4px_24px_var(--shadow)]">
            {/* Card header */}
            <div className="plasmo-flex plasmo-items-start plasmo-justify-between plasmo-gap-3 plasmo-px-4 plasmo-pt-4 plasmo-pb-3">
                <div className="plasmo-min-w-0 plasmo-flex-1">
                    <p className="plasmo-text-[13.5px] plasmo-font-semibold plasmo-font-mono plasmo-text-[var(--text)] plasmo-truncate plasmo-tracking-tight">/{prompt.label}</p>
                    {prompt.description && (
                        <p className="plasmo-mt-0.5 plasmo-text-[11.5px] plasmo-text-[var(--muted)] plasmo-truncate">{prompt.description}</p>
                    )}
                </div>
                {/* Action buttons — always visible */}
                <div className="plasmo-flex plasmo-shrink-0 plasmo-items-center plasmo-gap-0.5">
                    <button onClick={() => onEdit(prompt)} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-rounded-lg plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]" aria-label="Edit">
                        <Icons.edit />
                    </button>
                    <button onClick={() => { if (window.confirm(`Delete "${prompt.label}"?`)) onDelete(prompt.id) }} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-rounded-lg plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-red-500/10 hover:plasmo-text-red-500" aria-label="Delete">
                        <Icons.trash />
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="plasmo-h-px plasmo-bg-[var(--border)] plasmo-mx-4" />

            {/* Template preview */}
            <pre className="plasmo-flex-1 plasmo-mx-4 plasmo-my-3 plasmo-px-3 plasmo-py-2.5 plasmo-rounded-lg plasmo-bg-[var(--code-bg)] plasmo-font-mono plasmo-text-[10.5px] plasmo-leading-relaxed plasmo-text-[var(--muted)] plasmo-overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 4, WebkitBoxOrient: "vertical", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {prompt.template}
            </pre>

            {/* Copy button */}
            <div className="plasmo-px-4 plasmo-pb-4">
                <button
                    onClick={() => onCopy(prompt)}
                    className={`plasmo-flex plasmo-h-8 plasmo-w-full plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-rounded-lg plasmo-text-xs plasmo-font-medium plasmo-transition-all plasmo-duration-200 ${isCopied
                        ? "plasmo-bg-emerald-500/10 plasmo-text-emerald-500 plasmo-border plasmo-border-emerald-500/20"
                        : "plasmo-bg-[var(--hover)] plasmo-text-[var(--muted)] plasmo-border plasmo-border-[var(--border)] hover:plasmo-border-[var(--border-hover)] hover:plasmo-text-[var(--text)]"
                        }`}
                >
                    {isCopied ? <><Icons.check /> Copied</> : <><Icons.copy /> Copy template</>}
                </button>
            </div>
        </div>
    )
}

/* ── Form Field ── */
function Field({ label, error, errorMessage, children }: { label: string; error?: boolean; errorMessage?: string; children: React.ReactNode }) {
    return (
        <div className="plasmo-flex plasmo-flex-col plasmo-gap-1.5">
            <label className="plasmo-text-[11px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-uppercase plasmo-tracking-wider">{label}</label>
            {children}
            {error && <p className="plasmo-text-[10.5px] plasmo-text-red-500">{errorMessage || "Required"}</p>}
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
    const [formData, setFormData] = useState(emptyForm)
    const [formErrors, setFormErrors] = useState({ label: false, labelInvalid: false, labelDuplicate: false, template: false })
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const labelRef = useRef<HTMLInputElement>(null)

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
                    setIsDark((savedTheme ?? legacyTheme) !== "light")
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

    const handleCopy = async (prompt: Prompt) => {
        await navigator.clipboard.writeText(prompt.template)
        setCopiedId(prompt.id)
        if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
        copiedTimeoutRef.current = setTimeout(() => setCopiedId(null), 1600)
    }

    const openForm = (prompt?: Prompt) => {
        setFormData(prompt ? { ...prompt } : emptyForm)
        setEditingId(prompt?.id ?? null)
        setFormErrors({ label: false, labelInvalid: false, labelDuplicate: false, template: false })
        setShowForm(true)
        setTimeout(() => labelRef.current?.focus(), 50)
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
            labelInvalid: labelInvalid,
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

    /* ── CSS vars ── */
    const theme = isDark ? {
        "--bg": "#0c0c0e",
        "--card": "#111114",
        "--border": "rgba(255,255,255,0.07)",
        "--border-hover": "rgba(255,255,255,0.14)",
        "--hover": "rgba(255,255,255,0.04)",
        "--text": "rgba(255,255,255,0.92)",
        "--muted": "rgba(255,255,255,0.42)",
        "--dim": "rgba(255,255,255,0.22)",
        "--code-bg": "rgba(0,0,0,0.3)",
        "--shadow": "rgba(0,0,0,0.3)",
        "--input-bg": "rgba(255,255,255,0.03)",
        "--scroll-track": "rgba(255,255,255,0.04)",
        "--scroll-thumb": "rgba(255,255,255,0.16)",
        "--accent": "#22c55e",
        "--accent-bg": "rgba(34,197,94,0.12)",
        "--accent-border": "rgba(34,197,94,0.25)",
    } : {
        "--bg": "#f7f8f7",
        "--card": "#ffffff",
        "--border": "rgba(0,0,0,0.08)",
        "--border-hover": "rgba(0,0,0,0.16)",
        "--hover": "rgba(0,0,0,0.04)",
        "--text": "#0f1117",
        "--muted": "rgba(15,17,23,0.5)",
        "--dim": "rgba(15,17,23,0.3)",
        "--code-bg": "rgba(0,0,0,0.04)",
        "--shadow": "rgba(0,0,0,0.08)",
        "--input-bg": "#ffffff",
        "--scroll-track": "rgba(15,17,23,0.06)",
        "--scroll-thumb": "rgba(15,17,23,0.18)",
        "--accent": "#16a34a",
        "--accent-bg": "rgba(22,163,74,0.1)",
        "--accent-border": "rgba(22,163,74,0.25)",
    }

    const inputCls = `plasmo-w-full plasmo-px-3 plasmo-py-2 plasmo-rounded-lg plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--input-bg)] plasmo-text-[13px] plasmo-text-[var(--text)] plasmo-outline-none plasmo-transition-all plasmo-duration-150 focus:plasmo-border-[var(--accent)] focus:plasmo-ring-2 focus:plasmo-ring-[var(--accent-bg)] placeholder:plasmo-text-[var(--dim)]`

    return (
        <div
            style={{ ...theme, background: "var(--bg)", color: "var(--text)", minHeight: "100vh" } as React.CSSProperties}
            onKeyDown={handleKeyDown}
        >
            <style>{`
                * {
                    scrollbar-width: thin;
                    scrollbar-color: var(--scroll-thumb) var(--scroll-track);
                }

                *::-webkit-scrollbar {
                    width: 10px;
                    height: 10px;
                }

                *::-webkit-scrollbar-track {
                    background: var(--scroll-track);
                }

                *::-webkit-scrollbar-thumb {
                    background-color: var(--scroll-thumb);
                    border: 3px solid var(--scroll-track);
                    border-radius: 999px;
                }

                *::-webkit-scrollbar-thumb:hover {
                    background-color: var(--border-hover);
                }
            `}</style>
            <div className="plasmo-max-w-7xl plasmo-mx-auto plasmo-px-5 plasmo-py-6 plasmo-flex plasmo-flex-col plasmo-gap-5">

                {/* ── Header ── */}
                <header className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-4">
                    <div>
                        <div className="plasmo-flex plasmo-items-center plasmo-gap-2.5">
                            {/* Logo mark */}
                            <div className="plasmo-w-7 plasmo-h-7 plasmo-rounded-lg plasmo-bg-[var(--accent)] plasmo-flex plasmo-items-center plasmo-justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
                            </div>
                            <span className="plasmo-text-[15px] plasmo-font-bold plasmo-tracking-tight plasmo-text-[var(--text)]">SkillPrompts</span>
                            <span className="plasmo-text-[11px] plasmo-font-medium plasmo-rounded-full plasmo-border plasmo-border-[var(--border)] plasmo-bg-[var(--hover)] plasmo-px-2 plasmo-py-0.5 plasmo-text-[var(--muted)]">
                                {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? "s" : ""}
                            </span>
                        </div>
                        <p className="plasmo-text-[12px] plasmo-text-[var(--muted)] plasmo-mt-1 plasmo-pl-[37px]">Manage your skill prompts</p>
                    </div>

                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                        <button
                            onClick={() => { const next = !isDark; setIsDark(next); storage.set(THEME_STORAGE_KEY, next ? "dark" : "light") }}
                            className="plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-rounded-lg plasmo-border plasmo-border-[var(--border)] plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Icons.sun /> : <Icons.moon />}
                        </button>
                        <button
                            onClick={() => openForm()}
                            className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-8 plasmo-px-3.5 plasmo-rounded-lg plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12.5px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            <Icons.plus /> New prompt
                        </button>
                    </div>
                </header>

                {/* ── Search ── */}
                <div className="plasmo-relative">
                    <div className="plasmo-absolute plasmo-left-3 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-[var(--dim)] plasmo-pointer-events-none">
                        <Icons.search />
                    </div>
                    <input
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Search prompts…"
                        className={`${inputCls} plasmo-pl-9`}
                    />
                </div>

                {/* ── Form modal ── */}
                {showForm && (
                    <div className="plasmo-rounded-xl plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_8px_32px_var(--shadow)] plasmo-overflow-hidden">
                        {/* Form header */}
                        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-4 plasmo-py-3 plasmo-border-b plasmo-border-[var(--border)]">
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-2">
                                <div className="plasmo-w-1.5 plasmo-h-1.5 plasmo-rounded-full plasmo-bg-[var(--accent)]" />
                                <span className="plasmo-text-[13px] plasmo-font-semibold plasmo-text-[var(--text)]">
                                    {editingId ? "Edit prompt" : "New prompt"}
                                </span>
                            </div>
                            <button onClick={closeForm} className="plasmo-flex plasmo-h-7 plasmo-w-7 plasmo-items-center plasmo-justify-center plasmo-rounded-lg plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                                <Icons.x />
                            </button>
                        </div>

                        {/* Form body */}
                        <div className="plasmo-p-4 plasmo-flex plasmo-flex-col plasmo-gap-4">
                            <div className="plasmo-grid plasmo-grid-cols-2 plasmo-gap-3">
                                <Field label="Command" error={formErrors.label || formErrors.labelInvalid || formErrors.labelDuplicate} errorMessage={formErrors.label ? "Required" : formErrors.labelDuplicate ? "Command already exists" : "Only a-z, 0-9, - and _"}>
                                    <input
                                        ref={labelRef}
                                        className={`${inputCls} ${formErrors.label || formErrors.labelInvalid || formErrors.labelDuplicate ? "plasmo-border-red-500 plasmo-ring-2 plasmo-ring-red-500/10" : ""}`}
                                        placeholder="e.g. code-review"
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
                                </Field>
                                <Field label="Description">
                                    <input
                                        className={inputCls}
                                        placeholder="Short description"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </Field>
                            </div>
                            <Field label="Template" error={formErrors.template}>
                                <textarea
                                    className={`${inputCls} plasmo-font-mono plasmo-text-[12px] plasmo-resize-y plasmo-min-h-[100px] plasmo-leading-relaxed ${formErrors.template ? "plasmo-border-red-500 plasmo-ring-2 plasmo-ring-red-500/10" : ""}`}
                                    placeholder="Write your prompt template."
                                    value={formData.template}
                                    onChange={e => { setFormData({ ...formData, template: e.target.value }); setFormErrors(x => ({ ...x, template: false })) }}
                                />
                            </Field>
                        </div>

                        {/* Form footer */}
                        <div className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-px-4 plasmo-py-3 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                            <span className="plasmo-text-[11px] plasmo-text-[var(--dim)]">⌘↵ save · Esc cancel</span>
                            <div className="plasmo-flex plasmo-gap-2">
                                <button onClick={closeForm} className="plasmo-h-8 plasmo-px-3 plasmo-rounded-lg plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]">
                                    Cancel
                                </button>
                                <button onClick={handleSave} className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-8 plasmo-px-3.5 plasmo-rounded-lg plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]">
                                    <Icons.check /> Save
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Prompt grid ── */}
                <div className="plasmo-grid plasmo-grid-cols-[repeat(auto-fill,minmax(260px,1fr))] plasmo-gap-3">
                    {filteredPrompts.length === 0 ? (
                        <div className="plasmo-col-span-full plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-20 plasmo-gap-3">
                            <div className="plasmo-w-10 plasmo-h-10 plasmo-rounded-xl plasmo-bg-[var(--hover)] plasmo-border plasmo-border-[var(--border)] plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-[var(--dim)]">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
                            </div>
                            <div className="plasmo-text-center">
                                <p className="plasmo-text-[13px] plasmo-font-medium plasmo-text-[var(--muted)]">
                                    {searchTerm ? `No results for "${searchTerm}"` : "No prompts yet"}
                                </p>
                                <p className="plasmo-text-[12px] plasmo-text-[var(--dim)] plasmo-mt-0.5">
                                    {searchTerm ? "Try a different search term" : "Create your first prompt to get started"}
                                </p>
                            </div>
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