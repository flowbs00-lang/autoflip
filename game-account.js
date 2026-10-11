(function () {
  'use strict';

  // Account controls are progressive enhancement. The edge still protects
  // the game entry point in older embedded browsers without Fetch.
  if (typeof fetch !== 'function') return;

  var name = document.getElementById('accountName');
  var sync = document.getElementById('saveState');
  var logout = document.getElementById('accountLogout');
  var account = null;
  var legalPreferences = null;

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
        account = result.user;legalPreferences = result.legal || null;window.AUTOFLIP_ACCOUNT = account;window.openAccountProfile();
      }).catch(function () { render('<div class="app account-profile-app">' + head('Аккаунт') + '<div class="account-profile-error"><b>Не удалось загрузить аккаунт</b><p>Проверь соединение и попробуй ещё раз.</p><button class="action" onclick="openAccountProfile()">Повторить</button></div></div>'); });
    }
    var realName=[account.firstName,account.lastName].filter(Boolean).join(' '),clan=state.communityMembership,profileOn=Boolean(legalPreferences&&legalPreferences.publicProfile);
    render('<div class="app account-profile-app">'+head('Аккаунт')+'<section class="account-profile-hero"><div class="account-profile-avatar">'+accountAvatar(account)+'</div><div><small>ЛИЧНЫЙ АККАУНТ</small><h2>'+esc(account.nickname||'Без ника')+'</h2><p>'+(realName?esc(realName)+' · ':'')+'вход через VK ID</p></div><i>✓</i></section><section class="account-profile-id"><small>УНИКАЛЬНЫЙ ID ИГРОКА</small><button onclick="copyAccountId()"><b>'+esc(account.id||'—')+'</b><span>Копировать</span></button><p>По этому ID другие игроки могут отличить твой аккаунт. Пароль и данные VK здесь не показываются.</p></section><div class="account-profile-grid"><div><small>НИКНЕЙМ</small><b>'+esc(account.nickname||'—')+'</b><span>Уникален в AutoFlip</span></div><div><small>ГОРОД</small><b>'+esc(state.city||'Москва')+'</b><span>Текущая локация</span></div><div><small>КЛАН</small><b>'+(clan?'['+esc(clan.tag)+']':'Не выбран')+'</b><span>'+(clan?esc(clan.name):'Можно вступить в Сообществе')+'</span></div><div><small>ОБЛАКО</small><b>'+esc(cloudLabel())+'</b><span>Прогресс защищён</span></div></div><section class="account-profile-actions"><button onclick="openSaveCenter()"><span>☁️</span><div><b>Сохранения</b><small>Облако, резервные копии и журнал</small></div><i>›</i></button><button onclick="togglePublicProfile()"><span>'+(profileOn?'👁':'🔒')+'</span><div><b>Публичный профиль: '+(profileOn?'включён':'выключен')+'</b><small>'+(profileOn?'Другие игроки видят гараж и номера':'Гараж и номера скрыты от других')+'</small></div><i>›</i></button><button onclick="openCommunity(\'clans\')"><span>♜</span><div><b>Сообщество и клан</b><small>Чаты, участники и рейтинги</small></div><i>›</i></button><button onclick="window.open(\'/legal/\',\'_blank\',\'noopener\')"><span>§</span><div><b>Документы и приватность</b><small>Условия, согласия и контакты</small></div><i>›</i></button></section><button class="action account-logout-action" onclick="document.getElementById(\'accountLogout\').click()">Выйти из аккаунта</button><button class="action" onclick="settings()">‹ Вернуться в настройки</button></div>');
    var actions=document.querySelector('.account-profile-actions');
    if(actions)actions.insertAdjacentHTML('beforeend','<button onclick="window.open(\'/support/\',\'_blank\',\'noopener\')"><span>?</span><div><b>Поддержка</b><small>Помощь и связь с разработчиком</small></div><i>›</i></button><button onclick="downloadAccountData()"><span>⇩</span><div><b>Выгрузить мои данные</b><small>Аккаунт, сохранение, сообщения и покупки</small></div><i>›</i></button><button onclick="deleteMyAccount()"><span>⚠</span><div><b>Удалить аккаунт</b><small>Безвозвратно удалить профиль и прогресс</small></div><i>›</i></button>');
  };

  window.downloadAccountData = async function () {
    try {
      var response=await fetch('/api/account/export',{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error('export_failed');
      var blob=await response.blob(),url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download='autoflip-'+String(account&&account.id||'account')+'-export.json';document.body.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);
    } catch(error) { alert('Не удалось подготовить выгрузку. Проверь соединение.'); }
  };

  window.deleteMyAccount = async function () {
    if(!account)return;
    var confirmation=prompt('Это безвозвратно удалит профиль, прогресс, сообщения и покупки. Для подтверждения введи ID аккаунта:\n'+account.id);
    if(confirmation!==account.id)return alert('Удаление отменено: ID не совпал.');
    if(!confirm('Последнее подтверждение: удалить аккаунт без возможности восстановления?'))return;
    try {
      var response=await fetch('/api/account/delete',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmation:confirmation})});
      if(!response.ok)throw new Error('delete_failed');
      try{localStorage.clear();}catch(_){}location.replace('/login/?account=deleted');
    } catch(error) { alert('Не удалось удалить аккаунт. Попробуй позже.'); }
  };

  window.togglePublicProfile = function () {
    if (!legalPreferences || !legalPreferences.versions) return alert('Настройки приватности ещё загружаются. Попробуй снова.');
    var next = !legalPreferences.publicProfile,versions=legalPreferences.versions;
    return fetch('/api/legal/consents', {method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({legal:{terms:{accepted:true,version:versions.terms},personalData:{accepted:true,version:versions.personalData},communityRules:{accepted:true,version:versions.communityRules},publicProfile:{accepted:next,version:versions.publicProfile}}})}).then(function(response){return response.json().then(function(result){if(!response.ok||!result.ok)throw new Error(result.error||'privacy_failed');return result;});}).then(function(result){legalPreferences=result.legal;alert(next?'Публичный профиль включён.':'Публичный профиль выключен. Гараж и номера скрыты.');window.openAccountProfile();}).catch(function(){alert('Не удалось изменить приватность. Проверь соединение и попробуй снова.');});
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
      if (result.needsLegalConsent) return location.replace('/login/?legal=required');
      if (result.needsNickname) return location.replace('/setup-profile/');
      account = result.user;
      legalPreferences = result.legal || null;
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
