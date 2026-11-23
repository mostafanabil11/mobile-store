/**
 * Keeps the Render free-plan API awake during store hours by pinging its health endpoint.
 * Render's free plan sleeps after 15 idle minutes; the next visitor would wait ~50s.
 */
export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(
      fetch(env.TARGET_URL, { headers: { "user-agent": "mobile-store-keepalive" } }).then(
        (res) => console.log(`ping ${res.status}`),
        (err) => console.error(`ping failed: ${err}`),
      ),
    );
  },
  async fetch() {
    return new Response("mobile-store keep-alive", { status: 200 });
  },
};
