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
      subject: "Reset password for <%= USER.firstname %>",
      text: `Salaam <%= USER.firstname %>,
        
We received a request to reset your password for the admin panel.
        
Please use the following link to reset your password:
<%= URL %>?code=<%= TOKEN %>
        
This link will expire in 24 hours.
        
If you didn't request this, please ignore this email.
        
Thanks,
The Eden Foundation`,
      html: `<p>Salaam <%= USER.firstname %>,</p>
        
<p>We received a request to reset your password for the admin panel.</p>
        
<p>Please use the following link to reset your password:<br>
<a href="<%= URL %>?code=<%= TOKEN %>"><%= URL %>?code=<%= TOKEN %></a></p>
        
<p>This link will expire in 24 hours.</p>
        
<p>If you didn't request this, please ignore this email.</p>
        
<p>Thanks,<br>
The Eden Foundation</p>`,
    },
  },
  flags: {
    nps: env.bool("FLAG_NPS", true),
    promoteEE: env.bool("FLAG_PROMOTE_EE", true),
  },
});
