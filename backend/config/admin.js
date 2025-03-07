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
    from: "TEF Lindley <salaam@masjidly.co.uk>",
    replyTo: "TEF Lindley <salaam@masjidly.co.uk>",
    emailTemplate: {
      subject: "TEF Lindley - Reset Password",
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
