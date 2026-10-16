// DOM elements
const masterSwitchCheckbox = document.getElementById("master-switch-checkbox");
const gformsWhitelistCheckbox = document.getElementById("whitelist-gforms-checkbox");
const claudeWhitelistCheckbox = document.getElementById("whitelist-claude-checkbox");
const apiKeyInput = document.getElementById("gemini-api-key-input");
const generationModeDropdown = document.getElementById("model-speed-dropdown");
const modelOverwritesDropwdown = document.getElementById("model-overwrites-dropdown");
const thinkingLevelDropdown = document.getElementById("thinking-level-dropdown");
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
    const masterSwitch = localStorage.getItem("masterSwitch");
    const whitelistGforms = localStorage.getItem("gformsWhitelist");
    const whitelistClaude = localStorage.getItem("claudeWhitelist");
    const apiKey = localStorage.getItem("geminiApiKey");
    const generationMode = localStorage.getItem("geminiGenerationMode");
    const geminiModel = localStorage.getItem("geminiModel");
    const thinkingLevel = localStorage.getItem("geminiThinkingLevel");
    const geminiUnlockedMode = localStorage.getItem("geminiUnlockSmarter");
    
    if (masterSwitch) masterSwitchCheckbox.checked = (masterSwitch === "true");
    if (whitelistGforms) gformsWhitelistCheckbox.checked = (whitelistGforms === "true");
    if (whitelistClaude) claudeWhitelistCheckbox.checked = (whitelistClaude === "true");
    if (apiKey) apiKeyInput.value = "*".repeat(apiKey.length);
    if (generationMode) generationModeDropdown.value = generationMode;
    if (geminiModel) modelOverwritesDropwdown.value = geminiModel;
    if (thinkingLevel) thinkingLevelDropdown.value = thinkingLevel;
    if (geminiUnlockedMode) smarterModelsCheckbox.checked = (geminiUnlockedMode === "true");
}

// Check items
function checkItems() {
    // Block generation mode dropdown if model overwrites active
    if (modelOverwritesDropwdown.value != "auto") {
        generationModeDropdown.disabled = true;
    } else {
        generationModeDropdown.disabled = false;
    }
}

// Updates local storage with current settings values
function saveSettings() {
    checkItems();

    localStorage.setItem("configured", true);
    localStorage.setItem("masterSwitch", masterSwitchCheckbox.checked);
    localStorage.setItem("gformsWhitelist", gformsWhitelistCheckbox.checked);
    localStorage.setItem("claudeWhitelist", claudeWhitelistCheckbox.checked);
    localStorage.setItem("geminiGenerationMode", generationModeDropdown.value);
    localStorage.setItem("geminiModel", modelOverwritesDropwdown.value);
    localStorage.setItem("geminiThinkingLevel", thinkingLevelDropdown.value);
    localStorage.setItem("geminiUnlockSmarter", smarterModelsCheckbox.checked);
}

apiKeyUpdateStatus(); // Update api key status
updateSettingsUiValues(); // Update settings with local storage values
checkItems();
if (localStorage.getItem("configured") != "true") saveSettings(); // Make initial settings if not configured already

// Add button click listeners
document.getElementById("gemini-api-key-save-btn").addEventListener("click", apiKeySave);
document.getElementById("gemini-api-key-clear-btn").addEventListener("click", apiKeyClear);

// Settings checkbox/dropdowns etc. listeners
masterSwitchCheckbox.addEventListener("change", saveSettings);
gformsWhitelistCheckbox.addEventListener("change", saveSettings);
claudeWhitelistCheckbox.addEventListener("change", saveSettings);
generationModeDropdown.addEventListener("change", saveSettings);
modelOverwritesDropwdown.addEventListener("change", saveSettings);
modelOverwritesDropwdown.addEventListener("change", checkItems);
thinkingLevelDropdown.addEventListener("change", saveSettings);
smarterModelsCheckbox.addEventListener("change", saveSettings);