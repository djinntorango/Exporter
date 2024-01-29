const axios = require('axios');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const { sendEmail } = require('./emailService'); 
const config = require('./config');
require('dotenv').config();


const csvWriter = createCsvWriter({
    path: 'help_center_articles.csv',
    header: [
      { id: 'id', title: 'ID' },
      { id: 'title', title: 'Title' },
      { id: 'comments_disabled', title: 'Comments Disabled' },
      { id: 'created_at', title: 'Created At' },
      { id: 'edited_at', title: 'Edited At' },
      { id: 'html_url', title: 'HTML URL' },
      { id: 'label_names', title: 'Label Names' },
      { id: 'locale', title: 'Locale' },
      { id: 'outdated', title: 'Outdated' },
      { id: 'outdated_locales', title: 'Outdated Locales' },
      { id: 'permission_group_id', title: 'Permission Group ID' },
      { id: 'position', title: 'Position' },
      { id: 'promoted', title: 'Promoted' },
      { id: 'section_id', title: 'Section ID' },
      { id: 'source_locale', title: 'Source Locale' },
      { id: 'updated_at', title: 'Updated At' },
      { id: 'url', title: 'URL' },
      { id: 'user_segment_id', title: 'User Segment ID' },
      { id: 'vote_count', title: 'Vote Count' },
      { id: 'vote_sum', title: 'Vote Sum' },
    ],
});

async function getHelpCenterArticles(access_token) {
    const subdomain = config.getSubdomain();
console.log('Subdomain:', subdomain);
const zendeskEndpoint = `https://${subdomain}.zendesk.com/api/v2/help_center/en-us/articles.json`;

    let nextPage = zendeskEndpoint;

    try {
        // Loop until there are no more pages
        while (nextPage) {
            // Make the API request
            console.log('Next Page:', nextPage);
            
            const response = await axios.get(nextPage, {
                auth: access_token,
                params: {
                    sort_by: 'updated_at',
                    sort_order: 'asc',
                },
            });

            // Extract relevant information from the response
            const articles = response.data.articles;
            console.log('Number of articles:', articles.length);

            // Write articles to CSV file
            await csvWriter.writeRecords(articles);

            // Get the next page URL
            nextPage = response.data.next_page;
        }

        // Send email with CSV file attachment
        await sendEmail();


    } catch (error) {
        console.error('Error fetching and processing help center articles:', error.message);
    }
}

module.exports = { getHelpCenterArticles };
