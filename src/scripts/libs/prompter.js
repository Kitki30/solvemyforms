// Prompt + API helper for Solve my forms
// Can be used in other scripts too, may require modifications tho

// Models list, script will go from top one to bottom on errors
// modelsFull - All models at cost of time for free users (because they are not available most of the time)
// models - All resonable models for free users
const modelsFull = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
]
const models = [
    "gemini-3.6-flash",
    "gemini-3.5-flash-lite"
]
const apiURL = "https://generativelanguage.googleapis.com/v1beta";

// Model cache
let lastSuccessModel = parseInt(sessionStorage.getItem("geminiLastSuccess")); // Last model that successfully replied
let generationCount = parseInt(sessionStorage.getItem("geminiGenCount")); // To reset lastSuccessModel every 5 gens
let lastResetTime = parseInt(sessionStorage.getItem("geminiLastResetTime")); // Timestamp of last counter reset, to reset lastSuccessModel every 30 minutes
let lastUnlocked = (sessionStorage.getItem("geminiLastUnlocked") === "true"); // If last generation type was unlocked, reset lastSuccessModel if other generation type

/*
 * Sends prompt to gemini API
 *
 * apiKey - your gemini API key
 * input - your prompt
 * model - specify model you want to use here, if empty, uses smart model selection
 * smarter:
 *  - true - Sends requests from smartest to dumbest (top to bottom of 'models' list)
 *  - false - Sends requests with priority to model that succeded generation before (To speed up gen if other ones are unavailable)
 * unlocked - uses modelsFull instead of models list
*/
export async function sendPrompt(apiKey, input, { model=null, thinkingLevel=null, smarter=false, unlocked=false }) {
    // Define models used for this generation
    let usedModels;
    if (model) {
        usedModels = [model]; // Users custom model
    } else if (unlocked) {
        usedModels = modelsFull; // Full model list
    } else {
        usedModels = models; // Base model list
    }
    
    // Define starting index
    let startingIndex = 0;

    // Try to use lastSuccessModel for index if smarter flag is false
    if (!smarter && model == null) {
        // Use lastSuccessModel for index if not expired
        if (generationCount < 5 && Date.now() < (lastResetTime + (30 * 60 * 1000)) && lastUnlocked == unlocked) { 
            if (lastSuccessModel) {
                startingIndex = lastSuccessModel;
            }
        } else {
            generationCount = 0; // Reset gen count when expired
            /*
             * Model cache expiration reasons:
             * 1. Last reset was 30 minutes ago or more (lastResetTime)
             * 2. Last reset was 5 generations ago (generationCount)
             * 3. Models were recently unlocked/blocked (lastUnlocked)
            */

            // Set last reset timestamps
            lastResetTime = Date.now();
            sessionStorage.setItem("geminiLastResetTime", lastResetTime);
        }
    }

    // Define thinking level
    let thinkingLevelInternal = "THINKING_LEVEL_UNSPECIFIED"; // Default for model
    if (thinkingLevelInternal) {
        thinkingLevelInternal = thinkingLevel;
    }

    // Increase generation counter and set timestamp of last generation
    generationCount++;
    sessionStorage.setItem("geminiGenCount", generationCount);

    // Set last unlock mode
    lastUnlocked = unlocked;
    sessionStorage.setItem("geminiLastUnlocked", lastUnlocked);

    // Loop incase one model fails
    for (let i = startingIndex; i < usedModels.length; i++) {
        const modelName = usedModels[i];
        console.log("Trying generation with", modelName);

        // Ask AI
        const response = await fetch(
            apiURL + "/models/" + modelName + ":generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-goog-api-key": String(apiKey)
                },
                body: JSON.stringify({
                    "contents": [
                        {
                            "parts": [
                                {
                                    "text": String(input)
                                }
                            ]
                        }
                    ],
                    "generationConfig": {
                        "thinkingConfig": {
                            "includeThoughts": true,
                            "thinkingLevel": thinkingLevelInternal
                        }
                    }
                })
            }
        )

        // Check if errored out
        if (response.status != 200) {
            // Error 400 - Unauthorized (Invalid api key)
            if (response.status == 400) {
                return { 
                    error: true,
                    error_msg: "Invalid Gemini API Key!",
                    error_code: "API_KEY_INVALID"
                }
            }
            // Error 503 - Model has high demand
            else if (response.status == 503) {
                console.log("Model has high demand! Skipping...");
                
                // Return if last model on the list
                if (i + 1 == usedModels.length) {
                    return {
                        error: true,
                        error_msg: "No models are currently free",
                        error_code: "MODELS_UNAVAILABLE"
                    }
                }
                continue;
            }
            // Error 429 - Rate limit
            else if (response.status == 429) {
                console.log("Model ratelimitted");

                // Return if last model on the list
                if (i + 1 == usedModels.length) {
                    return {
                        error: true,
                        error_msg: "All models rate limitted",
                        error_code: "MODELS_RATELIMITTED"
                    }
                }
                continue;
            }
            // Error 404 - Model not found
            else if (response.status == 404) {
                console.log("Model not found");

                // Return if last model on the list
                if (i + 1 == usedModels.length) {
                    return {
                        error: true,
                        error_msg: "Model not found",
                        error_code: "MODEL_NOT_FOUND"
                    }
                }
                continue;
            }

            console.warn(
                "Gemini API error:\n"
                + "Request URL: " + response.url + "\n"
                + "Status code: " + response.status + "\n"
                + "Json: " + (await response.text()).toString()
            )
            continue;
        }

        // Set last successful model
        lastSuccessModel = i;
        sessionStorage.setItem("geminiLastSuccess", lastSuccessModel);
        console.log("Generation succeded with model", modelName)

        const json = await response.json();
        const parts = json.candidates[0].content.parts;
        let responseText;

        // Iterate through parts until normal text found
        for (let j = 0; j < parts.length; j++) {
            if (parts[j].thought == true) {
                console.debug("AI thought:\n" + parts[j].text);
            }  else {
                responseText = parts[j].text;
                console.debug("AI response:\n" + responseText);
                break;
            }
        }

        return {
            error: false,
            response: responseText,
            model: modelName
        };
    }

    // Return generic error if didn't return from the loop
    return {
        error: true,
        error_name: "Could not generate a response!",
        error_code: "COULD_NOT_GEN"
    }
}