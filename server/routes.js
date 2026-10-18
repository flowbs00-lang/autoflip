import { onRequest as session } from "../functions/api/session.js";
import { onRequest as save } from "../functions/api/save.js";
import { onRequest as saveBackups } from "../functions/api/save/backups.js";
import { onRequest as community } from "../functions/api/community.js";
import { onRequest as support } from "../functions/api/support.js";
import { onRequest as authVk } from "../functions/api/auth/vk.js";
import { onRequest as authLogout } from "../functions/api/auth/logout.js";
import { onRequest as profileNickname } from "../functions/api/profile/nickname.js";
import { onRequest as legalConsents } from "../functions/api/legal/consents.js";
import { onRequest as accountDelete } from "../functions/api/account/delete.js";
import { onRequest as accountExport } from "../functions/api/account/export.js";
import { onRequest as economyConfirm } from "../functions/api/economy/confirm.js";
import { onRequest as economyStats } from "../functions/api/economy/stats.js";
import { onRequest as storeCatalog } from "../functions/api/store/catalog.js";
import { onRequest as storeCreatePayment } from "../functions/api/store/create-payment.js";
import { onRequest as storeOrders } from "../functions/api/store/orders.js";
import { onRequest as storeRefunds } from "../functions/api/store/refunds.js";
import { onRequest as storeWebhook } from "../functions/api/store/webhook.js";
import { onRequest as securityEvents } from "../functions/api/security/events.js";

export const apiRoutes = new Map([
  ["/api/session", session],
  ["/api/save", save],
  ["/api/save/backups", saveBackups],
  ["/api/community", community],
  ["/api/support", support],
  ["/api/auth/vk", authVk],
  ["/api/auth/logout", authLogout],
  ["/api/profile/nickname", profileNickname],
  ["/api/legal/consents", legalConsents],
  ["/api/account/delete", accountDelete],
  ["/api/account/export", accountExport],
  ["/api/economy/confirm", economyConfirm],
  ["/api/economy/stats", economyStats],
  ["/api/store/catalog", storeCatalog],
  ["/api/store/create-payment", storeCreatePayment],
  ["/api/store/orders", storeOrders],
  ["/api/store/refunds", storeRefunds],
  ["/api/store/webhook", storeWebhook],
  ["/api/security/events", securityEvents]
]);
