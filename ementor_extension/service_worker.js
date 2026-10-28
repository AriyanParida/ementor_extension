console.log("service_worker.js loaded");

const API_KEY = "AQ.Ab8RN6Lw6k5MLjqffDwJL7zfBweFLJFjTn1frCmssZzxNpyeYQ";

const API_URL =
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";


chrome.runtime.onMessage.addListener((message, sender) => {

    if (message.type !== "Action Result") {
        return;
    }

    const problem = message.data.problem;
    const action = message.data.action;
    const prompt = message.data.prompt;

    console.log("TITLE:", problem.title);
    console.log("ACTION:", action);
    console.log("PROMPT:", prompt);

    generateAIResponse(problem, action, prompt);
});


async function generateAIResponse(problem, action, prompt) {

    try {

        const result = await chrome.storage.local.get([
            "lastAnalysis",
            "conversations"
        ]);

        let conversations = result.conversations || {};

        const problemKey = problem.title;

        if (!conversations[problemKey]) {
            conversations[problemKey] = [];
        }

        const history = conversations[problemKey];

        const previousResponse =
            history.length > 0
                ? history[history.length - 1].response
                : "No previous AI response.";

        console.log("CURRENT PROBLEM:", problemKey);
        console.log("CURRENT HISTORY:", history);
        console.log("PREVIOUS RESPONSE:", previousResponse);
        console.log("CURRENT PROMPT:", prompt);

        let aiPrompt = "";

        if (action === "Analyze") {

            aiPrompt = `
                You are an AI coding mentor.

                Problem:
                ${problem.title}

                Description:
                ${problem.description}

                Code:
                ${problem.code}

                Analyze the code and explain:

                1. What the code is doing
                2. Whether it is correct
                3. Any bugs or issues
                4. How the code could be improved

                Keep the explanation clear and useful for a student.
            `;

        }

        else if (action === "Hint") {

            aiPrompt = `
                You are an AI coding mentor.

                Problem:
                ${problem.title}

                Description:
                ${problem.description}

                Code:
                ${problem.code}

                Give the student a helpful hint about how to approach this problem.

                Do NOT provide the complete solution.
                Do NOT write the final code.
                Do NOT directly reveal the answer.

                Instead:

                1. Point out the key concept they should think about.
                2. Identify where their current approach may be going wrong.
                3. Give a small directional hint that helps them figure it out themselves.

                Keep the hint concise and educational.
            `;

        }

        else if (action === "Ask") {

            aiPrompt = `
                You are a cool AI coding mentor.

                Problem:
                ${problem.title}

                Description:
                ${problem.description}

                Code:
                ${problem.code}

                Previous AI response:
                ${previousResponse}

                User question:
                ${prompt}

                Answer the user's question clearly and helpfully.

                Use the previous AI response as context when it is relevant.
            `;

        }

        else {

            chrome.runtime.sendMessage({
                type: "AI Error",
                data: "Unknown action requested."
            });

            return;
        }


        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },

            body: JSON.stringify({

                model: "gemini-3.6-flash",

                messages: [
                    {
                        role: "user",
                        content: aiPrompt
                    }
                ]

            })

        });


        const responseText =
            await response.text();


        if (!response.ok) {

            throw new Error(
                `API request failed with status ${response.status}`
            );

        }


        const data =
            JSON.parse(responseText);


        const answer =
            data.choices?.[0]?.message?.content;


        if (!answer) {

            chrome.runtime.sendMessage({
                type: "AI Error",
                data: "The AI didn't return a response. Please try again."
            });

            return;
        }


        // Save the new action to this problem's history

        conversations[problemKey].push({

            action,
            prompt,
            response: answer

        });


        await chrome.storage.local.set({

            conversations

        });


        // Keep lastAnalysis for your existing Prev Action feature

        await chrome.storage.local.set({

            lastAnalysis: {

                action,
                problem,
                prompt,
                response: answer

            }

        });


        chrome.runtime.sendMessage({

            type: "AI Response",
            data: answer

        });

    }

    catch (error) {

        console.error(
            "Gemini request failed:",
            error
        );

        chrome.runtime.sendMessage({

            type: "AI Error",
            data: error.message

        });

    }

}