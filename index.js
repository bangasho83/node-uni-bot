require("dotenv").config();
const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); // Middleware to parse JSON
app.use(express.static("public")); // Serve static files (HTML, CSS, JS)

// Serve the HTML page at the root URL
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Rate limiting to prevent too many requests
let lastRequestTime = 0;
const requestCooldown = 3000; // 3 seconds cooldown

// ChatGPT API endpoint
app.post("/chat", async (req, res) => {
    const now = Date.now();
    if (now - lastRequestTime < requestCooldown) {
        return res.status(429).json({ error: "Too many requests. Please wait a few seconds." });
    }

    lastRequestTime = now;

    const userMessage = req.body.message;
    if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-3.5-turbo-1106", // More optimized version
                messages: [{ role: "user", content: userMessage }],
                max_tokens: 50 // Limit response length
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        res.json({ reply: response.data.choices[0].message.content });
    } catch (error) {
        console.error("OpenAI API Error:", error.response ? error.response.data : error.message);
        res.status(500).json({ error: "Something went wrong", details: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
