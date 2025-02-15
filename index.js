require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const stringSimilarity = require("string-similarity"); // Import fuzzy matching

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Load university data from JSON
let universityData = {}; 
const jsonFilePath = path.join(__dirname, "university_data.json");

if (fs.existsSync(jsonFilePath)) {
    universityData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));
    console.log("✅ University data loaded successfully.");
} else {
    console.error("❌ ERROR: university_data.json file NOT FOUND!");
}

// Serve the chat interface
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// University Chatbot API (AI-powered)
app.post("/chat", async (req, res) => {
    try {
        let userMessage = req.body.message.toLowerCase();
        console.log("User Message:", userMessage);

        let bestMatchKey = null;
        let bestMatchScore = 0;
        let reply = "Sorry, I couldn't find relevant information. Try asking about admissions, courses, faculty, or fees.";

        // Get the list of available keywords
        const keywords = Object.keys(universityData);

        // Find the best match using fuzzy matching
        const bestMatch = stringSimilarity.findBestMatch(userMessage, keywords);

        if (bestMatch.bestMatch.rating > 0.5) {
            bestMatchKey = bestMatch.bestMatch.target;
            bestMatchScore = bestMatch.bestMatch.rating;
        }

        if (bestMatchKey) {
            let extractedData = universityData[bestMatchKey];

            // If data is an object, format it
            if (typeof extractedData === "object") {
                extractedData = formatResponse(extractedData);
            }

            // 🎯 Step 1: Generate a conversational response using ChatGPT API
            const aiResponse = await getAIResponse(userMessage, extractedData);

            reply = aiResponse;
        }

        console.log("Best Match:", bestMatchKey, "Score:", bestMatchScore);
        console.log("Bot Reply:", reply);

        res.json({ reply });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Helper function to format object responses
function formatResponse(obj) {
    let formattedText = "";
    for (const key in obj) {
        formattedText += `${key.replace(/_/g, " ")}: ${obj[key]}\n`;
    }
    return formattedText.trim();
}

// ✅ Helper function to call OpenAI API for a conversational response
async function getAIResponse(userQuery, extractedData) {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo-1106", // Cheapest GPT-3.5 model
                messages: [
                    { role: "system", content: "You are an AI assistant that provides detailed university information in a friendly and conversational tone." },
                    { role: "user", content: `User asked: "${userQuery}". Here is the related information: "${extractedData}". Now respond in a natural way.` }
                ],
                max_tokens: 150
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
        return "I'm having trouble generating a response right now. Please try again later.";
    }
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
