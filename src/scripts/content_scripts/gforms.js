// Content script for Solve my exams, injected into google forms
// TODO: Check this thing one more time after feature drop and rewrite a bit.

/*
 * Class names
 *
 * From what I've seen in the sources of my test form, google obfuscates class names on google forms
 * Because of this we need to get elements from DOM by known class names or role/aria-level attributes
*/
const formNameClass = "F9yp7e ikZYwf LgNcQe"; // Class of form header (containing form name)
const formNameRole = "heading"; // Form header role fallback
const formNameAria = 1; // Form header aria level

const questionContainerClass = "Qr7Oae"; // Class of whole question container

const questionClass = "M7eMe"; // Question 'span' tag class
const questionRole = "heading"; // Question div (parent of the actual question 'span' tag) 'role' attribute as a fallback
const questionAria = 3; // Question div aria level to be used together with role fallback

const answerRadioButtonClass = "Od2TWd hYsg7c"; // Answer (single-select) 
const answerCheckboxClass = "uVccjd aiSeRd FXLARc wGQFbe BJHAP oLlshd"; // Answer (multi-select)
const answerShortTextInputClass = "whsOnd zHQkBf"; // Answer short text input class
const answerLongTextInputClass = "KHxj8b tL9Q4c"; // Answer long text input class

const dropdownFakeListClass = "ry3kXd"; // Dropdowns "fake" hidden list that just opens the dropdown
const dropdownListClass = "OA0qNb ncFHed QXL7Te"; // Thats the correct one, but appears only after oppening the dropdown
const answerDropdownClass = "MocG8c HZ3kWc mhLiyf OIC90c LMgvRb"; // Answer dropdown option class


// Script
let questionQueue = []; // Question queue to not waste tokens multiple times
let initDone = false;

/*
 * Gets form name by:
 * Method 0 - Header of the form
 * Method 1 - <title> tag of the form (default)
*/
function getFormName(method = 1) {
    if (method == 0) {
        // Get elements with class tag of form name header
        const header = document.getElementsByClassName(formNameClass);
        if (header.length == 1) {
            return header[0].textContent;
        }

        // Fallback - get it by role together with aria-level
        console.warn("Form name not found by class! Falling back to aria check")
        const headerAria = document.querySelector(`[role="${formNameRole}"] [aria-level="${formNameAria.toString()}"]`);
        if (headerAria) {
            return headerAria.textContent;
        }

        console.warn("Couln't find any form name header! If you are a developer, please use method=1 for getting the form name");
        return null;
    } else {
        // Get title tag
        const title = document.title;
        return title;
    }
}

/*
 * Gets all questions
*/
function getQuestions() {
    const questions = document.getElementsByClassName(questionContainerClass);
    return questions;
}

/*
 * Resolves question items
*/
function resolveQuestion(question) {
    // Assign ID to the question
    if (!question.id) question.id = Math.random().toString();

    // Find question text
    let questionText = question.getElementsByClassName(questionClass);

    // Fallback to aria check if not found by class
    if (questionText.length != 1) {
        console.warn("Question text not found by class! Falling back to aria check");
        questionText = [question.querySelector(`[role=${questionRole}][aria-level=${questionAria}]`)];
        
        // If still not found, throw an error and return null
        if (questionText.length != 1) {
            console.warn("Question text element not found!");
            return { error: true }
        }
    }

    questionText = questionText[0].textContent; // Resolve text from element

    // Resolve elements - variables
    let answers = [];

    // Resolve elements - Single/Multi selects
    const answersSingle = question.getElementsByClassName(answerRadioButtonClass);
    const answersMulti = question.getElementsByClassName(answerCheckboxClass);
    if (answersSingle.length != 0 || answersMulti.length != 0) {
        // Check type
        let answIter;
        let type;
        if (answersSingle.length != 0 ) {
            answIter = answersSingle;
            type = "single-select";
        } else {
            answIter = answersMulti;
            type = "multi-select";
        }

        // Iterate through possible answers
        for (let i = 0; i < answIter.length; i++) {
            const item = answIter[i];
            const id = item.id;
            const answerName = item.attributes.getNamedItem("aria-label").nodeValue;
            
            answers.push(
                {
                    id: id,
                    answerName: answerName
                }
            )
        };

        return { 
            error: false,
            questionText: questionText,
            answers: answers,
            type: type
        };
    }

    // Resolve elements - Text inputs
    const answersShortText = question.getElementsByClassName(answerShortTextInputClass);
    const answersLongText = question.getElementsByClassName(answerLongTextInputClass);
    if (answersShortText.length != 0 || answersLongText.length != 0) {
        // Check item type
        let item;
        let type;
        if (answersShortText.length != 0) {
            item = answersShortText;
            type = "short-text";
        } else {
            item = answersLongText;
            type = "long-text";
        }
        const aria_labelledby = item[0].attributes.getNamedItem("aria-labelledby").nodeValue;

        return {
            error: false,
            questionText: questionText,
            answer: {
                aria_labelledby: aria_labelledby // It doesn't have ID, but Aria IDs describe it so we can use that
            },
            type: type
        }
    }

    // Resolve elements - Dropdowns
    const dropdownFakeOptsContainers = question.getElementsByClassName(dropdownFakeListClass); // Detect dropdowns
    console.debug(dropdownFakeOptsContainers);
    if (dropdownFakeOptsContainers.length != 0) {

        // Iterate through answers (fake elements)
        const answersDropdown = dropdownFakeOptsContainers[0].getElementsByClassName(answerDropdownClass); // Fake and real options have the same classes
        let answers = [];
        let openId = ""; // ID of first dropdown element, to open the dropdown.
        if (!answersDropdown[0].id) answersDropdown[0].id = Math.random().toString(); // Assign ID as dropdown options don't have them
        openId = answersDropdown[0].id;

        for (let i = 0; i < answersDropdown.length; i++) {
            const answer = answersDropdown[i];

            answers.push({
                answerName: answer.attributes.getNamedItem("data-value").nodeValue
            });
        }

        return {
            error: false,
            questionText: questionText,
            questionId: question.id,
            openId: openId,
            answers: answers,
            type: "dropdown"
        }
    }

    console.warn("Couldn't find any answer elems!")
    return { error: true }
}

