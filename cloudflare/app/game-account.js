(function () {
  'use strict';

  // Account controls are progressive enhancement. The edge still protects
  // the game entry point in older embedded browsers without Fetch.
  if (typeof fetch !== 'function') return;

  var name = document.getElementById('accountName');
  var sync = document.getElementById('saveState');
  var logout = document.getElementById('accountLogout');
  var account = null;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function accountAvatar(user) {
    if (user && user.avatarUrl) return '<img src="' + esc(user.avatarUrl) + '" alt="">';
    return '<span>' + esc(String(user && user.nickname || '?').slice(0, 1).toUpperCase()) + '</span>';
  }

  function cloudLabel() {
    var cloud = window.AUTOFLIP_CLOUD || {};
    if (cloud.status === 'saved') return 'Сохранено в облаке';
    if (cloud.status === 'syncing') return 'Сохраняется в облако';
    if (cloud.status === 'offline') return 'Локальная копия · ожидается интернет';
    if (cloud.status === 'pending') return 'Ожидает отправки в облако';
    return 'Автосохранение включено';
  }

  window.copyAccountId = function () {
    if (!account || !account.id) return;
    var id = String(account.id);
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(id).then(function () { alert('ID скопирован.'); }).catch(function () { fallbackCopy(id); });
    }
    fallbackCopy(id);
  };

  function fallbackCopy(value) {
    var field = document.createElement('textarea');
    field.value = value;field.setAttribute('readonly', '');field.style.position = 'fixed';field.style.opacity = '0';
    document.body.appendChild(field);field.select();
    try { document.execCommand('copy');alert('ID скопирован.'); } catch (error) { alert('ID: ' + value); }
    field.remove();
  }

  window.openAccountProfile = function () {
    if (!account) {
      render('<div class="app account-profile-app">' + head('Аккаунт') + '<div class="account-profile-loading"><span></span><b>Загружаем данные аккаунта…</b></div></div>');
      return fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' }).then(function (response) { return response.json(); }).then(function (result) {
        if (!result || !result.authenticated) return location.replace('/login/');
        account = result.user;window.AUTOFLIP_ACCOUNT = account;window.openAccountProfile();
      }).catch(function () { render('<div class="app account-profile-app">' + head('Аккаунт') + '<div class="account-profile-error"><b>Не удалось загрузить аккаунт</b><p>Проверь соединение и попробуй ещё раз.</p><button class="action" onclick="openAccountProfile()">Повторить</button></div></div>'); });
    }
    var realName=[account.firstName,account.lastName].filter(Boolean).join(' '),clan=state.communityMembership;
    render('<div class="app account-profile-app">'+head('Аккаунт')+'<section class="account-profile-hero"><div class="account-profile-avatar">'+accountAvatar(account)+'</div><div><small>ЛИЧНЫЙ АККАУНТ</small><h2>'+esc(account.nickname||'Без ника')+'</h2><p>'+(realName?esc(realName)+' · ':'')+'вход через VK ID</p></div><i>✓</i></section><section class="account-profile-id"><small>УНИКАЛЬНЫЙ ID ИГРОКА</small><button onclick="copyAccountId()"><b>'+esc(account.id||'—')+'</b><span>Копировать</span></button><p>По этому ID другие игроки могут отличить твой аккаунт. Пароль и данные VK здесь не показываются.</p></section><div class="account-profile-grid"><div><small>НИКНЕЙМ</small><b>'+esc(account.nickname||'—')+'</b><span>Уникален в AutoFlip</span></div><div><small>ГОРОД</small><b>'+esc(state.city||'Москва')+'</b><span>Текущая локация</span></div><div><small>КЛАН</small><b>'+(clan?'['+esc(clan.tag)+']':'Не выбран')+'</b><span>'+(clan?esc(clan.name):'Можно вступить в Сообществе')+'</span></div><div><small>ОБЛАКО</small><b>'+esc(cloudLabel())+'</b><span>Прогресс защищён</span></div></div><section class="account-profile-actions"><button onclick="openSaveCenter()"><span>☁️</span><div><b>Сохранения</b><small>Облако, резервные копии и журнал</small></div><i>›</i></button><button onclick="openCommunity(\'clans\')"><span>♜</span><div><b>Сообщество и клан</b><small>Публичный профиль видят другие игроки</small></div><i>›</i></button></section><button class="action account-logout-action" onclick="document.getElementById(\'accountLogout\').click()">Выйти из аккаунта</button><button class="action" onclick="settings()">‹ Вернуться в настройки</button></div>');
  };

  function setSync(text, mode) {
    if (!sync) return;
    sync.textContent = text;
    sync.dataset.cloud = mode || '';
  }

  function applyCloud(detail) {
    detail = detail || {};
    var savedTime = detail.savedAt ? new Date(Number(detail.savedAt)).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : '';
    if (detail.status === 'syncing') setSync('Сохраняем в облако…', 'syncing');
    else if (detail.status === 'pending') setSync('На устройстве · ждёт облака', 'pending');
    else if (detail.status === 'saved') setSync('Сохранено в облаке' + (savedTime ? ' · ' + savedTime : ''), 'saved');
    else if (detail.status === 'offline') {
      setSync('На устройстве · ждём интернет', 'offline');
      if (sync) sync.title = detail.detail || 'Не удалось сохранить прогресс в облаке';
    }
    else if (detail.status === 'blocked') setSync('Нужно обновить игру', 'blocked');
    else setSync(detail.detail || 'Сохранено', detail.status);
    if (sync && detail.detail) sync.title = detail.detail;
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
      account = result.user;
      window.AUTOFLIP_ACCOUNT = account;
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
