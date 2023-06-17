require('dotenv').config();
const nodemailer = require('nodemailer');
const faunadb = require('faunadb');
const client = new faunadb.Client({
    secret: process.env.FAUNADB_SECRET,
});
const q = faunadb.query;

function generateToken(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        token += characters.charAt(randomIndex);
    }
    return token;
}

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

async function gentokenapipurchase(req, res) {
    const {
        email,
        purchaseMethod
    } = req.body;

    // Check for empty fields
    const requiredFields = ['email', 'purchaseMethod'];
    const missingFields = requiredFields.filter((field) => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    try {

        const sessionToken = req.cookies.Account_Session;

        const user_ref_from_session = await client.query(
            q.Map(
                q.Paginate(q.Match(q.Index('sessions_by_token'), sessionToken)),
                q.Lambda(x => {
                    return {
                        ref: q.Select(['data', 'user'], q.Get(x)),
                    };
                })
            )
        );

        const refid = user_ref_from_session.data[0].ref.value.id

        const userData = await client.query(
            q.Map(
                q.Paginate(q.Ref(q.Collection('users'), refid)),
                q.Lambda((x) => ({
                    user_id: q.Select(['ref', 'id'], q.Get(x)),
                    membership: q.Select(['data', 'membership'], q.Get(x))
                }))
            )
        );

        const membership = userData.data[0].membership;

        if (membership !== 'Admin' && membership !== 'Owner') {
            return res.status(403).json({ message: 'Access Denied' });
        }

        const token = `${generateToken(7)}-${generateToken(7)}-${generateToken(7)}`

        const newToken = await client.query(
            q.Create(q.Collection('tokens'), {
                data: {
                    token: token,
                    is_used: false,
                    rbx_user_id: null,
                },
            })
        );

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
            <h2>Thank You for Your Purchase</h2>
            <p>Dear ${email},</p>
            <p>Thank you for your recent purchase on our site.</p>
            <p>The details of your purchase are as follows:</p>
            <p><strong>Purchase Type:</strong> ${purchaseMethod}</p>
            <p><strong>Token:</strong> ${token}</p>
            <p>If you have any questions or need further assistance, please feel free to contact us.</p>
            <p>Thank you again for choosing our service.</p>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: email,
            subject: 'Thank For Purchasing',
            html: emailTemplate,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({
            message: 'Token generated',
            token: token,
        });

    } catch (error) {

        console.log(error);

        res.status(400).json({
            message: 'Token generation failed',
        });
    }
}

module.exports = gentokenapipurchase;