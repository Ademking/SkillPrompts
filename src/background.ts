import { Storage } from "@plasmohq/storage"

import libraryPrompts from "~prompts.json"
import type { LibraryPrompt } from "~types"

export {}

const PROMPTS_STORAGE_KEY = "skillprompts_prompts"

const DEFAULT_LABELS = new Set([
  "viral-post",
  "facebook-post",
  "reddit-post",
  "linkedin-post",
  "debug",
  "blog",
  "formalizer",
  "compare",
  "expander",
  "shortener",
  "simplifier",
  "ideas",
  "translate-to",
  "corrector",
  "tldr",
  "explain"
])

async function seedDefaultPrompts() {
  const storage = new Storage({ area: "local" })
  const existing = await storage.get(PROMPTS_STORAGE_KEY)
  if (existing && Array.isArray(existing) && existing.length > 0) return

  const defaults = (libraryPrompts as LibraryPrompt[])
    .filter((p) => DEFAULT_LABELS.has(p.label))
    .map((p, i) => ({
      id: String(Date.now() + i),
      label: p.label,
      description: p.description,
      template: p.prompt
    }))

  if (defaults.length > 0) {
    await storage.set(PROMPTS_STORAGE_KEY, defaults)
  }
}

// firefox does not support chrome.action
// https://stackoverflow.com/questions/70216500/chrome-action-is-undefined-migrating-to-v3-manifest
if (chrome.action != undefined) {
  chrome.action.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage()
  })
} else {
  chrome.browserAction.onClicked.addListener(() => {
    chrome.runtime.openOptionsPage()
  })
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "OPEN_OPTIONS") {
    chrome.runtime.openOptionsPage()
  }
})

// when the extension is installed, open the welcome page and seed default prompts
chrome.runtime.onInstalled.addListener(async () => {
  await seedDefaultPrompts()
  const url = "https://skillprompts.surge.sh/"
  chrome.tabs.create({ url })
})
