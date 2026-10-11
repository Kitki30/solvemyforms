// Context menu handler for Solve my forms background script
import { sendPromptUserPrefer, sendErrorPopup } from "./prompt_helper.js";

// Load system prompt
let systemPrompt;
(async () => {
    const request = await fetch(browser.runtime.getURL("prompts/prompt_context.txt"));
    systemPrompt = await request.text();
})();

export async function handleContextMenu(message, tabId) {
    console.log("Got question from context menu!");

    // Ask AI
    const prompt = systemPrompt.replace("%question%", message);
    const response = await sendPromptUserPrefer(prompt);

    // Send response to content script
    if (!response.error) {
        browser.tabs.sendMessage(
            tabId,
            {
                msgType: "context_menu_response",
                msg: response.response
            }
        )
    }
    // If errored out, send error notice
    else {
        sendErrorPopup(response, tabId);
    }
}