// Main background script for Solve my forms extension
import { handleClick } from "./handle_click.js";
import { handleContextMenu } from "./handle_context_menus.js";

// Handle messages
async function handleMessage(message) {
    // Get active tab id
    let tabId; 
    tabId = (await browser.tabs.query({ active: true, currentWindow: true }))[0].id;

    // Question clicks
    if (message.msgType == "question_clicked") {
        handleClick(message, tabId);
    }
}

// Subscribe to messages from content scripts
browser.runtime.onMessage.addListener(handleMessage)


// Handle context menu
browser.contextMenus.create(
    {
        id: "ask-ai",
        title: "Ask Gemini AI",
        contexts: ["selection"]
    }
);

browser.contextMenus.onClicked.addListener(async (info, tab) => {
    const question = info.selectionText;
    const tabId = tab.id;

    await handleContextMenu(question, tabId);
});