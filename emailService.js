// emailService.js
const nodemailer = require('nodemailer');
const fs = require('fs');

const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: 'djinn@torango.io',
    pass: 'dhwknmmjtpwqyfyw',
  },
});

async function sendEmail(userEmail) {
  try {
    const mailOptions = {
      from: 'djinn@torango.io',
      to: userEmail,
      subject: 'Help Center Articles',
      text: 'Please find attached the list of help center articles.',
      attachments: [
        {
          filename: 'help_center_articles.csv',
          path: 'help_center_articles.csv',
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    const filePath = 'help_center_articles.csv';
    fs.unlinkSync(filePath);
    console.log('Email sent successfully.');
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw error;
  }
}

module.exports = { sendEmail };
