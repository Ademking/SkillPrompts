import cssText from "data-text:~style.css"
import { useEffect, useMemo, useRef, useState } from "react"

import { Storage } from "@plasmohq/storage"
import CommandPalette from "./components/CommandPalette"
import { VariableModal } from "./components/VariableModal"
import type { PlasmoCSConfig } from "plasmo"

const styleElement = document.createElement("style")

export const config: PlasmoCSConfig = {
  matches: ["https://chat.openai.com/*", "https://chatgpt.com/*"]
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

function extractVariables(template: string): string[] {
  const matches = template.match(/\{\{(\w+)\}\}/g)
  if (!matches) return []
  return [...new Set(matches.map(m => m.slice(2, -2)))]
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
  const hiddenMenuRef = useRef<HTMLElement | null>(null)
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
      // diagnostics
      console.debug("highlightExistingCommands: supportsHighlights=", supportsHighlights, "storedCommands=", storedCommands)

      if (storedCommands.length === 0) {
        if (supportsHighlights) (CSS as any).highlights.delete("command-insert")
        highlightedRangesRef.current = []
        // unwrap any fallback spans
        document.querySelectorAll("span.command-insert-fallback").forEach((s) => s.replaceWith(document.createTextNode(s.textContent || "")))
        return
      }

      const contentEditables = getAllContentEditables()
      console.debug("highlightExistingCommands: contentEditables found=", contentEditables.length)

      // Build ranges for CSS.highlights if available
      if (supportsHighlights) {
        const ranges: Range[] = []

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
                ranges.push(range)

                startIdx = idx + template.length
                idx = text.indexOf(template, startIdx)
              }
            }
          }

        })

        if (ranges.length > 0) {
          highlightedRangesRef.current = ranges
          try {
            const highlight = new Highlight(...ranges)
              ; (CSS as any).highlights.set("command-insert", highlight)
            return
          } catch (err) {
            console.error("Highlight API failed, falling back to span wrapper:", err)
          }
        }

        // No matches found — clear any stale CSS highlights
        ; (CSS as any).highlights.delete("command-insert")
        highlightedRangesRef.current = []
      }

      // Fallback: wrap matched tokens in span.command-insert-fallback
      try {
        ignoreMutationsRef.current = true
        contentEditables.forEach((element: Element) => {
          // unwrap existing fallback spans first
          element.querySelectorAll("span.command-insert-fallback").forEach((s) => s.replaceWith(document.createTextNode(s.textContent || "")))

          // Collect all matches: {textNode, startIdx, endIdx, label}
          const matches: Array<{ node: Text, start: number, end: number, label: string }> = []
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
                matches.push({ node: textNode, start: idx, end: idx + template.length, label: cmd.label })
                startIdx = idx + template.length
                idx = text.indexOf(template, startIdx)
              }
            }
          }
          console.debug(`highlightExistingCommands fallback: ${matches.length} matches found in ${(element as any).tagName || 'unknown'}`)


          // Apply wrapping: rebuild each text node with matches
          const byNode = new Map<Text, Array<{ start: number, end: number }>>()
          for (const match of matches) {
            if (!byNode.has(match.node)) byNode.set(match.node, [])
            byNode.get(match.node)!.push({ start: match.start, end: match.end })
          }

          for (const [textNode, nodeMatches] of byNode) {
            const parent = textNode.parentNode
            if (!parent) continue

            const fullText = textNode.nodeValue || ""
            const sortedMatches = nodeMatches.sort((a, b) => a.start - b.start) // forward order for building

            // Build fragments: [{type:'text'|'span', content, start?, end?}]
            const fragments: Array<{ type: string, content: string, start?: number, end?: number }> = []
            let lastIdx = 0

            for (const match of sortedMatches) {
              if (match.start > lastIdx) {
                fragments.push({ type: 'text', content: fullText.slice(lastIdx, match.start) })
              }
              fragments.push({ type: 'span', content: fullText.slice(match.start, match.end), start: match.start, end: match.end })
              lastIdx = match.end
            }

            // Add remaining text
            if (lastIdx < fullText.length) {
              fragments.push({ type: 'text', content: fullText.slice(lastIdx) })
            }

            // Build new nodes and insert before old textNode
            for (const frag of fragments) {
              if (frag.type === 'text' && frag.content) {
                parent.insertBefore(document.createTextNode(frag.content), textNode)
              } else if (frag.type === 'span') {
                const span = document.createElement("span")
                span.className = "command-insert-fallback"
                span.textContent = frag.content
                // Apply inline styles as backup (in case CSS class doesn't work in shadow DOM)
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
                parent.insertBefore(span, textNode)
              }
            }

            // Remove old text node
            parent.removeChild(textNode)
          }

          if (matches.length > 0) console.debug(`fallback wrapped ${byNode.size} node(s) with ${matches.length} span(s)`)
        })
      } finally {
        ignoreMutationsRef.current = false
      }
    } catch (error) {
      console.error("Failed to highlight existing commands (unexpected):", error)
    }
  }

  highlightRef.current = highlightExistingCommands

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
          result = result.replace(new RegExp(`\\{\\{${vName}\\}\\}`, "g"), val)
        }
        result = result.replace(/\{\{\w+\}\}/g, "")
      }

      return result
    }

    const replaceText = (text: string) => {
      let updatedText = text
      for (const cmd of storedCommands) {
        const escapedLabel = cmd.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        const pattern = `\\/${escapedLabel}(?:\\s+\\w+="[^"]*")*\\s*`
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
    console.debug("replaceCommandsWithPrompts: contentEditables found=", contentEditables.length)

    contentEditables.forEach((element) => {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null)
      const nodesToReplace: { node: Text; replacements: { pattern: RegExp; cmd: StoredPrompt }[] }[] = []

      let node
      while ((node = walker.nextNode())) {
        const textNode = node as Text
        const text = textNode.nodeValue || ""
        const replacements: { pattern: RegExp; cmd: StoredPrompt }[] = []

        for (const cmd of storedCommands) {
          const escapedLabel = cmd.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
          const pattern = new RegExp(`\\/${escapedLabel}(?:\\s+\\w+="[^"]*")*\\s*`)
          if (pattern.test(text)) {
            replacements.push({ pattern, cmd })
          }
        }

        if (replacements.length > 0) {
          nodesToReplace.push({ node: textNode, replacements })
        }
      }

      nodesToReplace.forEach(({ node, replacements }) => {
        let newText = node.nodeValue || ""

        for (const { pattern, cmd } of replacements) {
          newText = newText.replace(pattern, (match) => expandCommand(match, cmd.label))
        }

        node.nodeValue = newText
      })
    })
  }
  useEffect(() => {
    if (!hasLoadedCommands) return
    highlightExistingCommands()
  }, [storedCommands, hasLoadedCommands])

  // Expose debug helper to window for manual testing
  useEffect(() => {
    (window as any).__debugHighlight = () => {
      console.log("=== MANUAL HIGHLIGHT DEBUG ===")
      console.log("Stored commands:", storedCommands)
      const editables = getAllContentEditables()
      console.log("Contenteditable elements found:", editables.length)
      for (let i = 0; i < editables.length; i++) {
        const el = editables[i]
        console.log(`  [${i}] ${(el as any).tagName}: "${(el.textContent || '').slice(0, 50)}"`)
      }
      const spans = document.querySelectorAll("span.command-insert-fallback")
      console.log("Existing fallback spans:", spans.length)
      highlightExistingCommands()
      setTimeout(() => {
        const spansAfter = document.querySelectorAll("span.command-insert-fallback")
        console.log("Fallback spans after highlight:", spansAfter.length)
        for (let i = 0; i < spansAfter.length; i++) {
          const s = spansAfter[i]
          console.log(`  [${i}] "${s.textContent}" class="${s.className}" style="${s.getAttribute('style')}"`)
          const computed = window.getComputedStyle(s)
          console.log(`      computed bg=${computed.backgroundColor} color=${computed.color}`)
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

  const hideDefaultMenu = () => {
    let attempts = 0

    const tryHide = () => {
      const popoverContainer = Array.from(document.querySelectorAll("div.popover")).find((element) =>
        Boolean(element.querySelector('.__menu-item[tabindex="0"]'))
      ) as HTMLElement | undefined

      if (popoverContainer) {
        hiddenMenuRef.current = popoverContainer
        popoverContainer.style.display = "none"
        return
      }

      if (attempts < 10) {
        attempts += 1
        hideMenuTimeoutRef.current = window.setTimeout(tryHide, 0)
      }
    }

    tryHide()
  }

  const showDefaultMenu = () => {
    if (hideMenuTimeoutRef.current !== null) {
      window.clearTimeout(hideMenuTimeoutRef.current)
      hideMenuTimeoutRef.current = null
    }

    if (hiddenMenuRef.current) {
      hiddenMenuRef.current.style.display = ""
      hiddenMenuRef.current = null
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
          replaceCommandsWithPrompts()
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

          hideDefaultMenu()
          setIsVisible(true)
          setInputValue("")
        }
      }

      if (event.key === "Escape" && isVisible) {
        showDefaultMenu()
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

      showDefaultMenu()
      setIsVisible(false)
    }

    const handleSendAction = () => {
      replaceCommandsWithPrompts()
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
    showDefaultMenu()
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
              {hasLoadedCommands && (
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
