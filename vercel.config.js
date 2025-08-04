// vercel.config.js
export default {
  rewrites: async () => [
    { source: '/(.*)', destination: '/' },
  ],
};
