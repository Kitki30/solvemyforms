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

const questionContainerClass = "q"; // Class of whole question container
const questionClass = "qt"; // Question 'div' tag class

const optionClass = "opt"; // Only single select questions seem to exists while generating quizes, they seem to use 'opt' tags without IDs

// Script
let questionQueue = [];

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
    const questions = document.getElementsByClassName(questionContainerClass);
    return questions;
}

/*
 * Resolves question items
*/
function resolveQuestion(question) {
    let questionText = question.getElementsByClassName(questionClass);

    if (questionText.length != 0) {
        console.warn("Question text element not found!");
        return { error: true }
    }

    questionText = questionText[0].textContent; // Resolve text from element

    // Resolve elements - variables
    let answers = [];

    // Resolve elements - Single/Multi selects
    const answersSingle = question.getElementsByClassName(optionClass);
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
    if (message.msgType == "select_radio") {
        console.log("Got click message from background script");
        const radio = document.getElementById(message.msg);

        if (!radio) {
            console.warn("Couldn't find id " + message.msg);
            return;
        }

        // Click it
        radio.click();
    }
}

// Subscribe to messages
browser.runtime.onMessage.addListener(onMessageCallback);

// Subcribe to onclick event for all questions
const questions = getQuestions();
for (let i = 0; i < questions.length; i++) {
    const questionSpan = questions[i].getElementsByClassName(questionClass);

    if (questionSpan.length != 1) {
        console.warn("No questions found");
        continue;
    } 

    questionSpan[0].addEventListener("dblclick", () => {sendQuestionCallback(questions[i])});
    console.log("Added question double click listener");
}
console.log("Init done")