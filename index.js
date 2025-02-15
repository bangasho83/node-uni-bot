require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");
//const jsonFilePath = path.join(__dirname, "university_data.json");
//console.log("🔍 Checking JSON file at:", jsonFilePath);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Load university data from JSON
let universityData = {}; 
try {
    universityData = JSON.parse(fs.readFileSync("university_data.json", "utf8"));
    console.log("Loaded University Data:", universityData);  // 🔍 Debug log
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

        // Improved fuzzy matching logic
        const keywords = Object.keys(universityData);
        for (const key of keywords) {
            const regex = new RegExp(`\\b${key}\\b`, "i"); // Word boundary match
            if (regex.test(userMessage)) {
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
