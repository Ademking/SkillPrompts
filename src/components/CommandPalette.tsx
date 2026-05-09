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
    { id: "translate", label: "Translate", description: "Translate to English", template: "Translate the following text to English:" },
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
        selectedItemRef.current?.scrollIntoView({
            block: "nearest"
        })
    }, [selectedIndex])

    const commandsList = commands ?? COMMANDS

    const normalized = commandsList.map((c: any) => ({
        id: c?.id ?? String(c),
        label: c?.label ?? c?.id ?? String(c),
        description: c?.description ?? "",
        template: c?.template ?? ""
    }))

    const filtered = useMemo(() => {
        if (!searchValue) return normalized

        return normalized.filter((c) =>
            `${c.label} ${c.description}`
                .toLowerCase()
                .includes(searchValue.toLowerCase())
        )
    }, [searchValue, normalized])

    const selectCommand = (index: number) => {
        if (!filtered[index]) return

        onCommandSelect(`/${filtered[index].id}`)
        onClose()
    }

    return (
        <div
            className={
                centered
                    ? "plasmo-w-fit"
                    : "plasmo-fixed plasmo-z-[999999] plasmo-animate-in plasmo-fade-in plasmo-zoom-in-95"
            }
            style={!centered ? { left: position.x, top: position.y } : {}}
        >
            <div
                className={`
                    plasmo-w-[760px]
                    plasmo-overflow-hidden
                    plasmo-rounded-3xl
                    plasmo-border
                    plasmo-backdrop-blur-2xl
                    plasmo-shadow-[0_24px_80px_rgba(0,0,0,0.45)]
                    ${isDark
                        ? `
                            plasmo-border-white/10
                            plasmo-bg-neutral-950/96
                            plasmo-text-white
                          `
                        : `
                            plasmo-border-black/10
                            plasmo-bg-white/95
                            plasmo-text-neutral-900
                          `
                    }
                `}
            >
                {/* HEADER */}
                <div
                    className={`
                        plasmo-flex
                        plasmo-items-center
                        plasmo-gap-4
                        plasmo-border-b
                        plasmo-px-5
                        plasmo-py-4
                        ${isDark
                            ? "plasmo-border-white/10"
                            : "plasmo-border-black/5"
                        }
                    `}
                >
                    {/* Search Icon */}
                    <div
                        className={`
                            plasmo-flex
                            plasmo-h-10
                            plasmo-w-10
                            plasmo-items-center
                            plasmo-justify-center
                            plasmo-rounded-2xl
                            plasmo-border
                            plasmo-text-sm
                            plasmo-font-semibold
                            ${isDark
                                ? `
                                    plasmo-border-white/10
                                    plasmo-bg-white/5
                                    plasmo-text-neutral-300
                                  `
                                : `
                                    plasmo-border-black/5
                                    plasmo-bg-neutral-100
                                    plasmo-text-neutral-600
                                  `
                            }
                        `}
                    >
                        /
                    </div>

                    <div className="plasmo-flex-1">
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
                                    setSelectedIndex((p) =>
                                        p + 1 >= filtered.length ? 0 : p + 1
                                    )
                                }

                                else if (e.key === "ArrowUp") {
                                    e.preventDefault()
                                    setSelectedIndex((p) =>
                                        p <= 0 ? filtered.length - 1 : p - 1
                                    )
                                }

                                else if (e.key === "Enter") {
                                    e.preventDefault()
                                    selectCommand(selectedIndex)
                                }

                                else if (e.key === "Escape") {
                                    onClose()
                                }
                            }}
                            placeholder="Search AI commands..."
                            className={`
                                plasmo-w-full
                                plasmo-bg-transparent
                                plasmo-text-[15px]
                                plasmo-font-medium
                                plasmo-outline-none
                                plasmo-placeholder:plasmo-font-normal
                                ${isDark
                                    ? `
                                        plasmo-text-white
                                        placeholder:plasmo-text-neutral-500
                                      `
                                    : `
                                        plasmo-text-neutral-900
                                        placeholder:plasmo-text-neutral-400
                                      `
                                }
                            `}
                        />

                        <div
                            className={`
                                plasmo-mt-1
                                plasmo-text-xs
                                ${isDark
                                    ? "plasmo-text-neutral-500"
                                    : "plasmo-text-neutral-400"
                                }
                            `}
                        >
                            {filtered.length} commands available
                        </div>
                    </div>

                    {/* Keyboard hint */}
                    <div
                        className={`
                            plasmo-hidden
                            md:plasmo-flex
                            plasmo-items-center
                            plasmo-gap-1
                            plasmo-text-xs
                            ${isDark
                                ? "plasmo-text-neutral-500"
                                : "plasmo-text-neutral-400"
                            }
                        `}
                    >
                        <kbd
                            className={`
                                plasmo-rounded-md
                                plasmo-border
                                plasmo-px-2
                                plasmo-py-1
                                ${isDark
                                    ? `
                                        plasmo-border-white/10
                                        plasmo-bg-white/5
                                      `
                                    : `
                                        plasmo-border-black/10
                                        plasmo-bg-neutral-100
                                      `
                                }
                            `}
                        >
                            ↑↓
                        </kbd>

                        <kbd
                            className={`
                                plasmo-rounded-md
                                plasmo-border
                                plasmo-px-2
                                plasmo-py-1
                                ${isDark
                                    ? `
                                        plasmo-border-white/10
                                        plasmo-bg-white/5
                                      `
                                    : `
                                        plasmo-border-black/10
                                        plasmo-bg-neutral-100
                                      `
                                }
                            `}
                        >
                            Enter
                        </kbd>
                    </div>
                </div>

                {/* COMMAND LIST */}
                <div
                    className="
                        plasmo-max-h-[420px]
                        plasmo-overflow-y-auto
                        plasmo-p-3
                    "
                >
                    {filtered.length === 0 && (
                        <div
                            className={`
                                plasmo-flex
                                plasmo-flex-col
                                plasmo-items-center
                                plasmo-justify-center
                                plasmo-gap-2
                                plasmo-py-16
                                plasmo-text-center
                                ${isDark
                                    ? "plasmo-text-neutral-500"
                                    : "plasmo-text-neutral-400"
                                }
                            `}
                        >
                            <div className="plasmo-text-3xl">⌘</div>

                            <div className="plasmo-text-sm plasmo-font-medium">
                                No commands found
                            </div>

                            <div className="plasmo-text-xs">
                                Try another keyword
                            </div>
                        </div>
                    )}

                    <div className="plasmo-space-y-1.5">
                        {filtered.map((cmd, index) => {
                            const active = index === selectedIndex

                            return (
                                <button
                                    key={cmd.id}
                                    ref={active ? selectedItemRef : null}
                                    onMouseEnter={() => setSelectedIndex(index)}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        selectCommand(index)
                                    }}
                                    className={`
                                        plasmo-group
                                        plasmo-relative
                                        plasmo-flex
                                        plasmo-w-full
                                        plasmo-items-center
                                        plasmo-gap-4
                                        plasmo-overflow-hidden
                                        plasmo-rounded-2xl
                                        plasmo-border
                                        plasmo-px-4
                                        plasmo-py-3
                                        plasmo-text-left
                                        plasmo-transition-all
                                        plasmo-duration-200

                                        ${active
                                            ? isDark
                                                ? `
                                                    plasmo-border-white/10
                                                    plasmo-bg-white/[0.07]
                                                    plasmo-shadow-lg
                                                  `
                                                : `
                                                    plasmo-border-black/5
                                                    plasmo-bg-neutral-100
                                                  `
                                            : isDark
                                                ? `
                                                    plasmo-border-transparent
                                                    hover:plasmo-bg-white/[0.04]
                                                  `
                                                : `
                                                    plasmo-border-transparent
                                                    hover:plasmo-bg-neutral-100/80
                                                  `
                                        }
                                    `}
                                >
                                    {/* Glow */}
                                    {active && (
                                        <div
                                            className="
                                                plasmo-absolute
                                                plasmo-inset-y-0
                                                plasmo-left-0
                                                plasmo-w-1
                                                plasmo-rounded-full
                                            "
                                        />
                                    )}

                                    {/* Icon */}
                                    <div
                                        className={`
                                            plasmo-flex
                                            plasmo-h-11
                                            plasmo-w-11
                                            plasmo-shrink-0
                                            plasmo-items-center
                                            plasmo-justify-center
                                            plasmo-rounded-2xl
                                            plasmo-text-sm
                                            plasmo-font-bold
                                            ${active
                                                ? `
                                                    plasmo-bg-emerald-500
                                                    plasmo-text-white
                                                  `
                                                : isDark
                                                    ? `
                                                        plasmo-bg-white/5
                                                        plasmo-text-neutral-300
                                                      `
                                                    : `
                                                        plasmo-bg-neutral-200
                                                        plasmo-text-neutral-700
                                                      `
                                            }
                                        `}
                                    >
                                        {cmd.label.charAt(0)}
                                    </div>

                                    {/* Content */}
                                    <div className="plasmo-min-w-0 plasmo-flex-1">
                                        <div
                                            className={`
                                                plasmo-flex
                                                plasmo-items-center
                                                plasmo-gap-2
                                            `}
                                        >
                                            <span className="plasmo-text-sm plasmo-font-semibold">
                                                {cmd.label}
                                            </span>

                                            <span
                                                className={`
                                                    plasmo-rounded-full
                                                    plasmo-px-2
                                                    plasmo-py-0.5
                                                    plasmo-text-[10px]
                                                    plasmo-font-medium
                                                    plasmo-uppercase
                                                    plasmo-tracking-wide
                                                    ${isDark
                                                        ? `
                                                            plasmo-bg-white/5
                                                            plasmo-text-neutral-400
                                                          `
                                                        : `
                                                            plasmo-bg-neutral-200
                                                            plasmo-text-neutral-500
                                                          `
                                                    }
                                                `}
                                            >
                                                /{cmd.id}
                                            </span>
                                        </div>

                                        <p
                                            className={`
                                                plasmo-mt-1
                                                plasmo-line-clamp-1
                                                plasmo-text-xs
                                                ${isDark
                                                    ? "plasmo-text-neutral-400"
                                                    : "plasmo-text-neutral-500"
                                                }
                                            `}
                                        >
                                            {cmd.description}
                                        </p>
                                    </div>

                                    {/* Action */}
                                    <div
                                        className={`
                                            plasmo-flex
                                            plasmo-items-center
                                            plasmo-gap-1
                                            plasmo-opacity-0
                                            group-hover:plasmo-opacity-100
                                            ${active ? "plasmo-opacity-100" : ""}
                                        `}
                                    >
                                        <kbd
                                            className={`
                                                plasmo-rounded-lg
                                                plasmo-border
                                                plasmo-px-2
                                                plasmo-py-1
                                                plasmo-text-[10px]
                                                plasmo-font-medium
                                                ${isDark
                                                    ? `
                                                        plasmo-border-white/10
                                                        plasmo-bg-white/5
                                                        plasmo-text-neutral-300
                                                      `
                                                    : `
                                                        plasmo-border-black/10
                                                        plasmo-bg-white
                                                        plasmo-text-neutral-600
                                                      `
                                                }
                                            `}
                                        >
                                            ↵
                                        </kbd>
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* FOOTER */}
                <div
                    className={`
                        plasmo-flex
                        plasmo-items-center
                        plasmo-justify-between
                        plasmo-border-t
                        plasmo-px-4
                        plasmo-py-3
                        plasmo-text-xs
                        ${isDark
                            ? `
                                plasmo-border-white/10
                                plasmo-text-neutral-500
                              `
                            : `
                                plasmo-border-black/5
                                plasmo-text-neutral-400
                              `
                        }
                    `}
                >
                    <div className="plasmo-flex plasmo-items-center plasmo-gap-4">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                        <span>Esc Close</span>
                    </div>

                    <div className="plasmo-font-medium">
                        Skill Prompts
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CommandPalette