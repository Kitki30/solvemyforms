// DOM elements
const gformsWhitelistCheckbox = document.getElementById("whitelist-gforms-checkbox");
const claudeWhitelistCheckbox = document.getElementById("whitelist-claude-checkbox");
const apiKeyInput = document.getElementById("gemini-api-key-input");
const generationModeDropdown = document.getElementById("model-speed-dropdown");
const debugGenCheckbox = document.getElementById("model-debug-checkbox");
const smarterModelsCheckbox = document.getElementById("model-smarter-checkbox");

const statusText = document.getElementById("gemini-status-text");
const popup = document.getElementById("popup");

// Save gemini api key to local storage
function apiKeySave() {
    const apiKey = apiKeyInput.value;
    localStorage.setItem("geminiApiKey", apiKey);
    alert("Your key has been set!");
    apiKeyUpdateStatus();
}

// Clear gemini api key from local storage
function apiKeyClear() {
    localStorage.removeItem("geminiApiKey");
    alert("Your key has been removed from local storage!");
    apiKeyUpdateStatus();
}

// Set gemini api status text if its in local storage
function apiKeyUpdateStatus() {
    if (localStorage.getItem("geminiApiKey")) {
        statusText.innerText = "API key set";
        statusText.style.color = "lightgreen";
        popup.style.display = "none";
    } else {
        statusText.innerText = "API key not set";
        statusText.style.color = "red";
        popup.style.display = "block";
    }
}

// Update settings values with local storage vars
function updateSettingsUiValues() {
    const whitelistGforms = localStorage.getItem("whitelistGforms");
    const whitelistClaude = localStorage.getItem("whitelistClaude");
    const apiKey = localStorage.getItem("geminiApiKey");
    const generationMode = localStorage.getItem("geminiGenerationMode");
    const geminiDebugMode = localStorage.getItem("geminiDebug");
    const geminiUnlockedMode = localStorage.getItem("geminiUnlockSmarter");
    
    if (whitelistGforms) gformsWhitelistCheckbox.checked = (whitelistGforms === "true");
    if (whitelistClaude) claudeWhitelistCheckbox.checked = (whitelistClaude === "true");
    if (apiKey) apiKeyInput.value = "*".repeat(apiKey.length);
    if (generationMode) generationModeDropdown.value = generationMode;
    if (geminiDebugMode) debugGenCheckbox.checked = (geminiDebugMode === "true");
    if (geminiUnlockedMode) smarterModelsCheckbox.checked = (geminiUnlockedMode === "true");
}

// Updates local storage with current settings values
function saveSettings() {
    localStorage.setItem("whitelistGforms", gformsWhitelistCheckbox.checked);
    localStorage.setItem("whitelistClaude", claudeWhitelistCheckbox.checked);
    localStorage.setItem("geminiGenerationMode", generationModeDropdown.value);
    localStorage.setItem("geminiDebug", debugGenCheckbox.checked);
    localStorage.setItem("geminiUnlockSmarter", smarterModelsCheckbox.checked);
}

apiKeyUpdateStatus(); // Update api key status
updateSettingsUiValues(); // Update settings with local storage values

// Add button click listeners
document.getElementById("gemini-api-key-save-btn").addEventListener("click", apiKeySave);
document.getElementById("gemini-api-key-clear-btn").addEventListener("click", apiKeyClear);

// Settings checkbox/dropdowns etc. listeners
gformsWhitelistCheckbox.addEventListener("change", saveSettings);
claudeWhitelistCheckbox.addEventListener("change", saveSettings);
generationModeDropdown.addEventListener("change", saveSettings);
debugGenCheckbox.addEventListener("change", saveSettings);
smarterModelsCheckbox.addEventListener("change", saveSettings);