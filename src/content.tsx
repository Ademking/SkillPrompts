import cssText from "data-text:~style.css"
import { useEffect, useMemo, useRef, useState } from "react"

import { Storage } from "@plasmohq/storage"
import CommandPalette from "./components/CommandPalette"
import { VariableModal } from "./components/VariableModal"
import type { PlasmoCSConfig } from "plasmo"

const styleElement = document.createElement("style")

export const config: PlasmoCSConfig = {
  matches: [
    "https://chatgpt.com/*",
    "https://chat.openai.com/*",
    "https://gemini.google.com/*"
  ]
}

export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize

    return `${pixelsValue}px`
  })

  styleElement.textContent = updatedCssText
  return styleElement
}

const PROMPTS_STORAGE_KEY = "skillprompts_prompts"
const ENABLED_STORAGE_KEY = "skillprompts_enabled"
const USAGE_STORAGE_KEY = "skillprompts_usage"

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{\s*(\w+)\s*\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => {
    const trimmed = m.slice(2, -2).trim()
    return trimmed
  }))]
}

type StoredPrompt = {
  id: string
  label: string
  description: string
  template: string
}

const CommandPaletteUI = () => {
  const [isVisible, setIsVisible] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const targetRef = useRef<HTMLElement | null>(null)
  const selectionRangeRef = useRef<{ start: number; end: number } | null>(null)
  const contentEditableRangeRef = useRef<Range | null>(null)
  const paletteRef = useRef<HTMLDivElement>(null)
  const hiddenMenusRef = useRef<HTMLElement[]>([])
  const hideMenuTimeoutRef = useRef<number | null>(null)
  const highlightedRangesRef = useRef<Range[]>([])
  const ignoreMutationsRef = useRef(false)
  const highlightRef = useRef<() => void>(() => { })
  const storage = useMemo(() => new Storage({ area: "local" }), [])

  // Inject highlight styling into main document
  const injectHighlightStyles = () => {
    if (document.getElementById("command-highlight-styles")) return

    const style = document.createElement("style")
    style.id = "command-highlight-styles"
    style.textContent = `
      ::highlight(command-insert) {
  background-color: rgba(20, 142, 255, 0.18);
  color: #148EFF;

  text-decoration: underline 2px solid rgba(20, 142, 255, 0.7);
  text-underline-offset: 3px;

  text-shadow: 0 0 6px rgba(20, 142, 255, 0.35);

  border-radius: 4px;
  padding: 0 2px;

  box-shadow: 0 0 0 1px rgba(20, 142, 255, 0.25) inset;
  transition: all 0.2s ease-in-out;
}

/* Fallback style when ::highlight is unavailable — span wrappers */
.command-insert-fallback {
  background-color: rgba(20, 142, 255, 0.18) !important;
  color: #148EFF !important;
  text-decoration: underline 2px solid rgba(20, 142, 255, 0.7) !important;
  text-underline-offset: 3px !important;
  text-shadow: 0 0 6px rgba(20, 142, 255, 0.35) !important;
  border-radius: 4px !important;
  padding: 0 2px !important;
  box-shadow: 0 0 0 1px rgba(20, 142, 255, 0.25) inset !important;
}

::highlight(var-insert) {
  background-color: rgba(245, 158, 11, 0.18);
  color: #F59E0B;
  text-decoration: underline 2px solid rgba(245, 158, 11, 0.7);
  text-underline-offset: 3px;
  text-shadow: 0 0 6px rgba(245, 158, 11, 0.35);
  border-radius: 4px;
  padding: 0 2px;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.25) inset;
  transition: all 0.2s ease-in-out;
}

.var-insert-fallback {
  background-color: rgba(245, 158, 11, 0.18) !important;
  color: #F59E0B !important;
  text-decoration: underline 2px solid rgba(245, 158, 11, 0.7) !important;
  text-underline-offset: 3px !important;
  text-shadow: 0 0 6px rgba(245, 158, 11, 0.35) !important;
  border-radius: 4px !important;
  padding: 0 2px !important;
  box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.25) inset !important;
}
    `
    document.head.appendChild(style)

    // Also inject into all shadow roots that might contain contenteditable elements
    const injectToShadowRoots = (root: Document | ShadowRoot = document) => {
      try {
        const all = Array.from(root.querySelectorAll('*'))
        for (const el of all) {
          const sr = (el as HTMLElement).shadowRoot
          if (sr && !sr.getElementById("command-highlight-styles")) {
            const shadowStyle = style.cloneNode(true)
            sr.appendChild(shadowStyle)
            injectToShadowRoots(sr)
          }
        }
      } catch (e) {
        // ignore
      }
    }
    injectToShadowRoots()
  }
  const [storedCommands, setStoredCommands] = useState<StoredPrompt[]>([])
  const [hasLoadedCommands, setHasLoadedCommands] = useState(false)
  const [isEnabled, setIsEnabled] = useState(true)
  const [showVarModal, setShowVarModal] = useState(false)
  const [varModalLabel, setVarModalLabel] = useState("")
  const [varModalTemplate, setVarModalTemplate] = useState("")
  const [varModalVars, setVarModalVars] = useState<string[]>([])

  // Helper: find all elements with contenteditable (any value except "false"), including inside shadow roots
  const getAllContentEditables = () => {
    const results: Element[] = []

    const collectFromRoot = (root: Document | ShadowRoot) => {
      try {
        results.push(...Array.from(root.querySelectorAll('[contenteditable]:not([contenteditable="false"])')))
        const all = Array.from(root.querySelectorAll('*'))
        for (const el of all) {
          const sr = (el as HTMLElement).shadowRoot
          if (sr) collectFromRoot(sr)
        }
      } catch (e) {
        // ignore
      }
    }

    collectFromRoot(document)
    return results
  }

  const highlightExistingCommands = () => {
    if (!isEnabled) return

    const supportsHighlights = Boolean((window as any).CSS && (CSS as any).highlights)

    try {
      if (storedCommands.length === 0) {
        if (supportsHighlights) {
          (CSS as any).highlights.delete("command-insert")
            ; (CSS as any).highlights.delete("var-insert")
        }
        highlightedRangesRef.current = []
        // unwrap any fallback spans
        document.querySelectorAll("span.command-insert-fallback, span.var-insert-fallback").forEach((s) => s.replaceWith(document.createTextNode(s.textContent || "")))
        return
      }

      const contentEditables = getAllContentEditables()


      // Build ranges for CSS.highlights if available
      if (supportsHighlights) {
        const cmdRanges: Range[] = []
        const varRanges: Range[] = []

        contentEditables.forEach((element) => {
          const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
          let node
          while ((node = walker.nextNode())) {
            const textNode = node as Text
            const text = textNode.nodeValue || ""

            for (const cmd of storedCommands) {
              const template = `/${cmd.label}`
              let startIdx = 0
              let idx = text.indexOf(template, startIdx)

              while (idx !== -1) {
                const range = document.createRange()
                range.setStart(textNode, idx)
                range.setEnd(textNode, idx + template.length)
                cmdRanges.push(range)

                startIdx = idx + template.length
                idx = text.indexOf(template, startIdx)
              }
            }

            const varRegex = /(\w+)="([^"]*)"/g
            let vMatch
            while ((vMatch = varRegex.exec(text)) !== null) {
              const range = document.createRange()
              range.setStart(textNode, vMatch.index)
              range.setEnd(textNode, vMatch.index + vMatch[0].length)
              varRanges.push(range)
            }
          }
        })

        try {
          if (cmdRanges.length > 0) {
            highlightedRangesRef.current = cmdRanges
            const cmdHighlight = new Highlight(...cmdRanges)
              ; (CSS as any).highlights.set("command-insert", cmdHighlight)
          } else {
            ; (CSS as any).highlights.delete("command-insert")
          }
          if (varRanges.length > 0) {
            const varHighlight = new Highlight(...varRanges)
              ; (CSS as any).highlights.set("var-insert", varHighlight)
          } else {
            ; (CSS as any).highlights.delete("var-insert")
          }
          return
        } catch (err) {
          console.error("Highlight API failed, falling back to span wrapper:", err)
        }
      }

      // Fallback: wrap matched tokens in span.command-insert-fallback / span.var-insert-fallback
      try {
        ignoreMutationsRef.current = true
        contentEditables.forEach((element: Element) => {
          // unwrap existing fallback spans first
          element.querySelectorAll("span.command-insert-fallback, span.var-insert-fallback").forEach((s) => s.replaceWith(document.createTextNode(s.textContent || "")))

          // Collect all matches: {textNode, startIdx, endIdx, type}
          const matches: Array<{ node: Text, start: number, end: number, type: 'command' | 'var' }> = []
          const walker = document.createTreeWalker(element as Node, NodeFilter.SHOW_TEXT, null)
          let walkerNode
          while ((walkerNode = walker.nextNode())) {
            const textNode = walkerNode as Text
            let text = textNode.nodeValue || ""

            for (const cmd of storedCommands) {
              const template = `/${cmd.label}`
              let startIdx = 0
              let idx = text.indexOf(template, startIdx)
              while (idx !== -1) {
                matches.push({ node: textNode, start: idx, end: idx + template.length, type: 'command' })
                startIdx = idx + template.length
                idx = text.indexOf(template, startIdx)
              }
            }

            const varRegex = /(\w+)="([^"]*)"/g
            let vMatch
            while ((vMatch = varRegex.exec(text)) !== null) {
              matches.push({ node: textNode, start: vMatch.index, end: vMatch.index + vMatch[0].length, type: 'var' })
            }
          }



          // Apply wrapping: rebuild each text node with matches
          const byNode = new Map<Text, Array<{ start: number, end: number, type: 'command' | 'var' }>>()
          for (const match of matches) {
            if (!byNode.has(match.node)) byNode.set(match.node, [])
            byNode.get(match.node)!.push({ start: match.start, end: match.end, type: match.type })
          }

          for (const [textNode, nodeMatches] of byNode) {
            const parent = textNode.parentNode
            if (!parent) continue

            const fullText = textNode.nodeValue || ""
            const sortedMatches = nodeMatches.sort((a, b) => a.start - b.start)

            // Build fragments: [{type: 'text'|'command'|'var', content}]
            const fragments: Array<{ type: string, content: string }> = []
            let lastIdx = 0

            for (const match of sortedMatches) {
              if (match.start > lastIdx) {
                fragments.push({ type: 'text', content: fullText.slice(lastIdx, match.start) })
              }
              fragments.push({ type: match.type, content: fullText.slice(match.start, match.end) })
              lastIdx = match.end
            }

            if (lastIdx < fullText.length) {
              fragments.push({ type: 'text', content: fullText.slice(lastIdx) })
            }

            for (const frag of fragments) {
              if (frag.type === 'text' && frag.content) {
                parent.insertBefore(document.createTextNode(frag.content), textNode)
              } else if (frag.type === 'command' || frag.type === 'var') {
                const isVar = frag.type === 'var'
                const span = document.createElement("span")
                span.className = isVar ? "var-insert-fallback" : "command-insert-fallback"
                span.textContent = frag.content
                if (isVar) {
                  span.style.backgroundColor = "rgba(245, 158, 11, 0.18)"
                  span.style.color = "#F59E0B"
                  span.style.textDecoration = "underline 2px solid rgba(245, 158, 11, 0.7)"
                  span.style.textDecorationColor = "rgba(245, 158, 11, 0.7)"
                  span.style.textDecorationThickness = "2px"
                  span.style.textUnderlineOffset = "3px"
                  span.style.textShadow = "0 0 6px rgba(245, 158, 11, 0.35)"
                  span.style.borderRadius = "4px"
                  span.style.padding = "0 2px"
                  span.style.boxShadow = "0 0 0 1px rgba(245, 158, 11, 0.25) inset"
                } else {
                  span.style.backgroundColor = "rgba(20, 142, 255, 0.18)"
                  span.style.color = "#148EFF"
                  span.style.textDecoration = "underline 2px solid rgba(20, 142, 255, 0.7)"
                  span.style.textDecorationColor = "rgba(20, 142, 255, 0.7)"
                  span.style.textDecorationThickness = "2px"
                  span.style.textUnderlineOffset = "3px"
                  span.style.textShadow = "0 0 6px rgba(20, 142, 255, 0.35)"
                  span.style.borderRadius = "4px"
                  span.style.padding = "0 2px"
                  span.style.boxShadow = "0 0 0 1px rgba(20, 142, 255, 0.25) inset"
                }
                parent.insertBefore(span, textNode)
              }
            }

            parent.removeChild(textNode)
          }


        })
      } finally {
        ignoreMutationsRef.current = false
      }
    } catch (error) {
      console.error("Failed to highlight existing commands (unexpected):", error)
    }
  }

  highlightRef.current = highlightExistingCommands

  const replaceCommandsWithPromptsRef = useRef<() => void>(() => { })

  const replaceCommandsWithPrompts = () => {
    const expandCommand = (match: string, label: string): string => {
      const cmd = storedCommands.find(p => p.label === label)
      if (!cmd) return match

      const varRegex = /(\w+)="([^"]*)"/g
      const vars: Record<string, string> = {}
      let varMatch
      while ((varMatch = varRegex.exec(match)) !== null) {
        vars[varMatch[1]] = varMatch[2]
      }

      const templateVars = extractVariables(cmd.template || "")
      let result = cmd.template || ""

      if (templateVars.length > 0) {
        for (const vName of templateVars) {
          const val = vars[vName] || ""
          result = result.replace(new RegExp(`\\{\\{\\s*${vName}\\s*\\}\\}`, "g"), val)
        }
        result = result.replace(/\{\{\s*\w+\s*\}\}/g, "")
      }

      storage.get<Record<string, number>>(USAGE_STORAGE_KEY).then(usage => {
        const next = { ...(usage || {}), [label]: ((usage || {})[label] || 0) + 1 }
        storage.set(USAGE_STORAGE_KEY, next)
      })

      return result
    }

    const replaceText = (text: string) => {
      let updatedText = text
      for (const cmd of storedCommands) {
        const escapedLabel = cmd.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const pattern = `\\/${escapedLabel}(?:\\s+\\w+="[^"]*")*(?!\\S)`
        const regex = new RegExp(pattern, "g")
        updatedText = updatedText.replace(regex, (match) => expandCommand(match, cmd.label))
      }
      return updatedText
    }

    const activeElement = document.activeElement as HTMLElement | null

    if (activeElement instanceof HTMLInputElement || activeElement instanceof HTMLTextAreaElement) {
      const nextValue = replaceText(activeElement.value)

      if (nextValue !== activeElement.value) {
        activeElement.value = nextValue
        activeElement.dispatchEvent(new Event("input", { bubbles: true }))
        activeElement.dispatchEvent(new Event("change", { bubbles: true }))
      }
    }

    const contentEditables = getAllContentEditables()


    contentEditables.forEach((element) => {
      // Unwrap fallback spans so command+variable text isn't split by highlight wrappers
      element.querySelectorAll("span.command-insert-fallback").forEach((s) =>
        s.replaceWith(document.createTextNode(s.textContent || ""))
      )

      const fullText = element.textContent || ""
      const processed = replaceText(fullText)

      if (processed !== fullText) {
        // Use execCommand so ProseMirror intercepts and applies to internal state
        const sel = window.getSelection()
        const range = document.createRange()
        range.selectNodeContents(element)
        sel.removeAllRanges()
        sel.addRange(range)
        document.execCommand("insertText", false, processed)
      }
    })
  }
  replaceCommandsWithPromptsRef.current = replaceCommandsWithPrompts

  useEffect(() => {
    if (!hasLoadedCommands) return
    highlightExistingCommands()
  }, [storedCommands, hasLoadedCommands])

  // Expose debug helper to window for manual testing
  useEffect(() => {
    (window as any).__debugHighlight = () => {
      const editables = getAllContentEditables()
      for (let i = 0; i < editables.length; i++) {
        const el = editables[i]
      }
      const spans = document.querySelectorAll("span.command-insert-fallback")
      highlightExistingCommands()
      setTimeout(() => {
        const spansAfter = document.querySelectorAll("span.command-insert-fallback")

        for (let i = 0; i < spansAfter.length; i++) {
          const s = spansAfter[i]

          const computed = window.getComputedStyle(s)

        }
      }, 100)
    }
  }, [storedCommands, hasLoadedCommands])

  // utility: debounce helper
  const debounce = (fn: (...args: any[]) => void, wait = 80) => {
    let t: number | null = null
    return (...args: any[]) => {
      if (t) window.clearTimeout(t)
      t = window.setTimeout(() => {
        t = null
        try {
          fn(...args)
        } catch (e) {
          console.error("debounced fn error:", e)
        }
      }, wait)
    }
  }





  useEffect(() => {
    injectHighlightStyles()

    const detectTheme = () => {
      const isDark = document.documentElement.classList.contains("dark")
      const isLight = document.documentElement.classList.contains("light")

      if (isLight) {
        setTheme("light")
      } else if (isDark) {
        setTheme("dark")
      } else {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setTheme(prefersDark ? "dark" : "light")
      }
    }

    detectTheme()

    const observer = new MutationObserver(() => {
      detectTheme()
      if (ignoreMutationsRef.current) return
      highlightRef.current()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
      subtree: true,
      childList: true,
      characterData: true
    })

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
    mediaQuery.addEventListener("change", detectTheme)

    setTimeout(() => {
      highlightRef.current()
    }, 500)

    const debouncedHighlight = debounce(() => highlightRef.current(), 80)

    // Re-run highlighter on load, focus changes, visibility and body mutations
    const onLoad = () => setTimeout(() => highlightRef.current(), 0)
    const onFocusOut = () => setTimeout(() => highlightRef.current(), 0)
    const onVisibility = () => {
      if (document.visibilityState === "visible") setTimeout(() => highlightRef.current(), 50)
    }

    window.addEventListener("load", onLoad)
    document.addEventListener("focusout", onFocusOut, true)
    document.addEventListener("visibilitychange", onVisibility)

    const bodyObserver = new MutationObserver(() => {
      if (ignoreMutationsRef.current) return
      debouncedHighlight()
    })
    try {
      bodyObserver.observe(document.body, { subtree: true, childList: true, characterData: true })
    } catch (e) {
      // ignore if body not present or observe fails
    }

    let cancelled = false

    const loadStoredCommands = async () => {
      try {
        const stored = await storage.get<StoredPrompt[]>(PROMPTS_STORAGE_KEY)
        let nextCommands = Array.isArray(stored) ? stored : []

        if (nextCommands.length === 0) {
          const legacy = window.localStorage.getItem(PROMPTS_STORAGE_KEY)
          if (legacy) {
            try {
              nextCommands = JSON.parse(legacy)
              await storage.set(PROMPTS_STORAGE_KEY, nextCommands)
            } catch {
              nextCommands = []
            }
          }
        }

        const savedEnabled = await storage.get<boolean>(ENABLED_STORAGE_KEY)

        if (!cancelled) {
          setStoredCommands(nextCommands)
          setHasLoadedCommands(true)
          if (savedEnabled !== undefined) setIsEnabled(savedEnabled)
        }
      } catch (err) {
        if (!cancelled) {
          setStoredCommands([])
          setHasLoadedCommands(true)
        }
      }
    }

    loadStoredCommands()

    storage.watch({
      [PROMPTS_STORAGE_KEY]: (change: { newValue?: StoredPrompt[] }) => {
        const nextCommands = Array.isArray(change.newValue) ? change.newValue : []
        setStoredCommands(nextCommands)
        setHasLoadedCommands(true)
        setTimeout(() => highlightRef.current(), 0)
      },
      [ENABLED_STORAGE_KEY]: (change: { newValue?: boolean }) => {
        setIsEnabled(change.newValue !== false)
      }
    })

    return () => {
      cancelled = true
      observer.disconnect()
      bodyObserver.disconnect()
      mediaQuery.removeEventListener("change", detectTheme)
      window.removeEventListener("load", onLoad)
      document.removeEventListener("focusout", onFocusOut, true)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [storage])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEnabled) return

      const target = event.target as HTMLElement

      if (paletteRef.current?.contains(target)) {
        return
      }

      if (event.key === "Enter" && !event.shiftKey && !event.altKey && !event.isComposing) {
        if (
          target.tagName === "TEXTAREA" ||
          target.isContentEditable ||
          target.tagName === "INPUT"
        ) {
          replaceCommandsWithPromptsRef.current()
        }
      }

      if (event.key === "/" && !isVisible) {
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          event.preventDefault()
          event.stopPropagation()
          event.stopImmediatePropagation()
          targetRef.current = target

          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            const start = target.selectionStart ?? target.value.length
            const end = target.selectionEnd ?? target.value.length

            target.setRangeText("/", start, end, "end")
            selectionRangeRef.current = {
              start: start + 1,
              end: start + 1
            }
            target.dispatchEvent(new Event("input", { bubbles: true }))
          } else if (target.isContentEditable) {
            const selection = window.getSelection()

            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0)
              range.deleteContents()

              const textNode = document.createTextNode("/")
              range.insertNode(textNode)

              const after = document.createRange()
              after.setStart(textNode, 1)
              after.collapse(true)
              selection.removeAllRanges()
              selection.addRange(after)

              contentEditableRangeRef.current = after.cloneRange()
            }
          }

          //hideDefaultMenu()
          setIsVisible(true)
          setInputValue("")
        }
      }

      if (event.key === "Escape" && isVisible) {
        setIsVisible(false)
      }
    }

    const handleBeforeInput = (event: InputEvent) => {
      if (!isEnabled) return
      if (event.data === "/") {
        event.preventDefault()
      }
    }

    const handleKeyUp = (event: KeyboardEvent) => {
      if (!isEnabled) return
      if (event.key === "/") {
        event.preventDefault()
        event.stopPropagation()
        event.stopImmediatePropagation()
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!isVisible || !paletteRef.current) return

      const target = event.target as Node

      // If the click target is inside the palette, ignore it
      if (paletteRef.current.contains(target)) return

      // Some browsers report the scrollbar click outside the element's DOM tree.
      // Also treat clicks whose coordinates lie within the palette bounding rect as inside.
      try {
        const rect = paletteRef.current.getBoundingClientRect()
        const x = (event as MouseEvent).clientX
        const y = (event as MouseEvent).clientY

        if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
          return
        }
      } catch (err) {
        // ignore and fall through to closing
      }

      setIsVisible(false)
    }

    const handleSendAction = () => {
      replaceCommandsWithPromptsRef.current()
    }

    window.addEventListener("keydown", handleKeyDown, true)
    window.addEventListener("beforeinput", handleBeforeInput, true)
    window.addEventListener("keyup", handleKeyUp, true)
    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("submit", handleSendAction, true)

    const observeSendButton = () => {
      const sendButtons = document.querySelectorAll(
        'button[aria-label*="Send"], [data-testid*="send"], button:has(svg[aria-label*="Send"])'
      )

      sendButtons.forEach((buttonElement) => {
        const button = buttonElement as HTMLElement
        button.removeEventListener("click", handleSendAction)
        button.addEventListener("click", handleSendAction, false)
      })
    }

    const buttonObserver = new MutationObserver(() => {
      observeSendButton()
    })

    buttonObserver.observe(document.body, { subtree: true, childList: true })
    observeSendButton()

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true)
      window.removeEventListener("beforeinput", handleBeforeInput, true)
      window.removeEventListener("keyup", handleKeyUp, true)
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("submit", handleSendAction, true)
      buttonObserver.disconnect()

      const sendButtons = document.querySelectorAll(
        'button[aria-label*="Send"], [data-testid*="send"], button:has(svg[aria-label*="Send"])'
      )

      sendButtons.forEach((buttonElement) => {
        ; (buttonElement as HTMLElement).removeEventListener("click", handleSendAction)
      })
    }
  }, [isVisible, isEnabled])

  const handleCommandSelect = (command: string) => {
    // keep previous handler below; placeholder to satisfy linter if needed
    // actual handler defined further below where used in JSX
    // (kept here intentionally)
  }

  // This replaces the previous static onCommandSelect handler logic using storedCommands
  const insertIntoInput = (text: string) => {
    const target = targetRef.current
    const words = text.split(" ")
    const firstWord = words[0] || ""

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      const range = selectionRangeRef.current
      const start = range?.start ?? target.selectionStart ?? target.value.length
      const end = range?.end ?? target.selectionEnd ?? target.value.length

      target.setRangeText(text, start, end, "end")
      target.dispatchEvent(new Event("input", { bubbles: true }))
      target.dispatchEvent(new Event("change", { bubbles: true }))
    } else if (target?.isContentEditable) {
      target.focus()
      const range = contentEditableRangeRef.current

      if (range) {
        try {
          range.deleteContents()
          const textNode = document.createTextNode(text)
          range.insertNode(textNode)

          const highlightRange = document.createRange()
          highlightRange.setStart(textNode, 0)
          highlightRange.setEnd(textNode, firstWord.length)

          highlightedRangesRef.current = [...highlightedRangesRef.current, highlightRange]
          try {
            const highlight = new Highlight(highlightRange)
            CSS.highlights.set("command-insert", highlight)
          } catch (err) {
            console.error("Failed to set highlight:", err)
          }

          const sel = window.getSelection()
          if (sel) {
            sel.removeAllRanges()
            const after = document.createRange()
            after.setStart(textNode, text.length)
            after.collapse(true)
            sel.addRange(after)
          }
        } catch (err) {
          console.error("Insert command failed:", err)
          document.execCommand("insertText", false, text)
          setTimeout(() => { highlightExistingCommands() }, 0)
        }
      } else {
        document.execCommand("insertText", false, text)
        setTimeout(() => { highlightExistingCommands() }, 0)
      }
    }
  }

  const cleanupAfterInsert = () => {
    targetRef.current = null
    selectionRangeRef.current = null
    contentEditableRangeRef.current = null
    setIsVisible(false)
  }

  const handleCommandSelectInternal = (command: string) => {
    const label = command.replace(/^\//, "")
    const cmd = storedCommands.find(p => p.label === label)

    if (cmd) {
      const vars = extractVariables(cmd.template || "")
      if (vars.length > 0) {
        setVarModalLabel(label)
        setVarModalTemplate(cmd.template || "")
        setVarModalVars(vars)
        setShowVarModal(true)
        setIsVisible(false)
        return
      }
    }

    insertIntoInput(`${label} `)
    cleanupAfterInsert()
  }

  const handleVarSubmit = (values: Record<string, string>) => {
    const varString = varModalVars.map(v => `${v}="${values[v] || ""}"`).join(" ")
    insertIntoInput(`${varModalLabel} ${varString} `)
    setShowVarModal(false)
    cleanupAfterInsert()
  }

  return (
    <div ref={paletteRef}>
      {isVisible && (
        <>
          <div className="plasmo-fixed plasmo-inset-0 plasmo-z-[9999]" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }} onClick={() => setIsVisible(false)} />
          <div className="plasmo-fixed plasmo-inset-0 plasmo-z-[10000] plasmo-flex plasmo-items-center plasmo-justify-center plasmo-pointer-events-none">
            <div className="plasmo-pointer-events-auto" onMouseDown={(e) => e.stopPropagation()}>
              {hasLoadedCommands ? (
                <CommandPalette
                  position={{ x: 0, y: 0 }}
                  searchValue={inputValue}
                  onSearchChange={setInputValue}
                  onCommandSelect={handleCommandSelectInternal}
                  onClose={() => setIsVisible(false)}
                  theme={theme}
                  centered={true}
                  commands={storedCommands.map(p => ({ id: p.label, label: p.label, description: p.description || "", template: p.template }))}
                />
              ) : (
                <div className={`plasmo-flex plasmo-items-center plasmo-justify-center plasmo-px-6 plasmo-py-4 plasmo-text-sm ${theme === "dark" ? "plasmo-text-neutral-400" : "plasmo-text-neutral-500"}`}>
                  Loading commands...
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {showVarModal && (
        <VariableModal
          label={varModalLabel}
          variables={varModalVars}
          template={varModalTemplate}
          theme={theme}
          onSubmit={handleVarSubmit}
          onClose={() => { setShowVarModal(false); cleanupAfterInsert() }}
        />
      )}
    </div>
  )
}

export default CommandPaletteUI
