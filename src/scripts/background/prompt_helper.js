// Prompt helper to not rewrite same things again
import { sendPrompt } from "../libs/prompter.js";

// Sends prompt with user preferences
export async function sendPromptUserPrefer(prompt){
    // Get generation options
    const modelOverwrites = localStorage.getItem("geminiModel"); // User selected model
    const unlockedMode = localStorage.getItem("geminiUnlockSmarter"); // Unlocks smarter models
    const genMode = localStorage.getItem("geminiGenerationMode"); // Always checks for smarter models
    const thinkingLevel = localStorage.getItem("geminiThinkingLevel"); // User selected thinking level
    console.log(
        "User options:"
        + "\nModel: " + modelOverwrites
        + "\nUnlocked: " + unlockedMode
        + "\nGeneration mode: " + genMode
        + "\nThinking level: " + thinkingLevel
    )

    // Ask AI
    let response;

    // Debug mode generation
    if (modelOverwrites != "auto") {
        response = await sendPrompt(
            localStorage.getItem("geminiApiKey"),
            prompt,
            {
                model: modelOverwrites,
                thinkingLevel: thinkingLevel
            }
        );
    }
    // Normal generation
    else {
        response = await sendPrompt(
            localStorage.getItem("geminiApiKey"),
            prompt,
            {
                smarter: (genMode == "smarter"),
                unlocked: (unlockedMode === "true"),
                thinkingLevel: thinkingLevel
            }
        );
    }

    return response;
}

// Helper for easier sending of API error popups to tabs
export function sendErrorPopup(response, tabId) {
    console.log(response);
    let noticeText = "Gemini API Error";
    if (response.error_code == "API_KEY_INVALID") noticeText = "Your Gemini API Key is invalid. Please enter it in settings.";
    if (response.error_code == "MODELS_UNAVAILABLE") noticeText = "All Gemini models are currently unavailable! Try again later, or change your settings.";
    if (response.error_code == "MODELS_RATELIMITTED") noticeText = "All Gemini models are currently rate limitted! Try again later, or change your settings.";

    browser.tabs.sendMessage(
        tabId,
        {
            msgType: "popup",
            msg: noticeText,
            color: "red",
            textColor: "black"
        }
    );
}