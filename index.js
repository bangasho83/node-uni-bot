require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
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

// University Chatbot API
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase();
        console.log("User Message:", userMessage);  // Debugging log

        let reply = "Sorry, I don't understand. Try asking about admissions, courses, faculty, or contact info.";

        // Try finding the best match for user input
        const keywords = Object.keys(universityData);
        let foundMatch = false;

        for (const key of keywords) {
            if (userMessage.includes(key.toLowerCase())) {
                let response = universityData[key]; 

                // ✅ Check if response is an object, format it nicely
                if (typeof response === "object") {
                    reply = formatResponse(response);
                } else {
                    reply = response;
                }

                foundMatch = true;
                break;
            }
        }

        console.log("Bot Reply:", reply);  // Debugging log
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
        formattedText += `**${key.replace(/_/g, " ")}:** ${obj[key]}\n`;
    }
    return formattedText.trim();
}

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
