// Prompt helper to not rewrite same things again
import { sendPrompt } from "../libs/prompter.js";

// Sends prompt with user preferences
export async function sendPromptUserPrefer(prompt){
    // Get generation options
    const debugMode = localStorage.getItem("geminiDebug"); // Uses gemini-3.5-flash-lite for faster development
    const unlockedMode = localStorage.getItem("geminiUnlockSmarter"); // Unlocks smarter models
    const genMode = localStorage.getItem("geminiGenerationMode"); // Always checks for smarter models
    console.log(
        "User options:"
        + "\nDebug mode: " + debugMode
        + "\nUnlocked: " + unlockedMode
        + "\nGeneration mode: " + genMode
    )

    // Ask AI
    let response;

    // Debug mode generation
    if (debugMode == "true") {
        response = await sendPrompt(
            localStorage.getItem("geminiApiKey"),
            prompt,
            {
                model: "gemini-3.5-flash-lite"
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
                unlocked: (unlockedMode === "true")
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
    if (response.error_code == "MODELS_UNAVAILABLE") noticeText = "All Gemini models are currently unavailable! Try again later.";
    if (response.error_code == "MODELS_RATELIMITTED") noticeText = "All Gemini models are currently rate limitted! Try again later.";

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