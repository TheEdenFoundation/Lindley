module.exports = ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET"),
  },
  apiToken: {
    salt: env("API_TOKEN_SALT"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT"),
    },
  },
  forgotPassword: {
    from: "salaam@masjidly.co.uk",
    replyTo: "salaam@masjidly.co.uk",
    emailTemplate: {
      subject: "TEF Lindley - Reset Password",
      html: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Reset</title>
    <style>
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f4f4f4;
      }
      .email-container {
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      }
      .email-header {
        text-align: center;
        padding-bottom: 20px;
      }
      .email-header img {
        width: 120px;
        height: auto;
      }
      .email-header p {
        font-size: 18px;
        color: #777777;
      }
      .email-body {
        font-size: 16px;
        line-height: 1.5;
        color: #333333;
      }
      .email-body p {
        margin: 15px 0;
      }
      .email-body a {
        background-color: #007bff;
        color: #ffffff;
        padding: 12px 20px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        display: inline-block;
      }
      .email-footer {
        text-align: center;
        font-size: 14px;
        color: #777777;
        margin-top: 30px;
      }
      .email-footer p {
        margin: 5px 0;
      }
      @media screen and (max-width: 600px) {
        .email-container {
          width: 100% !important;
          padding: 10px;
        }
        .email-body {
          font-size: 14px;
        }
        .email-header img {
          width: 100px;
        }
      }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="email-header">
        <img src="https://teflindley.netlify.app/logo.svg" alt="Logo" />
        <p>The Eden Foundation</p>
      </div>
      <div class="email-body">
        <p>Salaam <%= USER.firstname %>,</p>
        <p>
          We received a request to reset your password. If you did not request
          this change, please ignore this email.
        </p>
        <p>To reset your password, please click the button below:</p>
        <a href="<%= URL %>?code=<%= TOKEN %>">Reset Your Password</a>
        <p>
          If you have any issues or need further assistance, feel free to reach
          out to our support team.
        </p>
      </div>
      <div class="email-footer">
        <p>&copy; 2025 The Eden Foundation. All Rights Reserved.</p>
      </div>
    </div>
  </body>
</html>
`,
      text: `Reset your password by clicking this link: <%= URL %>?code=<%= TOKEN %>`,
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
