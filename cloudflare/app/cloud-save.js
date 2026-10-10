(function () {
  'use strict';

  var SAVE_KEY = 'autoflip-v7-save';
  var STAMP_KEY = 'autoflip-cloud-updated';
  var DIRTY_KEY = 'autoflip-cloud-dirty';
  var DIRTY_AT_KEY = 'autoflip-cloud-dirty-at';
  var REVISION_KEY = 'autoflip-cloud-revision';
  var VERSION_KEY = 'autoflip-save-version';
  var RELOAD_KEY = 'autoflip-cloud-reloaded';
  var BACKUP_KEY = 'autoflip-local-backup-v2';
  var CLIENT_KEY = 'autoflip-save-client-v2';
  var SAVE_VERSION = 2;
  var SAVE_DELAY = 2500;
  var MIN_UPLOAD_GAP = 15000;
  var MAX_RETRY_DELAY = 60000;
  var storagePrototype = Object.getPrototypeOf(localStorage);
  var originalSetItem = storagePrototype && storagePrototype.setItem || localStorage.setItem;
  var originalRemoveItem = storagePrototype && storagePrototype.removeItem || localStorage.removeItem;
  var storageMethodsOnPrototype = Boolean(storagePrototype && storagePrototype.setItem);
  var uploadTimer = null;
  var retryTimer = null;
  var retryAttempt = 0;
  var applyingRemote = false;
  var hydrated = false;
  var pendingUpload = false;
  var uploadInFlight = false;
  var uploadQueue = Promise.resolve();
  var lastUploadedRaw = '';
  var lastUploadStartedAt = 0;
  var lastBackupAt = 0;
  var revision = Number(localStorage.getItem(REVISION_KEY) || 0);
  var dirtyAtBoot = localStorage.getItem(DIRTY_KEY) === '1';
  var bootState = safeJson(localStorage.getItem(SAVE_KEY) || '') || {};
  var saveSequence = Number(bootState._saveMeta && bootState._saveMeta.sequence || 0);
  var clientId = localStorage.getItem(CLIENT_KEY) || ('device-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10));
  originalSetItem.call(localStorage, CLIENT_KEY, clientId);

  function safeJson(raw) {
    try { var value = JSON.parse(raw); return value && typeof value === 'object' && !Array.isArray(value) ? value : null; }
    catch (_) { return null; }
  }

  function timeText(value) {
    try { return new Date(Number(value || Date.now())).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
    catch (_) { return ''; }
  }

  function isOffline() { return typeof navigator !== 'undefined' && navigator.onLine === false; }

  function emit(status, detail, savedAt) {
    window.AUTOFLIP_CLOUD = { status: status, detail: detail || '', at: Date.now(), savedAt: Number(savedAt || 0), revision: revision };
    if (typeof CustomEvent === 'function') window.dispatchEvent(new CustomEvent('autoflip:cloud', { detail: window.AUTOFLIP_CLOUD }));
    if (window.parent && window.parent !== window && typeof window.parent.postMessage === 'function') window.parent.postMessage({ type: 'autoflip-cloud', payload: window.AUTOFLIP_CLOUD }, location.origin);
  }

  function openBackupDb() {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null);
    return new Promise(function (resolve) {
      var request;
      try { request = indexedDB.open('autoflip-safety', 1); } catch (_) { return resolve(null); }
      request.onupgradeneeded = function () { if (!request.result.objectStoreNames.contains('checkpoints')) request.result.createObjectStore('checkpoints', { keyPath: 'id' }); };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { resolve(null); };
    });
  }

  function persistIndexedBackup(entry) {
    openBackupDb().then(function (db) {
      if (!db) return;
      try {
        var transaction = db.transaction('checkpoints', 'readwrite'), store = transaction.objectStore('checkpoints');
        store.put(entry);
        var all = store.getAllKeys();
        all.onsuccess = function () { (all.result || []).sort().slice(0, -5).forEach(function (key) { store.delete(key); }); };
      } catch (_) {}
    });
  }

  function latestIndexedBackup() {
    return openBackupDb().then(function (db) {
      if (!db) return null;
      return new Promise(function (resolve) {
        try {
          var request = db.transaction('checkpoints', 'readonly').objectStore('checkpoints').getAll();
          request.onsuccess = function () { resolve((request.result || []).sort(function (a, b) { return Number(b.at || 0) - Number(a.at || 0); })[0] || null); };
          request.onerror = function () { resolve(null); };
        } catch (_) { resolve(null); }
      });
    });
  }

  function checkpointRaw(raw, reason, details) {
    if (!raw || typeof raw !== 'string' || raw.charAt(0) !== '{') return false;
    var entry = { id: Date.now() + '-' + Math.random().toString(36).slice(2, 7), at: Date.now(), reason: reason || 'Автосохранение', details: details || {}, raw: raw };
    try { originalSetItem.call(localStorage, BACKUP_KEY, JSON.stringify(entry)); } catch (_) {}
    lastBackupAt = entry.at;
    persistIndexedBackup(entry);
    return true;
  }

  window.AUTOFLIP_CHECKPOINT = function (reason, details) {
    return checkpointRaw(localStorage.getItem(SAVE_KEY), reason || 'Перед важным действием', details || {});
  };

  window.AUTOFLIP_RECORD_OPERATION = function (type, details, deferSave) {
    if (typeof state === 'undefined' || !state || typeof state !== 'object') return null;
    if (!Array.isArray(state.operationLog)) state.operationLog = [];
    details = details && typeof details === 'object' ? details : {};
    var labels = { purchase: 'Покупка автомобиля', sale: 'Продажа автомобиля', repair: 'Ремонт автомобиля', exchange: 'Обмен автомобиля', donation: 'Покупка в магазине' };
    var entry = {
      id: 'op-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      type: type,
      label: details.label || labels[type] || 'Важная операция',
      car: details.car || '',
      amount: Number(details.amount || 0),
      result: Number(details.result || 0),
      details: details.text || '',
      at: Date.now(),
      day: Number(state.day || 1)
    };
    state.operationLog.unshift(entry); state.operationLog = state.operationLog.slice(0, 60);
    if (!deferSave) localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    return entry;
  };

  function interceptedSetItem(key, value) {
    if (this !== localStorage || key !== SAVE_KEY || applyingRemote) return originalSetItem.call(this, key, value);
    var previous = localStorage.getItem(SAVE_KEY), raw = String(value), changedAt = Date.now();
    if (previous && previous !== raw && changedAt - lastBackupAt >= 120000) checkpointRaw(previous, 'Периодическое автосохранение', {});
    originalSetItem.call(this, key, raw);
    originalSetItem.call(localStorage, DIRTY_KEY, '1');
    originalSetItem.call(localStorage, DIRTY_AT_KEY, String(changedAt));
    originalSetItem.call(localStorage, VERSION_KEY, String(SAVE_VERSION));
    emit(isOffline() ? 'offline' : 'pending', isOffline() ? 'Сохранено на устройстве · ждём интернет' : 'Сохранено на устройстве · отправляем в облако');
    scheduleUpload(false);
  }
  if (storageMethodsOnPrototype) storagePrototype.setItem = interceptedSetItem;
  else localStorage.setItem = interceptedSetItem;

  function bytesToBase64(bytes) {
    var binary = '';
    for (var offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 0x8000));
    return btoa(binary);
  }

  async function createUploadBody(raw, stateValue, baseRevision) {
    var envelope = { state: stateValue, revision: revision, baseRevision: baseRevision, saveVersion: SAVE_VERSION, clientId: clientId };
    if (typeof CompressionStream !== 'function' || typeof Blob !== 'function') return JSON.stringify(envelope);
    var stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    var bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return JSON.stringify({ encoding: 'gzip-base64', compressed: bytesToBase64(bytes), revision: revision, baseRevision: baseRevision, saveVersion: SAVE_VERSION, clientId: clientId });
  }

  async function responsePayload(response) {
    try { return await response.json(); } catch (_) { return { error: 'HTTP ' + response.status }; }
  }

  function scheduleRetry() {
    if (retryTimer || isOffline()) return;
    var delay = Math.min(MAX_RETRY_DELAY, 5000 * Math.pow(2, retryAttempt++));
    retryTimer = setTimeout(function () { retryTimer = null; scheduleUpload(true); }, delay);
  }

  function applyRemoteSave(payload, message) {
    if (!payload || !payload.save) return false;
    var remoteVersion = Number(payload.saveVersion || payload.save._saveMeta && payload.save._saveMeta.version || 1);
    if (remoteVersion > SAVE_VERSION) { emit('blocked', 'Нужна новая версия игры для загрузки сохранения'); return false; }
    applyingRemote = true;
    var raw = JSON.stringify(payload.save);
    originalSetItem.call(localStorage, SAVE_KEY, raw);
    originalSetItem.call(localStorage, STAMP_KEY, String(payload.updatedAt || Date.now()));
    originalSetItem.call(localStorage, REVISION_KEY, String(payload.revision || 0));
    originalSetItem.call(localStorage, VERSION_KEY, String(remoteVersion));
    originalRemoveItem.call(localStorage, DIRTY_KEY);
    originalRemoveItem.call(localStorage, DIRTY_AT_KEY);
    applyingRemote = false;
    dirtyAtBoot = false;
    revision = Number(payload.revision || 0);
    lastUploadedRaw = raw;
    emit('saved', message || 'Облачный прогресс загружен', payload.updatedAt);
    return true;
  }

  async function fetchRemote() {
    var response = await fetch('/api/save', { credentials: 'same-origin', cache: 'no-store' });
    var payload = await responsePayload(response);
    if (!response.ok) { var error = new Error(payload.error || ('HTTP ' + response.status)); error.status = response.status; throw error; }
    return payload;
  }

  async function resolveConflict(localRaw) {
    var remote = await fetchRemote(), localState = safeJson(localRaw) || {}, remoteState = remote.save || {};
    checkpointRaw(localRaw, 'Конфликт устройств · локальная версия', { cloudRevision: remote.revision });
    revision = Number(remote.revision || 0); originalSetItem.call(localStorage, REVISION_KEY, String(revision));
    var localAt = Number(localStorage.getItem(DIRTY_AT_KEY) || localState._saveMeta && localState._saveMeta.updatedAt || 0);
    var remoteAt = Number(remoteState._saveMeta && remoteState._saveMeta.updatedAt || remote.updatedAt || 0);
    if (localAt >= remoteAt) return { retry: true, revision: revision };
    applyRemoteSave(remote, 'Загружена более новая версия из облака');
    if (sessionStorage.getItem(RELOAD_KEY) !== String(remote.updatedAt)) { sessionStorage.setItem(RELOAD_KEY, String(remote.updatedAt)); location.reload(); }
    return { retry: false };
  }

  async function uploadSnapshot(raw, conflictRetry) {
    if (!raw || applyingRemote || raw === lastUploadedRaw) return true;
    var stateValue = safeJson(raw); if (!stateValue) return false;
    var localUpdatedAt = Number(localStorage.getItem(DIRTY_AT_KEY) || Date.now());
    var currentMeta = stateValue._saveMeta && typeof stateValue._saveMeta === 'object' ? stateValue._saveMeta : {};
    saveSequence = Math.max(saveSequence, Number(currentMeta.sequence || 0)) + 1;
    stateValue._saveMeta = { version: SAVE_VERSION, clientId: clientId, sequence: saveSequence, updatedAt: localUpdatedAt };
    if (!Array.isArray(stateValue.operationLog)) stateValue.operationLog = [];
    stateValue.operationLog = stateValue.operationLog.slice(0, 60);
    var uploadedRaw = JSON.stringify(stateValue);
    var baseRevision = Number(localStorage.getItem(REVISION_KEY) || revision || 0);
    lastUploadStartedAt = Date.now(); uploadInFlight = true;
    emit('syncing', 'Сохраняем в облако');
    try {
      var response = await fetch('/api/save', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: await createUploadBody(uploadedRaw, stateValue, baseRevision) });
      var payload = await responsePayload(response);
      if (response.status === 409 && payload.error === 'revision_conflict' && !conflictRetry) {
        var resolution = await resolveConflict(raw);
        if (resolution.retry) return uploadSnapshot(raw, true);
        return true;
      }
      if (!response.ok) throw new Error(payload.error || ('HTTP ' + response.status));
      revision = Number(payload.revision || baseRevision + 1);
      originalSetItem.call(localStorage, REVISION_KEY, String(revision));
      originalSetItem.call(localStorage, STAMP_KEY, String(payload.updatedAt || Date.now()));
      if (localStorage.getItem(SAVE_KEY) === raw) {
        originalSetItem.call(localStorage, SAVE_KEY, uploadedRaw);
        originalSetItem.call(localStorage, VERSION_KEY, String(SAVE_VERSION));
        lastUploadedRaw = uploadedRaw;
        originalRemoveItem.call(localStorage, DIRTY_KEY); originalRemoveItem.call(localStorage, DIRTY_AT_KEY); dirtyAtBoot = false;
        retryAttempt = 0; if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
        emit('saved', 'Сохранено в облаке · ' + timeText(payload.updatedAt), payload.updatedAt);
      } else pendingUpload = true;
      return true;
    } catch (error) {
      emit('offline', 'Сохранено на устройстве · облако недоступно'); scheduleRetry(); return false;
    } finally { uploadInFlight = false; }
  }

  async function drainQueue() {
    if (!hydrated) { pendingUpload = true; return false; }
    var success = true;
    while (pendingUpload || localStorage.getItem(DIRTY_KEY) === '1') {
      pendingUpload = false;
      var raw = localStorage.getItem(SAVE_KEY);
      success = await uploadSnapshot(raw, false);
      if (!success || localStorage.getItem(SAVE_KEY) === raw) break;
    }
    return success;
  }

  function queueUpload() {
    pendingUpload = true;
    uploadQueue = uploadQueue.then(drainQueue, drainQueue);
    return uploadQueue;
  }

  function scheduleUpload(immediate) {
    if (uploadTimer) { if (!immediate) return; clearTimeout(uploadTimer); uploadTimer = null; }
    var elapsed = Date.now() - lastUploadStartedAt;
    var delay = immediate ? 0 : Math.max(SAVE_DELAY, MIN_UPLOAD_GAP - elapsed);
    uploadTimer = setTimeout(function () { uploadTimer = null; queueUpload(); }, delay);
  }

  async function hydrate() {
    emit('syncing', 'Проверяем облачное сохранение');
    try {
      var payload = await fetchRemote();
      revision = Number(payload.revision || 0);
      var localRaw = localStorage.getItem(SAVE_KEY), localStamp = Number(localStorage.getItem(STAMP_KEY) || 0), remoteStamp = Number(payload.updatedAt || 0);
      var storedRevision = Number(localStorage.getItem(REVISION_KEY) || 0), localDirty = dirtyAtBoot;
      hydrated = true;
      if (localRaw && localDirty) {
        if (storedRevision !== revision) {
          var resolution = await resolveConflict(localRaw);
          if (resolution.retry) await queueUpload();
        }
        else { originalSetItem.call(localStorage, REVISION_KEY, String(revision)); await queueUpload(); }
        return;
      }
      if (payload.save && (!localRaw || remoteStamp > localStamp)) {
        if (localRaw) checkpointRaw(localRaw, 'Перед загрузкой облачного сохранения', {});
        if (applyRemoteSave(payload, 'Облачный прогресс загружен') && sessionStorage.getItem(RELOAD_KEY) !== String(remoteStamp)) { sessionStorage.setItem(RELOAD_KEY, String(remoteStamp)); location.reload(); }
        return;
      }
      originalSetItem.call(localStorage, REVISION_KEY, String(revision));
      if (!payload.save && localRaw) { originalSetItem.call(localStorage, DIRTY_KEY, '1'); await queueUpload(); return; }
      if (payload.save && localRaw && JSON.stringify(payload.save) !== localRaw) { originalSetItem.call(localStorage, DIRTY_KEY, '1'); await queueUpload(); return; }
      originalRemoveItem.call(localStorage, DIRTY_KEY); dirtyAtBoot = false; lastUploadedRaw = localRaw || '';
      emit('saved', 'Сохранено в облаке · ' + timeText(remoteStamp), remoteStamp);
    } catch (error) {
      hydrated = true;
      emit(error && (error.status === 401 || error.status === 403) ? 'local' : 'offline', error && (error.status === 401 || error.status === 403) ? 'Локальное сохранение' : 'Сохранено на устройстве · ждём интернет');
      if (localStorage.getItem(DIRTY_KEY) === '1') scheduleRetry();
    } finally { if (pendingUpload) queueUpload(); }
  }

  function flushPendingSave() {
    if (uploadTimer) { clearTimeout(uploadTimer); uploadTimer = null; }
    if (localStorage.getItem(DIRTY_KEY) === '1') return queueUpload();
    return uploadQueue;
  }

  window.openSaveCenter = function (indexedBackup) {
    if (typeof render !== 'function' || typeof head !== 'function' || typeof state === 'undefined') return;
    var cloud = window.AUTOFLIP_CLOUD || {}, backup = safeJson(localStorage.getItem(BACKUP_KEY) || '') || indexedBackup || null, operations = Array.isArray(state.operationLog) ? state.operationLog.slice(0, 20) : [];
    function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]; }); }
    var icons = { purchase: '🚗', sale: '💰', repair: '🔧', exchange: '🔄', donation: '◆' };
    var rows = operations.map(function (item) { return '<article class="save-operation"><span>' + (icons[item.type] || '•') + '</span><div><b>' + esc(item.label || 'Операция') + '</b><small>' + (item.car ? esc(item.car) + ' · ' : '') + new Date(Number(item.at || 0)).toLocaleString('ru-RU') + '</small></div>' + (item.amount ? '<strong>' + Number(item.amount).toLocaleString('ru-RU') + ' ₽</strong>' : '') + '</article>'; }).join('');
    render('<div class="app save-center">' + head('Сохранения') + '<section class="save-cloud-card ' + esc(cloud.status || 'local') + '"><span>☁</span><div><small>ОСНОВНОЕ СОХРАНЕНИЕ</small><h3>' + (cloud.status === 'saved' ? 'Сохранено в облаке' : cloud.status === 'syncing' || cloud.status === 'pending' ? 'Идёт синхронизация' : 'Сохранено на устройстве') + '</h3><p>' + esc(cloud.detail || 'Прогресс защищён локальной копией') + '</p></div></section><div class="save-safety-grid"><div><small>ВЕРСИЯ</small><b>' + SAVE_VERSION + '</b></div><div><small>РЕВИЗИЯ</small><b>' + revision + '</b></div><div><small>РЕЗЕРВНАЯ КОПИЯ</small><b>' + (backup ? new Date(backup.at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '—') + '</b></div></div><button class="action green" onclick="AUTOFLIP_CREATE_BACKUP()">Создать резервную копию</button>' + (backup ? '<button class="action" onclick="AUTOFLIP_RESTORE_BACKUP()">Восстановить последнюю копию</button>' : '') + '<h3 class="save-log-title">Последние важные операции</h3><div class="save-operation-list">' + (rows || '<div class="note">Покупки, продажи, ремонты, обмены и донаты появятся здесь.</div>') + '</div><button class="action" onclick="settings()">‹ Назад в настройки</button></div>');
    if (!backup && !indexedBackup) latestIndexedBackup().then(function (entry) { if (entry) window.openSaveCenter(entry); });
  };
  window.AUTOFLIP_CREATE_BACKUP = function () { checkpointRaw(localStorage.getItem(SAVE_KEY), 'Ручная резервная копия', {}); openSaveCenter(); };
  window.AUTOFLIP_RESTORE_BACKUP = function () {
    var entry = safeJson(localStorage.getItem(BACKUP_KEY) || '');
    if (!entry || !entry.raw) return latestIndexedBackup().then(function (stored) { if (stored && stored.raw) restoreBackup(stored); else openSaveCenter(); });
    restoreBackup(entry);
  };
  function restoreBackup(entry) {
    var restored = safeJson(entry.raw), restoredVersion = Number(restored && restored._saveMeta && restored._saveMeta.version || 1);
    if (!restored || restoredVersion > SAVE_VERSION) return alert('Эта копия создана в более новой версии игры. Сначала обнови страницу.');
    if (!confirm('Восстановить резервную копию от ' + new Date(entry.at).toLocaleString('ru-RU') + '? Текущее состояние тоже будет сохранено.')) return;
    checkpointRaw(localStorage.getItem(SAVE_KEY), 'Перед восстановлением копии', {});
    localStorage.setItem(SAVE_KEY, entry.raw); scheduleUpload(true); location.reload();
  }

  if (typeof fetch !== 'function' || typeof setTimeout !== 'function' || typeof clearTimeout !== 'function') { emit('local', 'Локальное сохранение'); return; }
  addEventListener('pagehide', flushPendingSave);
  addEventListener('freeze', flushPendingSave);
  addEventListener('visibilitychange', function () { if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushPendingSave(); });
  addEventListener('online', function () { retryAttempt = 0; if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; } if (localStorage.getItem(DIRTY_KEY) === '1') scheduleUpload(true); });
  addEventListener('offline', function () { emit('offline', 'Сохранено на устройстве · ждём интернет'); });
  window.AUTOFLIP_CLOUD_FLUSH = flushPendingSave;
  window.AUTOFLIP_SAVE_VERSION = SAVE_VERSION;
  hydrate();
})();
