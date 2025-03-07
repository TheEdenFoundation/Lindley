const fs = require("fs");
const path = require("path");

// Read the HTML template file
const forgotPasswordTemplate = fs.readFileSync(
  path.join(__dirname, "../templates/emails/forgot-password.html"),
  "utf8"
);

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
      html: forgotPasswordTemplate,
      text: `Reset your password by clicking this link: <%= URL %>?code=<%= TOKEN %>`,
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
