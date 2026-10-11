// Helper script for background worker
// Handles clicks for questions
import { sendErrorPopup, sendPromptUserPrefer } from "./prompt_helper.js";

// Load system prompt
let systemPrompt;
(async () => {
    const request = await fetch(browser.runtime.getURL("prompts/prompt_base.txt"));
    systemPrompt = await request.text();
})();

export async function handleClick(message, tabId) {
    console.log("Got question from content script!");
    const msg = JSON.parse(message.msg); // Because msg is JSON string (to bypass restrictions)

    const formName = message.formName;
    const question = msg.questionText;
    const type = msg.type;

    let questionForAI = 'Q:"' + question + '"'; // Final question format to be in prompt

    // For single/multi selects
    if (type == "single-select" || type == "multi-select") {
        const answers = msg.answers;

        for (let i = 0; i < answers.length; i++) {
            questionForAI += "\n*" + answers[i].id + ':"' + answers[i].answerName + '"';
        }
    }

    questionForAI += "\nT:" + type; // Add type to question
    console.log("Final question for AI:\n" + questionForAI);

    // Prepare prompt
    const prompt = (systemPrompt)
        .replace("%name%", formName)
        .replace("%question%", questionForAI);

    const response = await sendPromptUserPrefer(prompt);

    // Send AIs response to content script
    if (!response.error) {
        // Check if not errored out in response
        if ([
            "\\NOANSWER\\",
            "\\AMBIGOUS\\",
            "\\SAFETY\\",
            "\\LANGUAGE\\",
            "\\USERPREFER\\",
            "\\OTHER\\"
        ].includes(response.response)) {
            let errorMsg = "AI response error (In output)";

            // TODO: Rewrite this to switch
            if (response.response == "\\NOANSWER\\") errorMsg = "AI thinks this question has no answer.";
            if (response.response == "\\AMBIGOUS\\") errorMsg = "AI thinks this question is ambigous.";
            if (response.response == "\\SAFETY\\") errorMsg = "Cannot respond - safety related issue.";
            if (response.response == "\\LANGUAGE\\") errorMsg = "AI could not determine the language of this question.";
            if (response.response == "\\USERPREFER\\") errorMsg = "AI thinks this question depends on your preferences.";
        
            browser.tabs.sendMessage(
                tabId,
                {
                    msgType: "popup",
                    msg: errorMsg,
                    color: "red",
                    textColor: "black"
                }
            )
        }

        // Single select answers
        if (type == "single-select") {
            browser.tabs.sendMessage(
                tabId,
                {
                    msgType: "select_radio",
                    msg: response.response
                }
            );
        }
        // Multi select answers
        else if (type == "multi-select") {
            const answersSplit = response.response.split(";");
            for (let i = 0; i < answersSplit.length; i++) {
                browser.tabs.sendMessage(
                    tabId,
                    {
                        msgType: "select_radio",
                        msg: answersSplit[i]
                    }
                );  
            }
        }
        // Text input answers
        else if (type == "short-text" || type == "long-text") {
            browser.tabs.sendMessage(
                tabId,
                {
                    msgType: "insert_text",
                    elementId: msg.answer.aria_labelledby,
                    msg: response.response
                }
            );  
        }
    }
    // If errored out, send error notice
    else {
        sendErrorPopup(response, tabId);
    }
}