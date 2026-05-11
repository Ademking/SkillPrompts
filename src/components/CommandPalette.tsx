import { useEffect, useMemo, useRef, useState } from "react"
import type { FC } from "react"
import Logo from "./Logo"
import { Icons } from "./Icons"

interface Command {
    id: string
    label: string
    description: string
    template: string
}

function extractVarCount(template: string): number {
    const matches = template.match(/\{\{\s*\w+\s*\}\}/g)
    if (!matches) return 0
    const names = matches.map(m => m.replace(/\{\{\s*/, '').replace(/\s*\}\}/, ''))
    return new Set(names).size
}

const COMMANDS: Command[] = []

interface Props {
    position: { x: number; y: number }
    searchValue: string
    onSearchChange: (v: string) => void
    onCommandSelect: (c: string) => void
    onClose: () => void
    theme?: "light" | "dark"
    centered?: boolean
    commands?: Command[]
}

const CommandPalette: FC<Props> = ({
    position, searchValue, onSearchChange, onCommandSelect, onClose,
    theme = "dark", centered = false, commands
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const selectedItemRef = useRef<HTMLButtonElement>(null)
    const isDark = theme === "dark"

    useEffect(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          inputRef.current?.focus()
        })
      })
    }, [])

    useEffect(() => {
      if (!navigator.userAgent.includes("Firefox")) return
      const input = inputRef.current
      if (input && document.activeElement !== input) {
        input.focus()
      }
    })
    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: "nearest" })
    }, [selectedIndex])

    const commandsList = commands ?? COMMANDS
    const normalized = commandsList.map(c => ({
        id: c?.id ?? String(c),
        label: c?.label ?? c?.id ?? String(c),
        description: c?.description ?? "",
        template: c?.template ?? ""
    }))

    const filtered = useMemo(() => {
        if (!searchValue) return normalized
        return normalized.filter(c =>
            `${c.label} ${c.description}`.toLowerCase().includes(searchValue.toLowerCase())
        )
    }, [searchValue, normalized])

    const selectCommand = (index: number) => {
        if (!filtered[index]) return
        onCommandSelect(`/${filtered[index].id}`)
        onClose()
    }

    const D = isDark

    const borderCls = D ? "plasmo-border-white/10" : "plasmo-border-black/5"
    const textMuted = D ? "plasmo-text-neutral-500" : "plasmo-text-neutral-400"
    const textMuted2 = D ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"
    const scrollVars = D
        ? { "--scroll-track": "rgba(255,255,255,0.04)", "--scroll-thumb": "rgba(255,255,255,0.16)" }
        : { "--scroll-track": "rgba(0,0,0,0.04)", "--scroll-thumb": "rgba(0,0,0,0.12)" }

    return (
        <div
            className={centered ? "plasmo-w-fit" : "plasmo-fixed plasmo-z-[999999] plasmo-animate-in plasmo-fade-in plasmo-zoom-in-95"}
            style={!centered ? { left: position.x, top: position.y } : {}}
        >
            <div className={`plasmo-w-[760px] plasmo-overflow-hidden plasmo-border plasmo-backdrop-blur-2xl plasmo-shadow-[0_24px_80px_rgba(0,0,0,0.45)] ${D ? "plasmo-border-white/10 plasmo-bg-neutral-950/96 plasmo-text-white" : "plasmo-border-black/10 plasmo-bg-white/95 plasmo-text-neutral-900"
                }`}>
                {/* HEADER */}
                <div className={`plasmo-flex plasmo-items-center plasmo-gap-3 plasmo-border-b plasmo-px-3 plasmo-py-2.5 ${borderCls}`}>
                    <div className={`plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-items-center plasmo-justify-center plasmo-border plasmo-text-xs plasmo-font-semibold ${D ? "plasmo-border-white/10 plasmo-bg-white/5 plasmo-text-neutral-300" : "plasmo-border-black/5 plasmo-bg-neutral-100 plasmo-text-neutral-600"
                        }`}>/</div>

                    <div className="plasmo-flex-1">
                        <input
                            ref={inputRef}
                            defaultValue={searchValue}
                            onChange={(e) => { onSearchChange(e.target.value); setSelectedIndex(0) }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(p => p + 1 >= filtered.length ? 0 : p + 1) }
                                else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIndex(p => p <= 0 ? filtered.length - 1 : p - 1) }
                                else if (e.key === "Enter") { e.preventDefault(); selectCommand(selectedIndex) }
                                else if (e.key === "Escape") { onClose() }
                            }}
                            placeholder="Search AI skills..."
                            className={`plasmo-w-full plasmo-bg-transparent plasmo-text-sm plasmo-font-medium plasmo-outline-none plasmo-placeholder:plasmo-font-normal ${D ? "plasmo-text-white placeholder:plasmo-text-neutral-500" : "plasmo-text-neutral-900 placeholder:plasmo-text-neutral-400"
                                }`}
                        />
                        <div className={`plasmo-mt-0.5 plasmo-text-xs ${textMuted}`}>
                            {filtered.length} skills available
                        </div>
                    </div>

                    <div className={`plasmo-hidden md:plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-text-xs ${textMuted}`}>
                        <kbd className={`plasmo-border plasmo-px-2 plasmo-py-1 ${D ? "plasmo-border-white/10 plasmo-bg-white/5" : "plasmo-border-black/10 plasmo-bg-neutral-100"
                            }`}>↑↓</kbd>
                        <kbd className={`plasmo-border plasmo-px-2 plasmo-py-1 ${D ? "plasmo-border-white/10 plasmo-bg-white/5" : "plasmo-border-black/10 plasmo-bg-neutral-100"
                            }`}>Enter</kbd>
                    </div>
                </div>

                {/* COMMAND LIST */}
                <style>{`
                    .command-palette-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
                    .command-palette-scroll::-webkit-scrollbar-track { background: var(--scroll-track); }
                    .command-palette-scroll::-webkit-scrollbar-thumb { background-color: var(--scroll-thumb); border: 3px solid var(--scroll-track); border-radius: 999px; }
                    .command-palette-scroll::-webkit-scrollbar-thumb:hover { background-color: ${D ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.24)"}; }
                    .command-palette-scroll { scrollbar-width: thin; scrollbar-color: var(--scroll-thumb) var(--scroll-track); }
                `}</style>
                <div className="plasmo-max-h-[360px] plasmo-overflow-y-auto plasmo-p-2 command-palette-scroll" style={scrollVars as React.CSSProperties}>
                    {filtered.length === 0 && (
                        <div className={`plasmo-flex plasmo-flex-col plasmo-items-center plasmo-justify-center plasmo-gap-1.5 plasmo-py-8 plasmo-text-center ${textMuted}`}>
                            <div className="plasmo-text-2xl">
                                {/* <Logo width={32} height={32} /> */}
                                <Icons.inbox />
                            </div>
                            <div className="plasmo-text-sm plasmo-font-medium">No skills found</div>
                            <button
                                onClick={() => {
                                    chrome.runtime.sendMessage({
                                        type: "OPEN_OPTIONS"
                                    })
                                }}
                                className="plasmo-inline-flex plasmo-items-center plasmo-gap-1.5 plasmo-h-8 plasmo-px-3 plasmo-text-xs plasmo-font-medium plasmo-text-[var(--text)] plasmo-bg-transparent plasmo-border plasmo-border-[var(--border)] plasmo-transition-all hover:plasmo-bg-[var(--accent-bg)] hover:plasmo-text-[var(--accent)] hover:plasmo-border-[var(--accent-border)]"
                            >
                                <span className="plasmo-text-base leading-none">+</span>
                                Create New Skill
                            </button>
                        </div>
                    )}

                    <div className="plasmo-space-y-1">
                        {filtered.map((cmd, index) => {
                            const active = index === selectedIndex
                            const activeDark = active && D
                            const activeLight = active && !D

                            return (
                                <button
                                    key={cmd.id}
                                    ref={active ? selectedItemRef : null}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onMouseDown={(e) => { e.preventDefault(); selectCommand(index) }}
                                    className={`plasmo-group plasmo-relative plasmo-flex plasmo-w-full plasmo-items-center plasmo-gap-3 plasmo-overflow-hidden plasmo-border plasmo-px-3 plasmo-py-2 plasmo-text-left plasmo-transition-all plasmo-duration-200 ${activeDark
                                        ? "plasmo-border-white/10 plasmo-bg-white/[0.07] plasmo-shadow-lg"
                                        : activeLight
                                            ? "plasmo-border-black/5 plasmo-bg-neutral-100"
                                            : D
                                                ? "plasmo-border-transparent hover:plasmo-bg-white/[0.04]"
                                                : "plasmo-border-transparent hover:plasmo-bg-neutral-100/80"
                                        }`}
                                >
                                    {active && <div className="plasmo-absolute plasmo-inset-y-0 plasmo-left-0 plasmo-w-0.5 " />}

                                    {/* <div className={`plasmo-flex plasmo-h-8 plasmo-w-8 plasmo-shrink-0 plasmo-items-center plasmo-justify-center  plasmo-text-xs plasmo-font-bold ${active ? "plasmo-bg-blue-500 plasmo-text-white"
                                        : D ? "plasmo-bg-white/5 plasmo-text-neutral-300"
                                            : "plasmo-bg-neutral-200 plasmo-text-neutral-700"
                                        }`}>
                                        {cmd.label.charAt(0)}
                                    </div> */}

                                    <div className="plasmo-min-w-0 plasmo-flex-1">
                                        <div className="plasmo-flex plasmo-items-center plasmo-gap-1.5">
                                            <span className="plasmo-text-xs plasmo-font-semibold plasmo-font-mono">/{cmd.label}</span>
                                            {(() => {
                                                const vc = extractVarCount(cmd.template)
                                                if (vc === 0) return null
                                                return (
                                                    <span className={`plasmo-px-1.5 plasmo-py-0 plasmo-text-[10px] plasmo-font-medium ${D ? "plasmo-bg-white/5 plasmo-text-neutral-400" : "plasmo-bg-neutral-200 plasmo-text-neutral-500"
                                                        }`}>{vc} var{vc > 1 ? "s" : ""}</span>
                                                )
                                            })()}
                                            {/* <span className={`plasmo-px-1.5 plasmo-py-0 plasmo-text-[9px] plasmo-font-medium plasmo-uppercase plasmo-tracking-wide ${
                                                D ? "plasmo-bg-white/5 plasmo-text-neutral-400" : "plasmo-bg-neutral-200 plasmo-text-neutral-500"
                                            }`}>/{cmd.id}</span> */}
                                        </div>
                                        <p className={`plasmo-mt-0.5 plasmo-line-clamp-1 plasmo-text-[11px] ${textMuted2}`}>{cmd.description}</p>
                                    </div>

                                    <div className={`plasmo-flex plasmo-items-center plasmo-gap-1 plasmo-opacity-0 group-hover:plasmo-opacity-100 ${active ? "plasmo-opacity-100" : ""}`}>
                                        <kbd className={` plasmo-border plasmo-px-1.5 plasmo-py-0.5 plasmo-text-[9px] plasmo-font-medium ${D ? "plasmo-border-white/10 plasmo-bg-white/5 plasmo-text-neutral-300"
                                            : "plasmo-border-black/10 plasmo-bg-white plasmo-text-neutral-600"
                                            }`}>↵</kbd>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* FOOTER */}
                <div className={`plasmo-flex plasmo-items-center plasmo-justify-between plasmo-border-t plasmo-px-3 plasmo-py-2 plasmo-text-[11px] ${borderCls} ${textMuted}`}>
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-3">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                    </div>

                    <button onClick={() => {
                        chrome.runtime.sendMessage({
                            type: "OPEN_OPTIONS"
                        })
                    }} className={`plasmo-font-medium plasmo-transition-colors hover:plasmo-text-blue-500 ${D ? "plasmo-text-neutral-300 hover:plasmo-text-blue-500" : "plasmo-text-neutral-500"}`}>+ Create Skill</button>
                </div>
            </div>
        </div>
    )
}

export default CommandPalette
