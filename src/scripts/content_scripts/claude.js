// Content script for Solve my exams, injected into claude generated tests
// Based on gforms.js

/*
 * Class names
 *
 * These are only my predictions from what i've seen, as claude generated the code every quiz and doesn't use any frameworks.
 * Theese seem to persist after few generations.
 * 
 * TODO: Change them to arrays for better detection
 * I've also have seen that claude likes to store questions and their answers in Q/Q100 variable in javascript, so we can extract it from that in future.
*/

const questionContainerClasses = ["q", "question", "question-container", "question_container"]; // Classes of whole question container
const questionClasses = ["qt", "qtext", "questiontext", "question__text"]; // Question 'div' tag classes

const optionClasses = ["opt", "option", "answer", "question__option", "question__opt"]; // Only single select questions seem to exists while generating quizes, they mostly use 'opt' class, others are my toughts

// Script
let questionQueue = [];
let initDone = false;

/*
 * Gets form name from title tag, as it can change
*/
function getFormName() {
    return document.title;
}

/*
 * Gets all questions
*/
function getQuestions() {
    for (let i = 0; i < questionContainerClasses.length; i++) {
        const questions = document.getElementsByClassName(questionContainerClasses[i]);
        
        if (questions.length != 0) return questions;
    }
    return null;
}

/*
 * Resolves question items
*/
function resolveQuestion(question) {
    let questionText;
    for (let i = 0; i < questionClasses.length; i++) {
        questionText = question.getElementsByClassName(questionClasses[i]);

        if (questionText.length != 1) {
            continue;
        }
        break;
    }

    if (questionText.length != 1) {
        console.warn("Question text element not found!");
        return { error: true }
    }

    questionText = questionText[0].textContent; // Resolve text from element

    // Resolve elements - variables
    let answers = [];

    // Resolve elements - Single/Multi selects
    for (let i = 0; i < optionClasses.length; i++) {
        const answersSingle = question.getElementsByClassName(optionClasses[i]);
        if (answersSingle.length != 0) {
            // Iterate through possible answers
            for (let i = 0; i < answersSingle.length; i++) {
                // Assign ID as it doesnt seem that they have it assigned (in generated code)
                if (!answersSingle[i].id) answersSingle[i].id = Math.random().toString();

                const item = answersSingle[i];
                const id = item.id;
                const answerName = item.textContent;
                
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
                type: "single-select"
            };
        }
    }

    console.warn("Couldn't find any answer elems!")
    return { error: true }
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
function onMessageCallback(message) {
    // Radio buttons / checkbox selector
    if (message.msgType == "select_radio" && initDone) {
        console.log("Got click message from background script");
        const radio = document.getElementById(message.msg);

        if (!radio) {
            console.warn("Couldn't find id " + message.msg);
            return;
        }

        // Click it
        radio.click();
    } else if (message.msgType == "init" && !initDone) {
        init();
    } 
}

// Init on message from bg script (to check whitelists)
async function init() {
    // Subcribe to onclick event for all questions
    // TODO: change 'questionSpan' name to something else, it can be something else than span
    const questions = getQuestions();
    for (let i = 0; i < questions.length; i++) {
        console.debug("Checking question", questions[i]);

        // Iterate through possible classes
        let questionSpan;
        for (let j = 0; j < questionClasses.length; j++) {
            console.debug("Checking class", questionClasses[j]);
            questionSpan = questions[i].getElementsByClassName(questionClasses[j]);

            console.debug("Question texts:", questionSpan);
            if (questionSpan.length != 1) {
                console.debug("Didn't find anything with this class :(");
                continue;
            }
            break;
        }

        // If nothing found in all of the classes, surrender
        if (questionSpan.length != 1) {
            console.warn("No questions found");
            continue;
        }

        questionSpan[0].addEventListener("dblclick", () => {sendQuestionCallback(questions[i])});
        console.log("Added question double click listener");
    }
 
   console.log("[Solve my forms] Init done")   
}

// Subscribe to messages
browser.runtime.onMessage.addListener(onMessageCallback);

// Send ready message to background script (to check whitelists)
browser.runtime.sendMessage({
    msgType: "ready",
    scriptName: "claude"
});