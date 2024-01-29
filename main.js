const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
const axios = require('axios');
const { getAccessToken } = require('./oauth');
const { getHelpCenterArticles } = require('./fetches');
const { sendEmail } = require('./emailService');
const { getSubdomain, setSubdomain } = require('./config');
require('dotenv').config();

const app = express();
const port = 8081;

// ... (other configurations)

const ZENDESK_CLIENT_ID = process.env.ZENDESK_CLIENT_ID;
const ZENDESK_CLIENT_SECRET = process.env.ZENDESK_CLIENT_SECRET;
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const REDIRECT_URI = process.env.REDIRECT_URI;

app.use(express.urlencoded({ extended: true }));

// Form for user to enter their subdomain
app.get("/", (req, res) => {
    res.send(`
        <p>Enter your Zendesk subdomain:</p>
        <form action="/set-subdomain" method="post">
            <label for="subdomain">Subdomain:</label>
            <input type="text" id="subdomain" name="subdomain" required>
            <button type="submit">Set Subdomain</button>
        </form>
    `);
});

// Route to handle the submission of the subdomain form
app.post("/set-subdomain", (req, res) => {
    const subdomain = req.body.subdomain;

    // Store the subdomain in the configuration module
    setSubdomain(subdomain);

    res.redirect(
        `https://${subdomain}.zendesk.com/oauth/authorizations/new?${querystring.stringify(
          {
            response_type: "code",
            redirect_uri: REDIRECT_URI,
            client_id: ZENDESK_CLIENT_ID,
            scope: "users:read"
          }
        )}`
      )
});

// Call the function to get access token
app.get("/oauth", async (req, res) => {
    try {
        const { access_token, profile } = await getAccessToken(req.query.code);

        // Use the access_token and profile as needed
        res.send(`
            <p>Hi, ${profile.name}!</p>
            <form action="/send-email" method="post">
                <label for="email">Enter your email:</label>
                <input type="email" id="email" name="email" required>
                <button type="submit">Send Email</button>
            </form>
        `);

        // Call the function to get help center articles, write to CSV, and send email
        await getHelpCenterArticles(access_token);
    } catch (error) {
        // Handle errors
        res.status(500).send(`Error: ${error.message}`);
    }
});

// Use body-parser middleware
app.use(express.urlencoded({ extended: true }));

// Add a new route for handling the email form
app.get("/send-email", (req, res) => {
    res.send(`
        <form action="/send-email" method="post">
            <label for="email">Enter your email:</label>
            <input type="email" id="email" name="email" required>
            <button type="submit">Send Email</button>
        </form>
    `);
});

// Handle the form submission and trigger the email sending function
app.post("/send-email", async (req, res) => {
    const userEmail = req.body.email;
  
    try {
      // Call the function from the email service to send an email
      await sendEmail(userEmail);
      res.send('Email sent successfully.');
    } catch (error) {
      res.status(500).send(`Error sending email: ${error.message}`);
    }
  });
  

app.listen(port, () => {
    console.log(`Server running on port ${port}. Visit http://localhost:${port}`);
});
