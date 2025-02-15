require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
const { OpenAI } = require("openai"); // Import OpenAI SDK

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

// AI-Powered University Chatbot API
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message;
        console.log("User Message:", userMessage);

        let bestMatchKey = await findBestMatch(userMessage);

        let reply = "Sorry, I couldn't find relevant information. Try asking about admissions, courses, faculty, or tuition fees.";

        if (bestMatchKey) {
            let extractedData = universityData[bestMatchKey];

            // If data is an object, format it
            if (typeof extractedData === "object") {
                extractedData = formatResponse(extractedData);
            }

            // 🎯 Step 1: Generate a conversational response using OpenAI
            const aiResponse = await getAIResponse(userMessage, extractedData);
            reply = aiResponse;
        }

        console.log("Best Match:", bestMatchKey);
        console.log("Bot Reply:", reply);

        res.json({ reply });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ✅ Function to find the best match using AI embeddings
async function findBestMatch(userQuery) {
    try {
        // Generate an embedding for the user's query
        const userEmbedding = await getEmbedding(userQuery);

        let bestMatch = null;
        let highestScore = 0;

        // Compare against all university data keys
        for (const key in universityData) {
            const keyEmbedding = await getEmbedding(key);
            const similarityScore = cosineSimilarity(userEmbedding, keyEmbedding);

            if (similarityScore > highestScore) {
                highestScore = similarityScore;
                bestMatch = key;
            }
        }

        return highestScore > 0.75 ? bestMatch : null; // Only accept matches above 75% similarity
    } catch (error) {
        console.error("Error in findBestMatch:", error);
        return null;
    }
}

// ✅ Function to get OpenAI Embeddings for better semantic matching
async function getEmbedding(text) {
    const response = await openai.embeddings.create({
        model: "text-embedding-ada-002",
        input: text
    });
    return response.data[0].embedding;
}

// ✅ Function to calculate Cosine Similarity
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    return dotProduct / (magnitudeA * magnitudeB);
}

// ✅ Helper function to format object responses
function formatResponse(obj) {
    let formattedText = "";
    for (const key in obj) {
        if (typeof obj[key] === "object") {
            formattedText += `\n**${key.replace(/_/g, " ")}:**\n`;
            formattedText += formatResponse(obj[key]);
        } else {
            formattedText += `**${key.replace(/_/g, " ")}:** ${obj[key]}\n`;
        }
    }
    return formattedText.trim();
}

// ✅ Function to call OpenAI API for structured responses
async function getAIResponse(userQuery, extractedData) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo-1106", // Cheapest GPT-3.5 model
            messages: [
                { role: "system", content: "You are an AI assistant for the University of Oxford. Provide concise, engaging, and conversational responses. Keep answers short and to the point (max 3-4 sentences). Only include URLs if they are highly relevant to the question." },
                { role: "user", content: `User asked: "${userQuery}". Here is the related information: "${extractedData}". Please provide a direct and precise response.` }
            ],
            max_tokens: 150, // Reduced to avoid excessive output
            temperature: 0.6 // Keeps responses informative but natural
        });

        return response.choices[0].message.content;
    } catch (error) {
        console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
        return "I'm having trouble generating a response right now. Please try again later.";
    }
}


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
