(function () {
  'use strict';

  // Account controls are progressive enhancement. The edge still protects
  // the game entry point in older embedded browsers without Fetch.
  if (typeof fetch !== 'function') return;

  var name = document.getElementById('accountName');
  var sync = document.getElementById('saveState');
  var logout = document.getElementById('accountLogout');

  function setSync(text, mode) {
    if (!sync) return;
    sync.textContent = text;
    sync.dataset.cloud = mode || '';
  }

  function applyCloud(detail) {
    detail = detail || {};
    if (detail.status === 'syncing') setSync('Сохраняем…', 'syncing');
    else if (detail.status === 'saved') setSync('В облаке', 'saved');
    else if (detail.status === 'offline') {
      setSync('На устройстве', 'offline');
      if (sync) sync.title = detail.detail || 'Не удалось сохранить прогресс в облаке';
    }
    else setSync(detail.detail || 'Сохранено', detail.status);
  }

  window.addEventListener('autoflip:cloud', function (event) {
    applyCloud(event.detail);
  });
  if (window.AUTOFLIP_CLOUD) applyCloud(window.AUTOFLIP_CLOUD);

  fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' })
    .then(function (response) { return response.json(); })
    .then(function (result) {
      if (!result || !result.authenticated) return location.replace('/login/');
      if (result.needsNickname) return location.replace('/setup-profile/');
      if (name) name.textContent = result.user.nickname;
    })
    .catch(function () {
      if (name) name.textContent = 'Профиль';
    });

  if (logout) logout.addEventListener('click', async function () {
    logout.disabled = true;
    setSync('Сохраняем…', 'syncing');
    try {
      if (typeof window.AUTOFLIP_CLOUD_FLUSH === 'function') {
        await window.AUTOFLIP_CLOUD_FLUSH();
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
    } finally {
      location.replace('/login/');
    }
  });
})();
