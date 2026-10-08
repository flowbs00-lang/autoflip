# AutoFlip: Cloudflare Pages и VK ID

Эта ветка — отдельный безопасный этап миграции. Главная страница по-прежнему показывает заглушку и **не публикует игру**. Тестовый интерфейс входа находится по адресу `/login/`.

## Настройка Pages

Проект Pages подключён к репозиторию `flowbs00-lang/autoflip` и ветке `cloudflare-vk-auth`.

- Build command: `exit 0`
- Build output directory: `cloudflare`
- Root directory: пусто (корень репозитория)
- Production URL: `https://autoflip.pages.dev`
- VK ID callback: `https://autoflip.pages.dev/auth/vk/callback`

Каталог `/functions` должен оставаться в корне репозитория: Cloudflare автоматически собирает из него Pages Functions.

## D1

1. Создать базу `autoflip-prod` в Cloudflare D1.
2. Добавить к Pages-проекту D1 binding с именем `DB`.
3. Выполнить SQL из `migrations/0001_auth.sql` в консоли D1.
4. Перезапустить deployment, чтобы binding применился.

## Реализовано

- авторизация через официальный VK ID;
- уникальный никнейм и внутренний ID игрока;
- серверные сессии в защищённых HttpOnly-cookie;
- схема D1 для аккаунтов, сессий и облачных сохранений;
- защита входа и запросов от подделки;
- закрытый доступ к незавершённой игре;
- мобильный интерфейс входа и создания профиля.

## Безопасность

Используется OAuth 2.1 с PKCE. Закрытый ключ VK ID не нужен и не хранится ни в GitHub, ни в браузере, ни в Cloudflare. Сервер самостоятельно перепроверяет краткоживущий токен через VK ID и выдаёт отдельную случайную сессию AutoFlip.
