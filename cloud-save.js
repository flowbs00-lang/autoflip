(function () {
  'use strict';

  // The game test harness and old embedded browsers may not provide the Web APIs
  // required for cloud sync. Local saving must keep working in that case.
  if (typeof fetch !== 'function' || typeof setTimeout !== 'function' || typeof clearTimeout !== 'function' || typeof CustomEvent !== 'function') return;

  var SAVE_KEY = 'autoflip-v7-save';
  var STAMP_KEY = 'autoflip-cloud-updated';
  var DIRTY_KEY = 'autoflip-cloud-dirty';
  var RELOAD_KEY = 'autoflip-cloud-reloaded';
  var SAVE_DELAY = 2500;
  var MIN_UPLOAD_GAP = 12000;
  var storagePrototype = Object.getPrototypeOf(localStorage);
  var originalSetItem = storagePrototype.setItem;
  var originalRemoveItem = storagePrototype.removeItem;
  var uploadTimer = null;
  var applyingRemote = false;
  var hydrated = false;
  var pendingUpload = false;
  var uploadInFlight = false;
  var lastUploadedRaw = '';
  var lastUploadStartedAt = 0;
  var revision = 0;
  // Only a marker that survived a previous tab is proof of an interrupted save.
  // Startup migrations may write the save again before the cloud GET completes.
  var dirtyAtBoot = localStorage.getItem(DIRTY_KEY) === '1';

  function emit(status, detail) {
    window.AUTOFLIP_CLOUD = { status: status, detail: detail || '', at: Date.now() };
    window.dispatchEvent(new CustomEvent('autoflip:cloud', { detail: window.AUTOFLIP_CLOUD }));
    if (window.parent !== window) window.parent.postMessage({ type: 'autoflip-cloud', payload: window.AUTOFLIP_CLOUD }, location.origin);
  }

  function bytesToBase64(bytes) {
    var binary = '';
    for (var offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 0x8000));
    }
    return btoa(binary);
  }

  async function createUploadBody(raw, state) {
    if (typeof CompressionStream !== 'function' || typeof Blob !== 'function') {
      return JSON.stringify({ state: state, revision: revision });
    }
    var stream = new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'));
    var bytes = new Uint8Array(await new Response(stream).arrayBuffer());
    return JSON.stringify({
      encoding: 'gzip-base64',
      compressed: bytesToBase64(bytes),
      revision: revision
    });
  }

  async function responseError(response) {
    try {
      var payload = await response.json();
      return payload && payload.error ? payload.error : 'HTTP ' + response.status;
    } catch (_) {
      return 'HTTP ' + response.status;
    }
  }

  async function uploadNow() {
    if (!hydrated) {
      pendingUpload = true;
      return;
    }
    var raw = localStorage.getItem(SAVE_KEY);
    if (!raw || applyingRemote || raw === lastUploadedRaw) return;
    if (uploadInFlight) {
      pendingUpload = true;
      return;
    }
    uploadInFlight = true;
    lastUploadStartedAt = Date.now();
    try {
      var state = JSON.parse(raw);
      if (!revision) emit('syncing', 'Сохраняем прогресс');
      var body = await createUploadBody(raw, state);
      var response = await fetch('/api/save', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: body
      });
      if (!response.ok) throw new Error(await responseError(response));
      var payload = await response.json();
      revision = Number(payload.revision || revision + 1);
      lastUploadedRaw = raw;
      originalSetItem.call(localStorage, STAMP_KEY, String(payload.updatedAt || Date.now()));
      if (localStorage.getItem(SAVE_KEY) === raw) {
        originalRemoveItem.call(localStorage, DIRTY_KEY);
        dirtyAtBoot = false;
        emit('saved', 'Прогресс сохранён в облаке');
      } else {
        pendingUpload = true;
      }
    } catch (error) {
      emit('offline', 'Прогресс сохранён на устройстве. Ошибка облака: ' + (error && error.message ? error.message : 'unknown'));
    } finally {
      uploadInFlight = false;
      if (pendingUpload) {
        pendingUpload = false;
        scheduleUpload();
      }
    }
  }

  function scheduleUpload(immediate) {
    if (uploadTimer) {
      if (!immediate) return;
      clearTimeout(uploadTimer);
      uploadTimer = null;
    }
    var elapsed = Date.now() - lastUploadStartedAt;
    var delay = immediate ? 0 : Math.max(SAVE_DELAY, MIN_UPLOAD_GAP - elapsed);
    uploadTimer = setTimeout(function () {
      uploadTimer = null;
      uploadNow();
    }, delay);
  }

  storagePrototype.setItem = function (key, value) {
    originalSetItem.call(this, key, value);
    if (this === localStorage && key === SAVE_KEY && !applyingRemote) {
      originalSetItem.call(localStorage, DIRTY_KEY, '1');
      scheduleUpload(false);
    }
  };

  async function hydrate() {
    emit('syncing', 'Проверяем облачное сохранение');
    try {
      var response = await fetch('/api/save', { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401 || response.status === 403) {
        emit('local', 'Локальное сохранение');
        return;
      }
      if (!response.ok) throw new Error('HTTP ' + response.status);
      var payload = await response.json();
      revision = Number(payload.revision || 0);
      var localRaw = localStorage.getItem(SAVE_KEY);
      var localStamp = Number(localStorage.getItem(STAMP_KEY) || 0);
      var remoteStamp = Number(payload.updatedAt || 0);
      var localDirty = dirtyAtBoot;

      // A tab may be closed while its final request is still in flight. In that
      // case the local dirty copy is the only version known to contain the last
      // actions and must never be replaced by an older cloud response.
      if (localRaw && localDirty) {
        hydrated = true;
        emit('syncing', 'Сохраняем последние изменения');
        await uploadNow();
        return;
      }

      if (payload.save && (!localRaw || remoteStamp > localStamp)) {
        applyingRemote = true;
        originalSetItem.call(localStorage, SAVE_KEY, JSON.stringify(payload.save));
        originalSetItem.call(localStorage, STAMP_KEY, String(remoteStamp));
        originalRemoveItem.call(localStorage, DIRTY_KEY);
        dirtyAtBoot = false;
        lastUploadedRaw = JSON.stringify(payload.save);
        applyingRemote = false;
        hydrated = true;
        emit('saved', 'Облачный прогресс загружен');
        if (sessionStorage.getItem(RELOAD_KEY) !== String(remoteStamp)) {
          sessionStorage.setItem(RELOAD_KEY, String(remoteStamp));
          location.reload();
        }
        return;
      }

      if (!payload.save && localRaw) {
        originalSetItem.call(localStorage, DIRTY_KEY, '1');
        hydrated = true;
        await uploadNow();
        return;
      }
      if (payload.save && localRaw && JSON.stringify(payload.save) !== localRaw) {
        originalSetItem.call(localStorage, DIRTY_KEY, '1');
        hydrated = true;
        await uploadNow();
        return;
      }
      originalRemoveItem.call(localStorage, DIRTY_KEY);
      dirtyAtBoot = false;
      hydrated = true;
      emit('saved', 'Прогресс синхронизирован');
    } catch (error) {
      hydrated = true;
      emit('offline', 'Сейчас без облака — прогресс остаётся на устройстве');
    } finally {
      if (pendingUpload) {
        pendingUpload = false;
        scheduleUpload();
      }
    }
  }

  function flushPendingSave() {
    if (uploadTimer) {
      clearTimeout(uploadTimer);
      uploadTimer = null;
    }
    if (localStorage.getItem(DIRTY_KEY) === '1') uploadNow();
  }

  addEventListener('pagehide', flushPendingSave);
  addEventListener('freeze', flushPendingSave);
  addEventListener('visibilitychange', function () {
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') flushPendingSave();
  });
  addEventListener('online', function () {
    if (localStorage.getItem(DIRTY_KEY) === '1') scheduleUpload(true);
  });

  window.AUTOFLIP_CLOUD_FLUSH = uploadNow;

  hydrate();
})();
