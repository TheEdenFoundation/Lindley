const config = {
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "The Eden Foundation Lindley",
      "Auth.form.welcome.subtitle": "Log in to your TEF Lindley account",
      "Auth.form.welcome.title": "Welcome to The Eden Foundation Lindley!",
      "Auth.form.register.subtitle":
        "Credentials are only used to authenticate in TEF Lindley. All saved data will be stored in your database.",
    },
  },
};

const bootstrap = (app) => {
  console.log(app);
};

export default {
  config,
  bootstrap,
};
