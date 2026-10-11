// Context menu displaying helper for Solve my forms
let lastAiPopup;

function onMessage(message) {
    if (message.msgType == "context_menu_response") {
        console.log("Got response from background script.\n", message.msg);
        if (lastAiPopup) {
            lastAiPopup.remove();
        }
        
        lastAiPopup = document.createElement("div");

        // Popup styling
        lastAiPopup.style.zIndex = 9999;
        lastAiPopup.style.backgroundColor = "black";
        lastAiPopup.style.color = "lightgray";
        lastAiPopup.style.position = "fixed";
        lastAiPopup.style.bottom = "0";
        lastAiPopup.style.left = "50%";
        lastAiPopup.style.transform = "translateX(-50%)";
        lastAiPopup.style.maxHeight = "50%";
        lastAiPopup.style.padding = "20px";
        lastAiPopup.style.borderRadius = "10px";
        lastAiPopup.style.fontFamily = "Arial, Helvetica, Sans-serif"
        lastAiPopup.style.textWrap = "wrap";
        document.body.appendChild(lastAiPopup);

        const popup_header = document.createElement("h4");
        popup_header.style.marginBlock = "5px";
        popup_header.style.margin = "0px";
        popup_header.style.fontSize = "20px";
        popup_header.style.color = "gray";
        popup_header.innerText = "AIs Response:";
        lastAiPopup.appendChild(popup_header);

        const popup_text = document.createElement("p");
        popup_text.style.marginBlock = "2px";
        popup_text.style.margin = "0px";
        popup_text.style.fontSize = "18px";
        popup_text.innerText = message.msg;
        lastAiPopup.appendChild(popup_text);

        const popup_footer = document.createElement("h5");
        popup_footer.style.marginBlock = "5px";
        popup_footer.style.margin = "0px";
        popup_footer.style.fontSize = "14px";
        popup_footer.style.color = "gray";
        popup_footer.innerText = "Brought to you by Solve my Forms extension";
        lastAiPopup.appendChild(popup_footer);
    
        lastAiPopup.addEventListener('dblclick', (event) => {
            if (lastAiPopup) {
                lastAiPopup.remove();
                lastAiPopup = null;
            }
        });
    }
}

browser.runtime.onMessage.addListener(onMessage);