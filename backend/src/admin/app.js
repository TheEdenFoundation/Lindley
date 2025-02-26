const config = {
  translations: {
    en: {
      "app.components.LeftMenu.navbrand.title": "Shah Jalal Masjid",
      "Auth.form.welcome.subtitle": "Log in to your Shah Jalal Masjid account",
      "Auth.form.welcome.title": "Welcome to Shah Jalal Masjid!",
      "Auth.form.register.subtitle":
        "Credentials are only used to authenticate in Shah Jalal Masjid. All saved data will be stored in your database.",
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
