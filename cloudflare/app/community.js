(function () {
  'use strict';
  if (typeof fetch !== 'function') return;

  var tab = 'global';
  var region = '';
  var snapshot = null;
  var loading = false;
  var pollBusy = false;

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (char) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  function formatTime(value) {
    var date = new Date(Number(value || 0));
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(value) {
    var date = new Date(Number(value || 0));
    return Number.isFinite(date.getTime()) && Number(value) > 0 ? date.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Недавно';
  }

  function formatMoney(value) {
    return Math.max(0, Number(value || 0)).toLocaleString('ru-RU') + ' ₽';
  }

  function displayName(row) {
    return (row && row.clanTag ? '[' + row.clanTag + '] ' : '') + (row && row.nickname || 'Игрок');
  }

  function decorateAccountName() {
    if (!snapshot || !snapshot.me) return;
    var name = document.getElementById('accountName');
    if (name) name.textContent = displayName({ nickname: snapshot.me.nickname, clanTag: snapshot.me.clan && snapshot.me.clan.tag });
  }

  async function api(method, data, query) {
    var response = await fetch('/api/community' + (query || ''), {
      method: method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
      body: method === 'POST' ? JSON.stringify(data || {}) : undefined
    });
    var payload = await response.json().catch(function () { return {}; });
    if (!response.ok) throw new Error(payload.error || 'community_error');
    return payload;
  }

  function errorText(code) {
    return {
      message_rate_limited: 'Не отправляй сообщения так быстро.',
      invalid_message: 'Сообщение должно содержать от 1 до 400 символов.',
      clan_name_or_tag_taken: 'Такое название или сокращение уже занято.',
      already_in_clan: 'Сначала выйди из текущего клана.',
      owner_cannot_leave: 'Владелец может только удалить клан.',
      invalid_clan: 'Название: 3–24 символа. Тег: 2–5 букв или цифр.',
      clan_full: 'В этом клане уже 50 участников.',
      clan_permission_denied: 'У тебя недостаточно прав для этого действия.',
      clan_member_not_found: 'Участник уже покинул клан.',
      invalid_clan_role: 'Эту должность назначить нельзя.',
      player_not_found: 'Профиль игрока больше недоступен.'
    }[code] || 'Не удалось выполнить действие. Попробуй ещё раз.';
  }

  function channel() {
    if (tab === 'region') return 'region:' + (region || state.city || 'Москва');
    if (tab === 'clan_chat') return 'clan';
    return 'global';
  }

  function tabsHtml() {
    return '<nav class="community-tabs">' +
      [['global', 'Общий'], ['region', 'Регионы'], ['rating', 'Рейтинг'], ['clans', 'Кланы']].map(function (item) {
        return '<button class="' + (tab === item[0] ? 'active' : '') + '" onclick="openCommunity(\'' + item[0] + '\')">' + item[1] + '</button>';
      }).join('') + '</nav>';
  }

  function messageRows(data) {
    var rows = (data.messages || []).map(function (message) {
      var mine = message.userId === data.me.id;
      return '<article class="community-message ' + (mine ? 'mine' : '') + '"><div><button class="community-author" data-user-id="' + esc(message.userId) + '" onclick="communityOpenProfile(this.dataset.userId)">' + esc(displayName(message)) + '</button><time>' + formatTime(message.createdAt) + '</time></div><p>' + esc(message.body) + '</p></article>';
    }).join('');
    return rows || '<div class="community-empty">Пока сообщений нет. Начни разговор первым.</div>';
  }

  function messageSignature(data) {
    return (data.messages || []).map(function (message) { return message.id; }).join(',');
  }

  function messagesHtml(data) {
    var cities = data.cities || [];
    var selector = tab === 'region' ? '<label class="community-region">Региональный чат<select onchange="communityRegion(this.value)">' + cities.map(function (city) {
      return '<option ' + (city === region ? 'selected' : '') + '>' + esc(city) + '</option>';
    }).join('') + '</select></label>' : '';
    return selector + '<div class="community-live-note"><span></span> Новые сообщения появляются автоматически</div><section id="communityChat" class="community-chat" data-signature="' + esc(messageSignature(data)) + '">' + messageRows(data) + '</section>' +
      '<div class="community-compose"><textarea id="communityMessage" maxlength="400" placeholder="Написать сообщение…"></textarea><button onclick="communitySend()">➤</button></div>';
  }

  function ratingHtml(data) {
    var players = (data.players || []).map(function (player, index) {
      return '<button class="community-rank ' + (player.id === data.me.id ? 'me' : '') + '" data-user-id="' + esc(player.id) + '" onclick="communityOpenProfile(this.dataset.userId)"><strong>' + (index + 1) + '</strong><div><b>' + esc(displayName(player)) + '</b><small>📍 ' + esc(player.city) + '</small></div><em>' + Number(player.reputation || 0).toLocaleString('ru-RU') + ' реп.</em></button>';
    }).join('');
    return '<section class="community-title"><small>РЕЙТИНГ ИГРОКОВ</small><h3>Лучшие перекупы</h3><p>Позиция определяется текущей репутацией аккаунта.</p></section><div class="community-ranking">' + (players || '<div class="community-empty">Рейтинг пока пуст.</div>') + '</div>';
  }

  function clansHtml(data) {
    var own = data.me.clan;
    var ownCount = Number((data.clanMembers || []).length);
    var ownHtml = own ? '<section class="community-own-clan"><small>ТВОЙ КЛАН · ' + roleLabel(own.role).toUpperCase() + '</small><h3>[' + esc(own.tag) + '] ' + esc(own.name) + '</h3><p>Состав: ' + ownCount + '/50 · тег отображается рядом с ником.</p><div class="community-clan-actions">' +
      '<button onclick="openCommunity(\'clan_chat\')">Чат клана</button><button onclick="openCommunity(\'clan_members\')">Состав</button><button onclick="openClanTask()">Задание клана</button>' +
      (own.ownerUserId === data.me.id ? '<button class="danger" onclick="communityDeleteClan()">Удалить</button>' : '<button onclick="communityLeaveClan()">Выйти</button>') + '</div></section>' :
      '<section class="community-create"><small>СОЗДАТЬ ГРУППУ</small><h3>Свой клан</h3><div><input id="clanName" maxlength="24" placeholder="Название"><input id="clanTag" maxlength="5" placeholder="Тег"></div><button onclick="communityCreateClan()">Создать клан</button></section>';
    var list = (data.clans || []).map(function (clan, index) {
      var count = Number(clan.members || 0), full = count >= 50;
      return '<div class="community-clan"><strong>' + (index + 1) + '</strong><div><b>[' + esc(clan.tag) + '] ' + esc(clan.name) + '</b><small>' + count + '/50 участников</small></div><em>' + Number(clan.reputation || 0).toLocaleString('ru-RU') + ' реп.</em>' + (!own ? '<button ' + (full ? 'disabled' : '') + ' onclick="communityJoinClan(\'' + clan.id + '\')">' + (full ? 'Клан заполнен' : 'Вступить') + '</button>' : '') + '</div>';
    }).join('');
    return ownHtml + '<section class="community-title compact"><small>РЕЙТИНГ КЛАНОВ</small><h3>Сильнейшие группы</h3></section><div class="community-clans">' + (list || '<div class="community-empty">Кланов пока нет.</div>') + '</div>';
  }

  function roleLabel(role) {
    return role === 'leader' ? 'Глава' : role === 'coleader' ? 'Соруководитель' : 'Участник';
  }

  function clanMembersHtml(data) {
    var own = data.me.clan;
    if (!own) return '<div class="community-empty">Ты пока не состоишь в клане.</div>';
    var canLead = own.ownerUserId === data.me.id;
    var canAssist = own.role === 'coleader';
    var rows = (data.clanMembers || []).map(function (member) {
      var mine = member.id === data.me.id;
      var roleActions = canLead && member.role !== 'leader'
        ? '<button onclick="communitySetRole(\'' + member.id + '\',\'' + (member.role === 'coleader' ? 'member' : 'coleader') + '\')">' + (member.role === 'coleader' ? 'Сделать участником' : 'Назначить соруководителем') + '</button>'
        : '';
      var mayKick = !mine && member.role !== 'leader' && (canLead || (canAssist && member.role === 'member'));
      return '<article class="community-member ' + (mine ? 'me' : '') + '"><button class="community-member-profile" data-user-id="' + esc(member.id) + '" onclick="communityOpenProfile(this.dataset.userId)"><span class="community-member-avatar">' + esc(String(member.nickname || '?').slice(0, 1).toUpperCase()) + '</span><span class="community-member-copy"><b>' + esc(member.nickname) + (mine ? ' · ты' : '') + '</b><small>📍 ' + esc(member.city || 'Москва') + ' · ' + Number(member.reputation || 0).toLocaleString('ru-RU') + ' реп.</small><em class="role-' + esc(member.role) + '">' + roleLabel(member.role) + '</em></span><i>›</i></button>' + ((roleActions || mayKick) ? '<section>' + roleActions + (mayKick ? '<button class="danger" onclick="communityKickMember(\'' + member.id + '\')">Исключить</button>' : '') + '</section>' : '') + '</article>';
    }).join('');
    return '<section class="community-roster-head"><small>СОСТАВ КЛАНА</small><h3>[' + esc(own.tag) + '] ' + esc(own.name) + '</h3><p>' + Number((data.clanMembers || []).length) + '/50 участников · глава назначает соруководителей</p></section><div class="community-members">' + rows + '</div>';
  }

  function publicCarRows(player) {
    var cars = (player.cars || []).map(function (car) {
      var visual = car.photo ? '<img src="' + esc(car.photo) + '" alt="" loading="lazy">' : '<span>🚘</span>';
      return '<article class="community-profile-car"><div class="community-profile-car-photo">' + visual + '<small>' + (car.repaired ? 'ГОТОВА' : 'ТРЕБУЕТ РАБОТ') + '</small></div><div><b>' + esc(car.name) + '</b><span>' + Number(car.year || 0) + ' · ' + Number(car.km || 0).toLocaleString('ru-RU') + ' км</span><em>' + esc(car.city || player.city) + '</em><strong>' + formatMoney(car.value) + '</strong></div></article>';
    }).join('');
    return cars || '<div class="community-empty">В гараже пока нет автомобилей.</div>';
  }

  function publicPlateRows(player) {
    var rarity = { common: 'Обычный', uncommon: 'Необычный', rare: 'Редкий', superrare: 'Сверхредкий', forbidden: 'Запретный', priceless: 'Бесценный' };
    var plates = (player.plates || []).map(function (plate) {
      return '<article class="community-profile-plate"><div class="community-plate-face"><b>' + esc(plate.number) + '</b><span><strong>' + esc(plate.region) + '</strong><small>RUS 🇷🇺</small></span></div><div><b>' + esc(rarity[plate.rarity] || rarity.common) + '</b><span>' + esc(plate.city || 'Россия') + '</span><strong>' + formatMoney(plate.value) + '</strong></div></article>';
    }).join('');
    return plates || '<div class="community-empty">Коллекция номеров пока пустая.</div>';
  }

  function renderPlayerProfile(player) {
    var clan = player.clan;
    var name = displayName({ nickname: player.nickname, clanTag: clan && clan.tag });
    render('<div class="app community-app community-profile-app">' + head('Профиль игрока') + '<button class="community-back" onclick="communityCloseProfile()">‹ Вернуться назад</button><section class="community-player-hero"><div class="community-player-avatar">' + esc(String(player.nickname || '?').slice(0, 1).toUpperCase()) + '</div><div><small>' + (player.isMe ? 'ТВОЙ ПУБЛИЧНЫЙ ПРОФИЛЬ' : 'ИГРОК AUTOFLIP') + '</small><h2>' + esc(name) + '</h2><p>📍 ' + esc(player.city) + (clan ? ' · ' + esc(roleLabel(clan.role)) : '') + '</p></div><span class="' + (player.online ? '' : 'offline') + '">● ' + (player.online ? 'ONLINE' : 'OFFLINE') + '</span></section><section class="community-player-id"><span>Уникальный ID</span><button data-player-id="' + esc(player.id) + '" onclick="communityCopyId(this.dataset.playerId)">' + esc(player.id) + ' ⧉</button><small>В игре с ' + esc(formatDate(player.createdAt)) + '</small></section><div class="community-player-stats"><div><small>РЕПУТАЦИЯ</small><b>' + Number(player.reputation || 0).toLocaleString('ru-RU') + '</b></div><div><small>ГАРАЖ</small><b>' + Number(player.garageLevel || 1) + ' уровень</b></div><div><small>ИНВЕНТАРЬ</small><b>' + Number((player.cars || []).length) + ' авто · ' + Number((player.plates || []).length) + ' ном.</b></div></div>' + (clan ? '<section class="community-player-clan"><small>КЛАН</small><b>[' + esc(clan.tag) + '] ' + esc(clan.name) + '</b><span>' + esc(roleLabel(clan.role)) + '</span></section>' : '') + '<section class="community-profile-section"><div><span>ГАРАЖ · УРОВЕНЬ ' + Number(player.garageLevel || 1) + '</span><b>' + formatMoney(player.garageValue) + '</b></div><main>' + publicCarRows(player) + '</main></section><section class="community-profile-section"><div><span>КОЛЛЕКЦИЯ НОМЕРОВ</span><b>' + Number((player.plates || []).length) + ' шт.</b></div><main class="community-profile-plates">' + publicPlateRows(player) + '</main></section></div>');
  }

  function renderCommunity(data) {
    snapshot = data;
    window.AUTOFLIP_COMMUNITY_ME = data.me;
    var membership = data.me.clan ? { id: data.me.clan.id, name: data.me.clan.name, tag: data.me.clan.tag, role: data.me.clan.role } : null;
    if (JSON.stringify(state.communityMembership || null) !== JSON.stringify(membership)) {
      state.communityMembership = membership;
      if (typeof persist === 'function') persist();
    }
    if (!region) region = data.me.city || state.city || 'Москва';
    decorateAccountName();
    var body = tab === 'rating' ? ratingHtml(data) : tab === 'clans' ? clansHtml(data) : tab === 'clan_members' ? clanMembersHtml(data) : messagesHtml(data);
    var clanSubpage = tab === 'clan_chat' || tab === 'clan_members';
    var title = tab === 'clan_chat' && data.me.clan ? '[' + data.me.clan.tag + '] Чат клана' : tab === 'clan_members' ? 'Состав клана' : 'Сообщество';
    render('<div class="app community-app">' + head(title) + '<section class="community-hero"><div><small>AUTOFLIP ONLINE</small><h2>' + esc(displayName({ nickname: data.me.nickname, clanTag: data.me.clan && data.me.clan.tag })) + '</h2><p>' + Number(data.me.reputation || 0).toLocaleString('ru-RU') + ' репутации · ' + esc(data.me.city) + '</p></div><span>● ONLINE</span></section>' + (clanSubpage ? '<button class="community-back" onclick="openCommunity(\'clans\')">‹ Назад к кланам</button>' : tabsHtml()) + body + '</div>');
    setTimeout(function () { var chat = document.getElementById('communityChat'); if (chat) chat.scrollTop = chat.scrollHeight; }, 120);
  }

  async function load(nextTab) {
    if (loading) return;
    tab = nextTab || tab;
    loading = true;
    render('<div class="app community-app">' + head('Сообщество') + '<div class="community-loading"><span></span><b>Подключаемся к AutoFlip Online…</b></div></div>');
    try {
      await api('POST', { action: 'sync', reputation: Number(state.rep || 0), city: state.city || 'Москва' });
      var data = await api('GET', null, '?channel=' + encodeURIComponent(channel()));
      renderCommunity(data);
    } catch (error) {
      render('<div class="app community-app">' + head('Сообщество') + '<div class="community-error"><b>Нет соединения с чатом</b><p>' + esc(errorText(error.message)) + '</p><button class="action green" onclick="openCommunity(\'' + tab + '\')">Повторить</button></div></div>');
    } finally {
      loading = false;
    }
  }

  async function action(data) {
    try {
      await api('POST', data);
      await load(tab);
    } catch (error) {
      alert(errorText(error.message));
    }
  }

  window.openCommunity = load;
  window.communityRegion = function (city) { region = city; load('region'); };
  window.communitySend = function () {
    var input = document.getElementById('communityMessage'), message = String(input && input.value || '').trim();
    if (!message) return;
    action({ action: 'send', channel: channel(), message: message });
  };
  window.communityCreateClan = function () {
    var name = document.getElementById('clanName'), tag = document.getElementById('clanTag');
    action({ action: 'create_clan', name: name && name.value, tag: tag && tag.value });
  };
  window.communityJoinClan = function (id) { action({ action: 'join_clan', clanId: id }); };
  window.communityLeaveClan = function () { if (confirm('Выйти из клана?')) action({ action: 'leave_clan' }); };
  window.communityDeleteClan = function () { if (confirm('Удалить клан без возможности восстановления?')) action({ action: 'delete_clan' }); };
  window.communitySetRole = function (userId, role) {
    var text = role === 'coleader' ? 'Назначить участника соруководителем?' : 'Вернуть должность участника?';
    if (confirm(text)) action({ action: 'set_role', userId: userId, role: role });
  };
  window.communityKickMember = function (userId) {
    if (confirm('Исключить участника из клана?')) action({ action: 'kick_member', userId: userId });
  };
  window.communityOpenProfile = async function (userId) {
    if (!userId || loading) return;
    loading = true;
    render('<div class="app community-app">' + head('Профиль игрока') + '<div class="community-loading"><span></span><b>Открываем гараж игрока…</b></div></div>');
    try {
      var data = await api('GET', null, '?profile=' + encodeURIComponent(userId));
      renderPlayerProfile(data.player);
    } catch (error) {
      render('<div class="app community-app">' + head('Профиль игрока') + '<button class="community-back" onclick="communityCloseProfile()">‹ Вернуться назад</button><div class="community-error"><b>Профиль не открылся</b><p>' + esc(errorText(error.message)) + '</p></div></div>');
    } finally {
      loading = false;
    }
  };
  window.communityCloseProfile = function () { load(tab); };
  window.communityCopyId = function (id) {
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(String(id || '')).catch(function () {});
  };

  async function pollMessages() {
    var chat = document.getElementById('communityChat');
    if (!chat || loading || pollBusy || ['global', 'region', 'clan_chat'].indexOf(tab) < 0) return;
    pollBusy = true;
    try {
      var data = await api('GET', null, '?channel=' + encodeURIComponent(channel()));
      var nextSignature = messageSignature(data);
      snapshot = data;
      decorateAccountName();
      if (chat.dataset.signature !== nextSignature) {
        var atBottom = chat.scrollHeight - chat.scrollTop - chat.clientHeight < 55;
        chat.innerHTML = messageRows(data);
        chat.dataset.signature = nextSignature;
        if (atBottom) chat.scrollTop = chat.scrollHeight;
      }
    } catch (error) {
      // A temporary network error should not replace the open chat or draft.
    } finally {
      pollBusy = false;
    }
  }

  function mountCommunityApp() {
    var apps = document.querySelector('.apps');
    if (!apps || document.getElementById('communityApp')) return;
    var button = document.createElement('button');
    button.id = 'communityApp';
    button.setAttribute('onclick', 'openCommunity(\'global\')');
    button.innerHTML = '<div class="icon community-icon">◎</div><small>Сообщество</small>';
    apps.appendChild(button);
    decorateAccountName();
  }

  var baseHome = window.home;
  if (typeof baseHome === 'function') window.home = function () {
    var result = baseHome.apply(this, arguments);
    setTimeout(mountCommunityApp, 140);
    return result;
  };
  setTimeout(mountCommunityApp, 180);
  // Fetch the clan tag once per page load so it is visible beside the nickname
  // even before the player opens the Community application.
  setTimeout(function () {
    api('GET', null, '?channel=global').then(function (data) {
      snapshot = data;
      decorateAccountName();
    }).catch(function () {});
  }, 450);
  (typeof startVisibleInterval === 'function' ? startVisibleInterval : function (fn, delay) { return setInterval(fn, delay); })(pollMessages, 8000);
})();
