import { useEffect, useMemo, useRef, useState } from "react"
import type { FC } from "react"

interface Command {
    id: string
    label: string
    description: string
    template: string
}

const COMMANDS: Command[] = [
    { id: "summarize", label: "Summarize", description: "Summarize the text", template: "Summarize the following text:" },
    { id: "explain", label: "Explain", description: "Simplify and explain", template: "Explain the following in simple terms:" },
    { id: "improve", label: "Improve Writing", description: "Fix grammar and style", template: "Improve the grammar and style of the following text:" },
    { id: "tranneutral", label: "Tranneutral", description: "Tranneutral to English", template: "Tranneutral the following text to English:" },
    { id: "code-review", label: "Code Review", description: "Review and improve code", template: "Review the following code and suggest improvements:" },
    { id: "debug", label: "Debug", description: "Find and fix issues", template: "Help me debug the following code:" },
    { id: "generate-test", label: "Generate Tests", description: "Create unit tests", template: "Generate unit tests for the following code:" },
    { id: "document", label: "Document", description: "Add documentation", template: "Add documentation and comments to the following code:" }
]

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
    position,
    searchValue,
    onSearchChange,
    onCommandSelect,
    onClose,
    theme = "dark",
    centered = false,
    commands
}) => {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const selectedItemRef = useRef<HTMLButtonElement>(null)
    const isDark = theme === "dark"

    useEffect(() => {
        inputRef.current?.focus()
    }, [])

    useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, [selectedIndex])

    const commandsList = commands ?? COMMANDS

    // normalize entries so rendering is robust if stored prompts are missing fields
    const normalized = commandsList.map((c: any) => ({
        id: c?.id ?? String(c),
        label: c?.label ?? c?.id ?? String(c),
        description: c?.description ?? "",
        template: c?.template ?? ""
    }))

    const filtered = useMemo(() => {
        if (!searchValue) return normalized
        return normalized.filter(c => (c.label + c.description).toLowerCase().includes(searchValue.toLowerCase()))
    }, [searchValue, normalized])

    const baseTheme = isDark
        ? "plasmo-bg-neutral-950 plasmo-border-neutral-800 plasmo-text-neutral-100"
        : "plasmo-bg-neutral-50 plasmo-border-neutral-200 plasmo-text-neutral-900"

    return (
        <div
            className={centered ? "plasmo-w-fit" : "plasmo-fixed plasmo-z-[9999] plasmo-transition-all"}
            style={!centered ? { left: position.x, top: position.y } : {}}
        >
            <div
                className={`
          plasmo-w-[720px]
          plasmo-rounded-lg
          plasmo-border
          plasmo-shadow-lg
          plasmo-overflow-hidden
          ${baseTheme}
        `}
            >
                {/* HEADER */}
                <div className={`plasmo-flex plasmo-items-center plasmo-gap-2 plasmo-px-4 plasmo-py-2 plasmo-border-b ${isDark ? "plasmo-border-neutral-800" : "plasmo-border-neutral-200"}`}>
                    <span className={`plasmo-text-xs plasmo-font-semibold ${isDark ? "plasmo-text-neutral-500" : "plasmo-text-neutral-400"}`}>
                        /
                    </span>

                    <input
                        ref={inputRef}
                        value={searchValue}
                        onChange={(e) => {
                            onSearchChange(e.target.value)
                            setSelectedIndex(0)
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowDown") {
                                e.preventDefault()
                                setSelectedIndex((p) => (p + 1) % filtered.length)
                            } else if (e.key === "ArrowUp") {
                                e.preventDefault()
                                setSelectedIndex((p) => (p === 0 ? filtered.length - 1 : p - 1))
                            } else if (e.key === "Enter") {
                                e.preventDefault()
                                if (filtered[selectedIndex]) {
                                    onCommandSelect(`/${filtered[selectedIndex].id}`)
                                    onClose()
                                }
                            } else if (e.key === "Escape") {
                                onClose()
                            }
                        }}
                        placeholder="Search commands..."
                        className={`plasmo-flex-1 plasmo-bg-transparent plasmo-outline-none plasmo-text-sm plasmo-placeholder:plasmo-text-neutral-500 ${isDark ? "plasmo-text-neutral-100" : "plasmo-text-neutral-900"}`}
                    />
                </div>

                {/* LIST */}
                <div
                    className="plasmo-max-h-80 plasmo-overflow-y-auto plasmo-py-1 plasmo-px-2"
                    style={{
                        scrollbarColor: isDark
                            ? "#334155 #1e293b"
                            : "#cbd5e1 #f1f5f9",
                        scrollbarWidth: "thin"
                    }}
                >
                    {filtered.length === 0 && (
                        <div className={`plasmo-text-xs plasmo-text-center plasmo-py-8 ${isDark ? "plasmo-text-neutral-500" : "plasmo-text-neutral-400"}`}>
                            No commands found
                        </div>
                    )}

                    {filtered.map((cmd, i) => {
                        const active = i === selectedIndex

                        return (
                            <button
                                ref={active ? selectedItemRef : null}
                                key={cmd.id}
                                onMouseEnter={() => setSelectedIndex(i)}
                                onMouseDown={(e) => {
                                    e.preventDefault()
                                    onCommandSelect(`/${cmd.id}`)
                                    onClose()
                                }}
                                className={`
                  plasmo-w-full plasmo-text-left plasmo-px-3 plasmo-py-1.5 plasmo-rounded-md
                  plasmo-transition-colors plasmo-duration-150
                  plasmo-flex plasmo-flex-col plasmo-gap-0.5
                  ${active
                                        ? isDark
                                            ? "plasmo-bg-neutral-800 plasmo-text-white"
                                            : "plasmo-bg-neutral-200 plasmo-text-neutral-900"
                                        : isDark
                                            ? "hover:plasmo-bg-neutral-800/50"
                                            : "hover:plasmo-bg-neutral-100"
                                    }
                `}
                            >
                                <div className="plasmo-flex plasmo-items-center plasmo-justify-between">
                                    <div className={`plasmo-font-medium plasmo-text-sm ${active ? (isDark ? "plasmo-text-white" : "plasmo-text-neutral-900") : ""}`}>
                                        {cmd.label}
                                    </div>

                                    {active && (
                                        <span className={`plasmo-text-[10px] plasmo-font-medium plasmo-px-1.5 plasmo-py-0.5 plasmo-rounded plasmo-tracking-wide ${isDark ? "plasmo-bg-neutral-700 plasmo-text-neutral-300" : "plasmo-bg-neutral-300 plasmo-text-neutral-700"}`}>
                                            ↵
                                        </span>
                                    )}
                                </div>

                                <div
                                    className={`plasmo-text-xs ${active
                                        ? isDark ? "plasmo-text-neutral-300" : "plasmo-text-neutral-700"
                                        : isDark ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"
                                        }`}
                                >
                                    {cmd.description}
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default CommandPalette
