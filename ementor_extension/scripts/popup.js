const analyzeButton = document.querySelector(".analyze-button");
const loading = document.querySelector("#loading");
const responseSection = document.querySelector("#responseSection");
const responseContent = document.querySelector("#responseContent");
const errorMessage = document.querySelector("#errorMessage");
const previousAnalysisButton = document.querySelector("#previousAnalysisButton");
const hintButton =document.querySelector("#hintButton");
const askButton = document.querySelector("#askButton");
const sendAskButton = document.querySelector("#sendAskButton");
const askSection = document.querySelector("#askSection");
const questionInput = document.querySelector("#questionInput");
const askMentorButton = document.querySelector("#sendAskButton");
const responseTitle = document.querySelector("#responseTitle");
let activeButton = null;
let isProcessing = false;

// ANALYZE BUTTON

analyzeButton.addEventListener("click", () => {

    activeButton = analyzeButton;

    responseSection.hidden = true;
    errorMessage.hidden = true;
    loading.hidden = false;

    analyzeButton.disabled = true;

    doAction("Analyze");

});


// HINT BUTTON

hintButton.addEventListener("click", () => {

    activeButton = hintButton;

    responseSection.hidden = true;
    errorMessage.hidden = true;
    loading.hidden = false;

    hintButton.disabled = true;

    doAction("Hint");

});

// PREVIOUS ANALYSIS

previousAnalysisButton.addEventListener("click", () => {

    if (!responseSection.hidden) {

        responseSection.hidden = true;

        return;
    }

    chrome.storage.local.get("lastAnalysis", (result) => {

        if (result.lastAnalysis) {


            responseTitle.textContent = `PREVIOUS ${result.lastAnalysis.action.toUpperCase()}`;
            responseSection.hidden = false;
            responseContent.innerText =result.lastAnalysis.response;

        }
        else {
            errorMessage.hidden = false;
            errorMessage.textContent = "No previous action yet!";
        }

    });

});

// ASK BUTTON

askButton.addEventListener("click", () => {

    askSection.hidden = false;
    askButton.disabled = true;

});

//ASK MENTOR BUTTON

askMentorButton.addEventListener("click", () => {

    const question = questionInput.value.trim();

    if (!question) {
        errorMessage.hidden = false;
        errorMessage.textContent = "Ask anything about your problem or code!";
        return;
    }

    activeButton = sendAskButton;

    responseSection.hidden = true;
    errorMessage.hidden = true;
    loading.hidden = false;

    askMentorButton.disabled = true;
    doAction("Ask", question);


});


// PERFORM ACTION

function doAction(action, prompt = "") {

     if (isProcessing) {
        return;
    }

    isProcessing = true;


    chrome.tabs.query(
        { active: true, currentWindow: true },
        (tabs) => {

            chrome.tabs.sendMessage(
                tabs[0].id,
                { type: "Gather Info" },
                (response) => {

                    if (!response) {

                        loading.hidden = true;

                        errorMessage.hidden = false;

                        errorMessage.textContent =
                            "Problem data isn't ready yet. Please wait for the page to load and try again. T_T";

                        activeButton.disabled = false;
                        isProcessing = false;

                        return;
                    }

                    chrome.runtime.sendMessage({

                        type: "Action Result",
 
                        data: {
                            problem: response,
                            action,
                            prompt
                        }

                    });

                }
            );

        }
    );

}

// RECEIVE AI RESPONSE / ERROR

chrome.runtime.onMessage.addListener((message, sender) => {

    if (message.type === "AI Response") {

        loading.hidden = true;
        responseSection.hidden = false;
        responseContent.textContent = message.data;
        activeButton.disabled = false;
        questionInput.value = "";
        isProcessing = false;

    }

    else if (message.type === "AI Error") {

        loading.hidden = true;
        errorMessage.hidden = false;
        errorMessage.textContent = message.data;
        activeButton.disabled = false;
        isProcessing = false;


    }

});