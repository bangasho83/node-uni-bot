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
try {
    universityData = JSON.parse(fs.readFileSync("university_data.json", "utf8"));
} catch (error) {
    console.error("Error reading JSON file:", error);
}

// Serve the chat interface
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// University Chatbot API
app.post("/chat", async (req, res) => {
    try {
        const userMessage = req.body.message.toLowerCase();
        let reply = "Sorry, I don't understand. Try asking about admissions, courses, faculty, or contact info.";

        // Check if the user's message contains any keyword from JSON
        for (const key in universityData) {
            if (userMessage.includes(key)) {  // Fuzzy matching
                reply = universityData[key];
                break;
            }
        }

        res.json({ reply });
    } catch (error) {
        console.error("Chat API Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