/*
 * Deselect multi-select questions
 * To not mix already selected answers with AIs answers
*/
function deselectAnswers(question) {
    for (let i = 0; i < question.answers.length; i++) {
        const answerId = question.answers[i].id;
        const answerCheckbox = document.getElementById(answerId);

        // Deselect only selected
        if (answerCheckbox.attributes.getNamedItem("aria-checked").nodeValue == "true") {
            answerCheckbox.click();
        }
    }
}

/*
 * Callback for onclick question event
 * Gets question object and sends it to background worker
*/
async function sendQuestionCallback(question) {
    console.log("Question clicked, sending to background script");

    // Resolve question
    const questionResolved = resolveQuestion(question);

    // Send message
    if (!questionResolved.error) {
        // If in queue, don't send it again
        if (questionQueue.includes(questionResolved)) {
            console.log("Already in queue! Be patient");
            return;
        }

        questionQueue.push(questionResolved); // Push question to the queue

        // Deselect already selected answers if multi-select type
        if (questionResolved.type == "multi-select") deselectAnswers(questionResolved);

        browser.runtime.sendMessage(
            {
                msgType: "question_clicked",
                formName: getFormName(),
                msg: JSON.stringify(questionResolved) // To bypass data cloning restrictions
            }
        );
    } else {
        console.warn("Resolve question failed")
    }
}

/*
 * Callback for messages
*/
async function onMessageCallback(message) {
    // Radio buttons / checkbox selector
    if (message.msgType == "select_radio" && initDone) {
        console.log("Got click message from background script");
        const radio = document.getElementById(message.msg);

        if (!radio) {
            console.warn("Couldn't find id " + message.msg);
            return;
        }

        // Select only if unchecked (to not deselect checkbox)
        if (radio.attributes.getNamedItem("aria-checked").nodeValue == "false") {
            radio.click();
        }
    }
    // Text inputs
    else if (message.msgType == "insert_text" && initDone) {
        console.log("Got insert text message from background script");
        const input = document.querySelector(`[aria-labelledby="${message.elementId}"]`);

        if (!input) {
            console.warn("Couldn't find input labelled by", message.elementId);
            return;
        }

        input.focus();
        input.select();
        document.execCommand("insertText", false, message.msg); // Do it like this or jscontroller (or something) wont see it and ignore it
    }
    // Dropdowns
    else if (message.msgType == "select_dropdown" && initDone) {
        console.log("Got click message from background script");

        const question = document.getElementById(message.questionId);
        if (!question) {
            console.warn("Couldn't find question!");
            return;
        }

        const dropdownOpener = question.querySelector(`#${CSS.escape(message.openId)}`);

        if (!dropdownOpener) {
            console.warn("Couldn't find dropdown opener");
            return;
        }
        
        // Check if already open (using role attr that disapears when open)
        if (dropdownOpener.attributes.getNamedItem("role").nodeValue == "option") {
            dropdownOpener.click();
        }

        await new Promise(resolve => setTimeout(resolve, 100)); // Wait to give it time to open

        // Find not fake container
        const dropdownOptionCont = question.getElementsByClassName(dropdownListClass);
        console.log(dropdownOptionCont)
        if (dropdownOptionCont.length != 1) {
            console.warn("Couldn't find dropdown option list");
            return;
        }

        // Find option in proper container
        const dropdownOption = dropdownOptionCont[0].querySelector(`[data-value="${message.msg}"][role="option"]`);
        if (!dropdownOption) {
            console.warn("Couldn't find dropdown option");
            return;
        }

        dropdownOption.click();
    } else if (message.msgType == "init" && !initDone) {
        init();
    }
}

// Init from message
function init() {
    // Subcribe to onclick event for all questions
    const questions = getQuestions();
    console.log(questions)
    for (let i = 0; i < questions.length; i++) {
        const questionSpan = questions[i].getElementsByClassName(questionClass);

        if (questionSpan.length != 1) {
            console.warn("No question elements found");
            continue;
        } 

        questionSpan[0].addEventListener("dblclick", () => {sendQuestionCallback(questions[i])});
        console.log("Added question double click listener");
    }

    initDone = true;
    console.log("[Solve my forms] Init done");
}

// Subscribe to messages
browser.runtime.onMessage.addListener(onMessageCallback);

// Send ready message to background script (to check whitelists)
browser.runtime.sendMessage({
    msgType: "ready",
    scriptName: "gforms"
});