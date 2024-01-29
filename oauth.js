const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();
const ZENDESK_CLIENT_ID = process.env.ZENDESK_CLIENT_ID;
const ZENDESK_CLIENT_SECRET = process.env.ZENDESK_CLIENT_SECRET;
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;
const REDIRECT_URI = process.env.REDIRECT_URI;
const DATABASE_HOST= process.env.DATABASE_HOST;
const DATABASE_USER= process.env.DATABASE_USER;
const DATABASE_PASSWORD= process.env.DATABASE_PASSWORD;
const DATABASE= process.env.DATABASE;
const config = require('./config');



const mysql = require('mysql');

// Create a MySQL connection pool
const pool = mysql.createPool({
    connectionLimit: 10,
    host: DATABASE_HOST,
    user: DATABASE_USER,
    password: DATABASE_PASSWORD,
    database: DATABASE,
});

async function getAccessToken(code) {
    try {
        console.log('Received authorization code:', code);
        // Get the subdomain
        const subdomain = config.getSubdomain();
        console.log('Subdomain:', subdomain);
        const tokenPayload = {
            grant_type: "authorization_code",
            code: code,
            client_id: ZENDESK_CLIENT_ID,
            client_secret: ZENDESK_CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            scope: "users:read"
        };

        console.log('Request payload:', tokenPayload);

        const tokenResponse = await axios.post(
            `https://${subdomain}.zendesk.com/oauth/tokens`,
            querystring.stringify(tokenPayload),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        console.log('Token response:', tokenResponse);

        // Store the access token in the 'tokens' table
        const access_token = tokenResponse.data.access_token;
        await storeAccessToken(access_token);

        const profileResponse = await axios.get(
            `https://${subdomain}.zendesk.com/api/v2/users/me.json`,
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        return { access_token, profile: profileResponse.data.user };
    } catch (error) {
        console.error('Error getting access token:', error.message);
        throw error;
    }
}

async function storeAccessToken(access_token) {
    // Insert the access token into the 'tokens' table
    const query = "INSERT INTO tokens (access_token) VALUES (?)";
    await new Promise((resolve, reject) => {
        pool.query(query, [access_token], (error, results) => {
            if (error) {
                console.error('Error storing access token:', error.message);
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}

module.exports = { getAccessToken };
