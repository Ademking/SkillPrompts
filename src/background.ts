export {}

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

// when the extension is installed, open the welcome page
chrome.runtime.onInstalled.addListener(() => {
  const url = "https://skillprompts.surge.sh/"
  chrome.tabs.create({ url })
})
