export default {
  providers: [
    {
      // For self-hosted Convex, CONVEX_SITE_URL is the site (http actions) origin.
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
