import { runRetentionCleanup } from "./cleanup.js";

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil((async () => {
      try {
        const result = await runRetentionCleanup(env.DB, { scheduledAt: controller.scheduledTime });
        console.log("retention_cleanup_succeeded", result);
      } catch (error) {
        console.error("retention_cleanup_failed", error);
        throw error;
      }
    })());
  },

  fetch() {
    return new Response("Not found", { status: 404 });
  }
};
