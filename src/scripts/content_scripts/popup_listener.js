// Popup message listener for Solve my forms extension
let lastPopup;

function deleteErrPopup() {
    if (lastPopup) {
        lastPopup.remove();
        lastPopup = null;
    }
}

function onMessage(message) {
    if (message.msgType == "popup") {
        console.log("Got response from background script.\n", message.msg);
        if (lastPopup) {
            lastPopup.remove();
        }
        
        lastPopup = document.createElement("div");

        // Popup styling
        lastPopup.style.zIndex = 9999;
        lastPopup.style.backgroundColor = message.color;
        lastPopup.style.color = message.textColor;
        lastPopup.style.position = "fixed";
        lastPopup.style.bottom = "0";
        lastPopup.style.left = "0";
        lastPopup.style.width = "100%";
        lastPopup.style.maxHeight = "30%";
        lastPopup.style.padding = "10px";
        lastPopup.style.fontFamily = "Arial, Helvetica, Sans-serif"
        lastPopup.style.textWrap = "wrap";
        document.body.appendChild(lastPopup);

        const popup_text = document.createElement("p");
        popup_text.style.marginBlock = "2px";
        popup_text.style.margin = "0px";
        popup_text.style.fontSize = "20px";
        popup_text.innerText = message.msg;
        lastPopup.appendChild(popup_text);
    
        lastPopup.addEventListener('dblclick', (event) => {
            deleteErrPopup();
        });
        setTimeout(deleteErrPopup, 3000);
    }
}

browser.runtime.onMessage.addListener(onMessage);