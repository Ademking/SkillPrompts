import { useEffect, useMemo, useRef, useState } from "react"
import { Storage } from "@plasmohq/storage"
import "./style.css";
import Logo from "~components/Logo";
import type { Prompt, LibraryPrompt } from "~types"
import { Toast } from "~components/Toast"
import { ViewPromptModal } from "~components/ViewPromptModal"
import { LibraryModal } from "~components/LibraryModal"
import { PromptCard } from "~components/PromptCard"
import { PromptRow } from "~components/PromptRow"
import { ViewToggle } from "~components/ViewToggle"
import { FormModal } from "~components/FormModal"
import { DeleteConfirmModal } from "~components/DeleteConfirmModal"
import { Icons } from "~components/Icons"

const PROMPTS_STORAGE_KEY = "skillprompts_prompts"
const THEME_STORAGE_KEY = "skillprompts_theme"
const VIEW_STORAGE_KEY = "skillprompts_view"
const ENABLED_STORAGE_KEY = "skillprompts_enabled"
const USAGE_STORAGE_KEY = "skillprompts_usage"

function OptionsIndex() {
    const storage = useMemo(() => new Storage({ area: "local" }), [])
    const [prompts, setPrompts] = useState<Prompt[]>([])
    const [usage, setUsage] = useState<Record<string, number>>({})
    const [isEnabled, setIsEnabled] = useState(true)
    const [isDark, setIsDark] = useState(true)
    const [hasLoadedStorage, setHasLoadedStorage] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [viewPrompt, setViewPrompt] = useState<Prompt | null>(null)
    const [pendingDelete, setPendingDelete] = useState<Prompt | null>(null)
    const [showLibrary, setShowLibrary] = useState(false)
    const [showAbout, setShowAbout] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const [toastVisible, setToastVisible] = useState(false)
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
    const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
                const savedView = await storage.get<"grid" | "list">(VIEW_STORAGE_KEY)
                const savedEnabled = await storage.get<boolean>(ENABLED_STORAGE_KEY)
                const savedUsage = await storage.get<Record<string, number>>(USAGE_STORAGE_KEY)

                if (!cancelled) {
                    setPrompts(nextPrompts)
                    setUsage(savedUsage || {})
                    const storedPreference = savedTheme ?? legacyTheme
                    setIsDark(storedPreference ? storedPreference === "dark" : true)
                    if (savedView) setViewMode(savedView)
                    if (savedEnabled !== undefined) setIsEnabled(savedEnabled)
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

        const unwatch = storage.watch({
            [PROMPTS_STORAGE_KEY]: (change: { newValue?: Prompt[] }) => {
                setPrompts(Array.isArray(change.newValue) ? change.newValue : [])
            },
            [THEME_STORAGE_KEY]: (change: { newValue?: "light" | "dark" }) => {
                setIsDark(change.newValue !== "light")
            },
            [USAGE_STORAGE_KEY]: (change: { newValue?: Record<string, number> }) => {
                setUsage(change.newValue || {})
            }
        })

        return () => {
            cancelled = true
            unwatch?.()
        }
    }, [storage])

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
        setEditingId(prompt?.id ?? null)
        setShowForm(true)
    }

    const closeForm = () => { setShowForm(false); setEditingId(null) }

    const handleSave = async (data: Prompt) => {
        let updated: Prompt[]
        if (editingId) {
            updated = prompts.map(x => x.id === editingId ? { ...x, ...data } : x)
        } else {
            updated = [...prompts, { ...data, id: String(Date.now()) }]
        }
        setPrompts(updated)
        await storage.set(PROMPTS_STORAGE_KEY, updated)
        closeForm()
    }

    const handleDelete = (id: string) => {
        const p = prompts.find(x => x.id === id)
        if (p) setPendingDelete(p)
    }

    const confirmDelete = async () => {
        if (!pendingDelete) return
        const updated = prompts.filter(x => x.id !== pendingDelete.id)
        setPrompts(updated)
        await storage.set(PROMPTS_STORAGE_KEY, updated)
        setPendingDelete(null)
    }

    const existingLabels = useMemo(() => new Set(prompts.map(p => p.label.toLowerCase())), [prompts])

    const handleImportFromLibrary = async (lib: LibraryPrompt) => {
        const newPrompt: Prompt = {
            id: String(Date.now()),
            label: lib.label,
            description: lib.description,
            template: lib.prompt,
        }
        const updated = [...prompts, newPrompt]
        setPrompts(updated)
        await storage.set(PROMPTS_STORAGE_KEY, updated)
        showToast(`Imported "${lib.label}"`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Escape") { closeForm(); setViewPrompt(null); setShowLibrary(false); setShowAbout(false) }
    }

    const toggleView = () => {
        const next = viewMode === "grid" ? "list" : "grid"
        setViewMode(next)
        storage.set(VIEW_STORAGE_KEY, next)
    }

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
        "--bg": "#f3f7ff",
        "--card": "#ffffff",
        "--border": "rgba(10, 80, 160, 0.18)",
        "--border-hover": "rgba(10, 80, 160, 0.35)",
        "--hover": "rgba(20, 142, 255, 0.10)",
        "--text": "#0a0f1a",
        "--muted": "rgba(10, 15, 26, 0.65)",
        "--dim": "rgba(10, 15, 26, 0.40)",
        "--code-bg": "rgba(20, 142, 255, 0.08)",
        "--shadow": "rgba(0, 40, 100, 0.12)",
        "--input-bg": "#ffffff",
        "--scroll-track": "rgba(10, 80, 160, 0.08)",
        "--scroll-thumb": "rgba(10, 80, 160, 0.35)",
        "--accent": "#0B78FF",
        "--accent-bg": "rgba(11, 120, 255, 0.14)",
        "--accent-border": "rgba(11, 120, 255, 0.40)",
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

            {/* ── View Modal ── */}
            <ViewPromptModal prompt={viewPrompt} onClose={() => setViewPrompt(null)} />

            {/* ── Library Modal ── */}
            {showLibrary && (
                <LibraryModal
                    onImport={handleImportFromLibrary}
                    onClose={() => setShowLibrary(false)}
                    existingLabels={existingLabels}
                />
            )}

            {/* ── Form Modal ── */}
            {showForm && (
                <FormModal
                    prompts={prompts}
                    editingId={editingId}
                    onSave={handleSave}
                    onClose={closeForm}
                />
            )}

            {/* ── Delete Confirm Modal ── */}
            {pendingDelete && (
                <DeleteConfirmModal
                    label={pendingDelete.label}
                    onConfirm={confirmDelete}
                    onClose={() => setPendingDelete(null)}
                />
            )}

            {/* ── About Modal ── */}
            {showAbout && (
                <div
                    className="plasmo-fixed plasmo-inset-0 plasmo-z-50 plasmo-flex plasmo-items-center plasmo-justify-center plasmo-p-4 modal-overlay"
                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
                    onClick={() => setShowAbout(false)}
                >
                    <div
                        className="plasmo-w-full plasmo-max-w-sm modal-content"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="plasmo-border plasmo-border-[var(--border-hover)] plasmo-bg-[var(--card)] plasmo-shadow-[0_24px_64px_var(--shadow)] plasmo-overflow-hidden">
                            <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-10 plasmo-px-6 plasmo-gap-4">
                                <Logo width={56} height={56} color={isDark ? "var(--accent)" : "#148EFF"} />
                                <div className="plasmo-text-center">
                                    <p className="plasmo-text-[18px] plasmo-font-semibold plasmo-text-[var(--text)]">SkillPrompts</p>
                                    <p className="plasmo-text-[12px] plasmo-text-[var(--muted)] plasmo-mt-0.5">v1.0</p>
                                </div>
                                <p className="plasmo-text-[12.5px] plasmo-text-[var(--muted)] plasmo-text-center plasmo-leading-relaxed">
                                    A Chrome extension to manage and use AI skill prompts for ChatGPT. Create, organize, and quickly insert prompts with variables.
                                </p>
                                <p className="plasmo-text-[12.5px] plasmo-text-[var(--muted)] plasmo-text-center plasmo-leading-relaxed">
                                    Don't forget to Give it a star on GitHub! <a href="https://github.com/Ademking/SkillPrompts" target="_blank" className="plasmo-text-[var(--accent)] hover:plasmo-underline">
                                        https://github.com/Ademking/SkillPrompts
                                    </a>
                                </p>
                                <p className="plasmo-text-[12.5px] plasmo-text-[var(--muted)] plasmo-text-center plasmo-leading-relaxed">
                                    Made with ❤️ by <a href="https://github.com/Ademking" target="_blank" className="plasmo-text-amber-400 hover:plasmo-underline">Adem Kouki</a> for everyone who loves using AI prompts.
                                </p>
                            </div>
                            <div className="plasmo-flex plasmo-items-center plasmo-justify-center plasmo-px-6 plasmo-py-3 plasmo-border-t plasmo-border-[var(--border)] plasmo-bg-[var(--hover)]">
                                <button
                                    onClick={() => setShowAbout(false)}
                                    className="plasmo-h-9 plasmo-px-6 plasmo-border plasmo-border-[var(--border)] plasmo-text-[12px] plasmo-font-medium plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            <div className="plasmo-mx-auto plasmo-px-6 plasmo-py-4 plasmo-flex plasmo-flex-col plasmo-gap-6">

                {/* ── Header ── */}
                <header className="plasmo-flex plasmo-items-center plasmo-justify-between plasmo-gap-4">
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3.5">
                        <Logo width={42} height={42} color={isDark ? "var(--accent)" : "#148EFF"} />
                        <div className="plasmo-flex plasmo-flex-col plasmo-items-start plasmo-leading-tight">
                            <span className="plasmo-text-[20px] plasmo-tracking-tighter" style={{ color: isDark ? "#FFFFFF" : "#0F1117" }}>
                                SkillPrompts
                            </span>
                            <span className="plasmo-text-[11px] plasmo-text-[var(--muted)]">v1.0</span>
                        </div>
                    </div>

                    <div className="plasmo-flex plasmo-items-center plasmo-gap-2">

                        <button
                            onClick={() => openForm()}
                            className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4  plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[13px] plasmo-font-light plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            <Icons.plus /> Create New Skill
                        </button>
                        <button
                            onClick={() => setShowLibrary(true)}
                            className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[13px] plasmo-font-light plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            <Icons.folder /> Explore Skills
                        </button>
                        <button
                            onClick={() => setShowAbout(true)}
                            className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[13px] plasmo-font-light plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                        >
                            <Icons.info /> About
                        </button>

                        <button
                            onClick={() => { const next = !isDark; setIsDark(next); storage.set(THEME_STORAGE_KEY, next ? "dark" : "light") }}
                            className="plasmo-flex plasmo-h-9 plasmo-w-9 plasmo-items-center plasmo-justify-center  plasmo-border plasmo-border-[var(--border)] plasmo-text-[var(--muted)] plasmo-transition-colors hover:plasmo-bg-[var(--hover)] hover:plasmo-text-[var(--text)]"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Icons.sun /> : <Icons.moon />}
                        </button>
                        <button
                            onClick={() => {
                                const next = !isEnabled;
                                setIsEnabled(next);
                                storage.set(ENABLED_STORAGE_KEY, next);
                            }}
                            className={`plasmo-relative plasmo-flex plasmo-h-9 plasmo-w-[60px] plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-text-[11px] plasmo-font-bold plasmo-tracking-[0.15em] plasmo-uppercase plasmo-transition-all plasmo-duration-150 plasmo-select-none plasmo-outline-none plasmo-border
    ${isEnabled
                                    ? "plasmo-border-blue-500 plasmo-text-blue-500"
                                    : "plasmo-border-[var(--border)] plasmo-text-zinc-500"
                                }
    hover:plasmo-opacity-70 active:plasmo-translate-y-px`}
                            aria-label={`Toggle extension ${isEnabled ? "off" : "on"}`}
                        >
                            <span
                                className={`plasmo-w-1 plasmo-h-1 plasmo-rounded-full plasmo-transition-all plasmo-duration-150
      ${isEnabled ? "plasmo-bg-blue-500" : "plasmo-bg-zinc-600"}`}
                            />
                            {isEnabled ? "ON" : "OFF"}
                        </button>

                    </div>
                </header>


                {/* ── Search ── */}
                {prompts.length > 0 && (
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-w-full">
                        <ViewToggle viewMode={viewMode} onToggle={toggleView} />

                        <div className="plasmo-relative plasmo-flex-1">
                            <div className="plasmo-absolute plasmo-left-4 plasmo-top-1/2 plasmo--translate-y-1/2 plasmo-text-[var(--dim)] plasmo-pointer-events-none">
                                <Icons.search />
                            </div>

                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="Search prompts..."
                                className={`${inputCls} plasmo-w-full plasmo-pl-10`}
                            />
                        </div>
                    </div>
                )}

                {/* ── Content ── */}
                {filteredPrompts.length === 0 ? (
                    <div className="plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-py-24 plasmo-gap-5">
                        <div className="plasmo-w-14 plasmo-h-14  plasmo-flex plasmo-items-center plasmo-justify-center plasmo-text-[var(--dim)]">
                            {/* <Logo width={24} height={24} color="currentColor" /> */}
                            <Icons.inbox />
                        </div>
                        <div className="plasmo-text-center">
                            <p className="plasmo-text-[14px] plasmo-font-medium plasmo-text-[var(--muted)]">
                                {searchTerm ? `No results for "${searchTerm}"` : "No skills yet"}
                            </p>
                            <p className="plasmo-text-[12.5px] plasmo-text-[var(--dim)] plasmo-mt-1">
                                {searchTerm ? "Try a different search term" : 'Build a custom skill from scratch or browse our ready-to-use library'}
                            </p>
                        </div>
                        {!searchTerm && (
                            <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                                <button
                                    onClick={() => openForm()}
                                    className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4  plasmo-bg-[var(--accent)] plasmo-text-white plasmo-text-[12px] plasmo-font-semibold plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                                >
                                    <Icons.plus /> Create New Skill
                                </button>
                                <button
                                    onClick={() => setShowLibrary(true)}
                                    className="plasmo-inline-flex plasmo-items-center plasmo-gap-2 plasmo-h-9 plasmo-px-4 plasmo-border plasmo-border-[var(--border)] plasmo-text-[13px] plasmo-font-light plasmo-transition-all hover:plasmo-opacity-90 active:plasmo-scale-[0.97]"
                                >
                                    <Icons.folder /> Explore Skills
                                </button>
                            </div>
                        )}
                    </div>
                ) : viewMode === "grid" ? (
                    <div className="plasmo-grid plasmo-grid-cols-[repeat(auto-fill,minmax(280px,1fr))] plasmo-gap-4">
                        {filteredPrompts.map(p => (
                            <PromptCard
                                key={p.id}
                                prompt={p}
                                onCopy={handleCopy}
                                onEdit={openForm}
                                onDelete={handleDelete}
                                onView={setViewPrompt}
                                copiedId={copiedId}
                                usage={usage[p.label]}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="plasmo-flex plasmo-flex-col plasmo-border plasmo-border-[var(--border)] divide-y divide-[var(--border)] plasmo-bg-[var(--card)]">
                        {filteredPrompts.map((p, index) => (
                            <React.Fragment key={p.id}>
                                <PromptRow
                                    prompt={p}
                                    onCopy={handleCopy}
                                    onEdit={openForm}
                                    onDelete={handleDelete}
                                    onView={setViewPrompt}
                                    copiedId={copiedId}
                                    usage={usage[p.label]}
                                />
                                {
                                    index !== filteredPrompts.length - 1 && <hr className="plasmo-border-t plasmo-border-[var(--border)] plasmo-m-0" />
                                }
                            </React.Fragment>
                        ))}
                    </div>
                )}

            </div>
        </div >
    )
}

export default OptionsIndex
