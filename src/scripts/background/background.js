// Main background script for Solve my forms extension
import { handleClick } from "./handle_click.js";
import { handleContextMenu } from "./handle_context_menus.js";
const bgScripts = ["gforms", "claude"]; // Whitelist of background scripts

// Handle messages
async function handleMessage(message, sender) {
    // Get active tab id
    let tabId = sender.tab.id;

    // Question clicks
    if (message.msgType == "question_clicked") {
        handleClick(message, tabId);
    }
    // Ready messages
    else if (message.msgType == "ready") {
        // Check whitelist statuses
        const masterSwitch = (localStorage.getItem("masterSwitch") === "true");
        const whitelistStatus = (localStorage.getItem(message.scriptName + "Whitelist") === "true");

        if (masterSwitch && whitelistStatus && bgScripts.includes(message.scriptName)) {
            browser.tabs.sendMessage(
                tabId,
                {
                    msgType: "init"
                }
            )
        }
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