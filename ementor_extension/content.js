console.log("CONTENT SCRIPT WORKS!");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message.type === "Gather Info") {

        const data = extractProblem();

        sendResponse(data);

    }

});

function extractProblem() {

    const data = {

        title: document.title,

        description:
            document.querySelector('[data-track-load="description_content"]')?.innerText?.trim() ||
            document.querySelector('[data-qd-rendered-description]')?.innerText?.trim() ||
            document.querySelector('div[data-track-load="description_content"]')?.innerText?.trim() ||
            document.querySelector('div[data-qd-rendered-description]')?.innerText?.trim() ||
            document.querySelector('.HTMLContent_html__00ZLp')?.innerText?.trim() ||
            null,

        code: document
            .querySelector(".view-lines.monaco-mouse-cursor-text")
            ?.innerText

    };

    if (!data.title || !data.description) {
        return null;
    }

    return data;
}
