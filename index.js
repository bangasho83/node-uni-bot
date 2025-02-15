require("dotenv").config();
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public")); // Serve static files

// Load university data
const universityData = JSON.parse(fs.readFileSync("university_data.json", "utf8"));

// Serve the chat interface
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// University Chatbot API
app.post("/chat", async (req, res) => {
    const userMessage = req.body.message.toLowerCase();

    // Check if the message matches any university info
    let reply = "Sorry, I don't understand. Try asking about admissions, courses, faculty, or contact info.";

    for (const key in universityData) {
        if (userMessage.includes(key)) {
            reply = universityData[key];
            break;
        }
    }

    res.json({ reply });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
