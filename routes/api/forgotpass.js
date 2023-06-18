require('dotenv').config();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const faunadb = require('faunadb');
const client = new faunadb.Client({
  secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

// Configure nodemailer with your email service provider details
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    ciphers:'SSLv3'
  }
});


async function forgotpassapi(req, res) {

  const { email } = req.body;

  try {
    // Check if the email exists in the users collection
    const user = await client.query(q.Get(q.Match(q.Index('users_by_email'), q.Casefold(email))));

    // Generate a reset token
    const resetToken = await bcrypt.hash(user.ref.id + Date.now().toString(), 10);

    // Save the reset token in the password_reset_tokens collection
    await client.query(q.Create(q.Collection('password_reset_tokens'), { data: { email, token: resetToken } }));

    // Construct the reset URL with the token
    const resetURL = `http://localhost:3000/reset-password?key=${resetToken}`;

    // CSS styles for the email template
    const emailStyles = `
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: #ffffff;
          padding: 20px;
          border-radius: 5px;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        h2 {
          color: #333333;
          margin-bottom: 20px;
        }
        p {
          color: #555555;
          margin-bottom: 10px;
        }
        .button {
          display: inline-block;
          background-color: #3498db;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 4px;
          text-decoration: none;
        }
      </style>
    `;

    // HTML template for the password reset email
    const emailTemplate = `
      <html>
      <head>
        ${emailStyles}
      </head>
      <body>
        <div class="container">
          <h2>Password Reset</h2>
          <p>Dear ${email},</p>
          <p>You have requested to reset your password for your site username (${user.data.username}).</p>
          <p>Please click on the button below to reset your password:</p>
          <p><a class="button" href="${resetURL}">Reset Password</a></p>
          <p>If you did not request a password reset, please ignore this email.</p>
        </div>
      </body>
      </html>
    `;

    // Send the password reset email
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Password Reset',
      html: emailTemplate,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Password reset instructions have been sent to your email' });
  } catch (error) {
    console.log(error);
    if (error.message === 'instance not found') {
      res.status(404).json({ message: 'User not found with this email' });
    } else {
      res.status(500).json({ message: 'An error occurred' });
    }
  }
}

module.exports = forgotpassapi;
