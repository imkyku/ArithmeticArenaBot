# Production Deployment Playbook: Telegram Mini App (jewlab.online) на Debian 12

> Этот документ — практическая пошаговая инструкция для прод-развертывания вашего проекта (`apps/web`, `apps/api`, `packages/shared`) на одном Debian 12 сервере с публичным IP и уже установленным Nginx.

---

## 1. Overview of the final production architecture (Обзор финальной прод-архитектуры)

### Что строим

- **Домен:** `jewlab.online` (и опционально `www.jewlab.online`).
- **Frontend (Vite build):** статические файлы из `apps/web/dist`, раздаются Nginx.
- **Backend (NestJS + Socket.IO):** процесс Node.js под systemd, слушает `127.0.0.1:3000`.
- **MongoDB:** локально на сервере, слушает только loopback/private interface, с включенной auth.
- **Redis:** локально на сервере, слушает только loopback/private interface.
- **TLS:** Let's Encrypt (certbot + nginx plugin).
- **Reverse proxy:** Nginx:
  - `/api/*` → NestJS
  - `/socket.io/*` → NestJS (WebSocket/long-polling)
  - `/` → статический frontend

### Почему это production-safe

- Никаких публичных портов Mongo/Redis.
- Приложение не запускается от root.
- Секреты хранятся в backend env-файле с правами `640`.
- HTTPS обязателен (критично для Telegram Mini App в проде).
- Авторитативная логика игры остаётся на backend.

---

## 2. Assumptions and prerequisites (Предпосылки и требования)

### Предполагаем

1. Есть Debian 12 сервер с публичным белым IP.
2. У вас есть root/sudo доступ по SSH.
3. Nginx уже установлен.
4. Репозиторий вашего проекта доступен (GitHub/GitLab/локальный архив).
5. Домен `jewlab.online` контролируется вами (доступ к DNS).
6. Telegram bot уже создан через BotFather.

### Проверки перед началом

```bash
uname -a
cat /etc/debian_version
whoami
sudo -v
nginx -v
```

Ожидаемо: Debian 12, nginx установлен, sudo работает.

---

## 3. DNS setup for jewlab.online (Настройка DNS)

### Что сделать у DNS-провайдера

Создайте записи:

- `A @ -> <PUBLIC_SERVER_IP>`
- (опционально) `A www -> <PUBLIC_SERVER_IP>`

TTL: 300 (на время миграции), после стабилизации можно 3600.

### Проверка с локальной машины

```bash
dig +short jewlab.online A
dig +short www.jewlab.online A
```

Обе должны вернуть IP сервера.

### Частые проблемы

- **Пустой ответ dig:** запись не создана/не распространилась.
- **Неверный IP:** отредактируйте A-record.
- **Cloudflare proxy mode включен до SSL:** для первичной выдачи certbot проще временно DNS-only.

---

## 4. Server preparation on Debian 12 (Подготовка сервера)

### Обновление пакетов и базовая гигиена

```bash
sudo apt update
sudo apt -y full-upgrade
sudo apt -y autoremove --purge
sudo timedatectl set-timezone UTC
sudo timedatectl status
```

Почему: актуальные патчи безопасности + консистентные таймстемпы логов.

### Создание sudo-пользователя (если работаете под root)

```bash
adduser deployer
usermod -aG sudo deployer
```

Проверьте вход под `deployer` и только потом ограничивайте root login.

---

## 5. Installing base packages (Установка базовых пакетов)

```bash
sudo apt update
sudo apt install -y \
  ca-certificates \
  curl \
  wget \
  gnupg \
  lsb-release \
  git \
  unzip \
  jq \
  htop \
  vim \
  ufw \
  fail2ban \
  certbot \
  python3-certbot-nginx
```

### Включение автоматических security-обновлений

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 6. Installing Node.js (Установка Node.js LTS)

### Рекомендуемый путь: NodeSource (Node 22 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
```

Проверка:

```bash
node -v
npm -v
```

### Почему pnpm

Ваш монорепо уже ориентирован на pnpm workspaces — оставляем pnpm.

```bash
sudo corepack enable
corepack prepare pnpm@9.12.0 --activate
pnpm -v
```

Если corepack не тянет пакет из-за сети, временный fallback:

```bash
sudo npm i -g pnpm@9.12.0
pnpm -v
```

### ВАЖНО про lockfile (исправляет вашу ошибку `ERR_PNPM_NO_LOCKFILE`)

В репозитории должен быть **закоммичен** `pnpm-lock.yaml`.

- На **CI/production** используйте `pnpm install --frozen-lockfile` (строгая воспроизводимость).
- Если lockfile отсутствует (первый деплой/старый репозиторий), выполните один раз:

```bash
cd /opt/arena/current
pnpm install --no-frozen-lockfile
```

После этого обязательно:

1. Закоммитьте `pnpm-lock.yaml` в репозиторий.
2. Со следующего деплоя вернитесь к `--frozen-lockfile`.

---

## 7. Installing and securing MongoDB (Установка и защита MongoDB)

### 7.1. Рекомендуемый production-путь на Debian 12

Используем официальный репозиторий MongoDB Community (например 7.0).

```bash
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor

echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] \
https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

sudo apt update
sudo apt install -y mongodb-org
```

### 7.2. Базовый безопасный конфиг

Откройте:

```bash
sudo vim /etc/mongod.conf
```

Минимум должно быть:

```yaml
storage:
  dbPath: /var/lib/mongodb

net:
  port: 27017
  bindIp: 127.0.0.1

security:
  authorization: enabled

systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
```

> `bindIp: 127.0.0.1` — ключевой пункт, чтобы база не слушала внешний интерфейс.

Запуск:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mongod
sudo systemctl restart mongod
sudo systemctl status mongod --no-pager
```

### 7.3. Создание least-privilege пользователя БД

1) Временно (если нужно) создайте root/admin пользователя:

```bash
mongosh
```

В shell:

```javascript
use admin
db.createUser({
  user: "mongoAdmin",
  pwd: "CHANGE_ME_STRONG_ADMIN_PASSWORD",
  roles: [ { role: "root", db: "admin" } ]
})
```

2) Создайте отдельного пользователя приложения:

```bash
mongosh -u mongoAdmin -p --authenticationDatabase admin
```

```javascript
use arena
db.createUser({
  user: "arenaApp",
  pwd: "CHANGE_ME_STRONG_APP_PASSWORD",
  roles: [ { role: "readWrite", db: "arena" } ]
})
```

Строка подключения NestJS:

```text
mongodb://arenaApp:CHANGE_ME_STRONG_APP_PASSWORD@127.0.0.1:27017/arena?authSource=arena
```

### 7.4. Firewall и публичная недоступность

Не открывайте порт 27017 наружу. Ни в UFW, ни у cloud firewall.

Проверка локально:

```bash
ss -tulpen | grep 27017
```

Ожидаемо: слушает `127.0.0.1:27017`.

### 7.5. TLS для MongoDB

- Если БД только на localhost того же хоста — TLS не обязателен, но желателен в строгих политиках.
- Если Mongo вынесена на отдельный узел/private network — обязательно TLS + mTLS/ACL.

### 7.6. Бэкапы MongoDB

Пример ежедневного дампа:

```bash
mkdir -p /opt/backups/mongo
mongodump \
  --uri="mongodb://arenaApp:***@127.0.0.1:27017/arena?authSource=arena" \
  --archive=/opt/backups/mongo/arena-$(date +%F-%H%M).archive \
  --gzip
```

Ротация (хранить 14 дней):

```bash
find /opt/backups/mongo -type f -name '*.archive' -mtime +14 -delete
```

### 7.7. Проверка индексов

```bash
mongosh "mongodb://arenaApp:***@127.0.0.1:27017/arena?authSource=arena"
```

```javascript
use arena
db.users.getIndexes()
db.ratings.getIndexes()
db.matches.getIndexes()
db.matchmoves.getIndexes()
```

---

## 8. Installing and securing Redis (Установка и защита Redis)

### 8.1 Установка

```bash
sudo apt update
sudo apt install -y redis-server
```

### 8.2 Безопасная конфигурация

```bash
sudo vim /etc/redis/redis.conf
```

Проверьте/измените:

```conf
bind 127.0.0.1 ::1
port 6379
protected-mode yes
supervised systemd
appendonly yes
```

Опционально пароль:

```conf
requirepass CHANGE_ME_STRONG_REDIS_PASSWORD
```

Перезапуск:

```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
sudo systemctl status redis-server --no-pager
```

Проверка:

```bash
redis-cli ping
# если requirepass включен:
redis-cli -a 'CHANGE_ME_STRONG_REDIS_PASSWORD' ping
```

Ожидаемо: `PONG`.

### 8.3 Redis URL для NestJS

Без пароля:

```text
redis://127.0.0.1:6379
```

С паролем:

```text
redis://:CHANGE_ME_STRONG_REDIS_PASSWORD@127.0.0.1:6379
```

---

## 9. Creating Linux users and directories for deployment (Пользователи и директории)

### 9.1 Отдельный системный пользователь

```bash
sudo adduser --system --group --home /opt/arena arena
```

### 9.2 Структура директорий

```bash
sudo mkdir -p /opt/arena/{releases,shared,logs,backups}
sudo chown -R arena:arena /opt/arena
sudo chmod 750 /opt/arena
```

Рекомендуемая схема:

- `/opt/arena/releases/<timestamp>` — каждый релиз
- `/opt/arena/current` — symlink на текущий релиз (рекомендуемое имя, чтобы не конфликтовать с реальной директорией)
- `/opt/arena/shared/.env.api` — постоянные секреты
- `/opt/arena/logs` — дополнительные app-логи (если не только journald)

---

## 10. Uploading or cloning the project (Загрузка проекта)

### Вариант A: Git clone на сервере

```bash
sudo -u arena -H bash -lc 'cd /opt/arena/releases && mkdir -p $(date +%Y%m%d%H%M%S)'
REL=$(sudo -u arena -H bash -lc 'ls -1 /opt/arena/releases | tail -n1')

sudo -u arena -H bash -lc "cd /opt/arena/releases/$REL && git clone <YOUR_REPO_URL> ."

sudo ln -sfn /opt/arena/releases/$REL /opt/arena/current
sudo chown -h arena:arena /opt/arena/current
```

### Вариант B: rsync с CI runner/локальной машины

```bash
rsync -az --delete ./ deployer@jewlab.online:/opt/arena/releases/<release-id>/
```

---

## 11. Environment variables design (Дизайн env-переменных)

### 11.1 Разделение public vs secret

- **Frontend public vars** (`VITE_*`) — могут попасть в клиентский bundle.
- **Backend vars** — содержат секреты, НИКОГДА не публикуются во frontend.

### 11.2 Backend env-файл

Путь: `/opt/arena/shared/.env.api`

```bash
sudo tee /opt/arena/shared/.env.api > /dev/null <<'ENVFILE'
NODE_ENV=production
PORT=3000
APP_BASE_URL=https://jewlab.online

MONGO_URI=mongodb://arenaApp:CHANGE_ME_STRONG_APP_PASSWORD@127.0.0.1:27017/arena?authSource=arena
REDIS_URL=redis://:CHANGE_ME_STRONG_REDIS_PASSWORD@127.0.0.1:6379

TELEGRAM_BOT_TOKEN=123456789:AA...REPLACE...
TELEGRAM_BOT_USERNAME=YourBotName

# если используете внутренние JWT сессии:
JWT_SECRET=CHANGE_ME_64+_CHARS_RANDOM

# ограничить CORS на боевой домен:
CORS_ORIGIN=https://jewlab.online
ENVFILE
```

Права:

```bash
sudo chown arena:arena /opt/arena/shared/.env.api
sudo chmod 640 /opt/arena/shared/.env.api
```

### 11.3 Frontend env (публичный)

`/opt/arena/current/apps/web/.env.production` (или внутри конкретного релиза, например `/opt/arena/releases/20260306143131/apps/web/.env.production`):

```env
VITE_API_URL=https://jewlab.online/api
VITE_WS_URL=https://jewlab.online
```

> Секреты (`TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, `MONGO_URI`) **никогда** не должны быть в `VITE_*`.

---

## 12. Building the frontend and backend (Сборка фронтенда и бэкенда)

Выполняем от пользователя `arena`:

```bash
sudo -u arena -H bash -lc '
  cd /opt/arena/current
  corepack enable || true
  corepack prepare pnpm@9.12.0 --activate || true
  pnpm install --frozen-lockfile
  pnpm --filter @arena/shared build
  pnpm --filter @arena/api build
  pnpm --filter @arena/web build
'
```

Если получили `ERR_PNPM_NO_LOCKFILE`, выполните **одноразовый recovery**:

```bash
sudo -u arena -H bash -lc '
  cd /opt/arena/current
  pnpm install --no-frozen-lockfile
  pnpm --filter @arena/shared build
  pnpm --filter @arena/api build
  pnpm --filter @arena/web build
'
```

И затем зафиксируйте `pnpm-lock.yaml` в git (иначе ошибка повторится на следующем сервере/релизе).

Проверка артефактов:

```bash
sudo -u arena -H bash -lc 'ls -lah /opt/arena/current/apps/api/dist/main.js'
sudo -u arena -H bash -lc 'ls -lah /opt/arena/current/apps/web/dist'
```

Если `main.js` не найден — проверьте `apps/api/tsconfig.json` и build script.

---


### 12.1 Быстрый фикс именно для вашей ошибки `ERR_PNPM_NO_PKG_MANIFEST`

Если в системе уже получилась структура вида `/opt/arena/app/20260306143131` (т.е. `app` — обычная папка, не symlink), выполните:

```bash
# 1) Найти фактический корень релиза (где лежит package.json)
find /opt/arena -maxdepth 4 -type f -name package.json

# 2) Сделать рекомендованный symlink current -> release
sudo ln -sfn /opt/arena/app/20260306143131 /opt/arena/current
sudo chown -h arena:arena /opt/arena/current

# 3) Запускать install/build из /opt/arena/current
sudo -u arena -H bash -lc '
  cd /opt/arena/current
  pnpm install --no-frozen-lockfile
  pnpm --filter @arena/shared build
  pnpm --filter @arena/api build
  pnpm --filter @arena/web build
'
```

Почему произошла ошибка: (1) команда выполнялась не в корне релиза, где лежит `package.json`; (2) в репозитории отсутствовал `pnpm-lock.yaml`, а вы запускали `--frozen-lockfile`.

## 13. Running the backend with systemd (Запуск backend через systemd)

### Почему systemd (рекомендация по умолчанию)

- Нативен для Debian, меньше лишних зависимостей.
- Автостарт, рестарт-политика, интеграция с journald.
- Проще для prod, чем PM2, когда нужен predictable ops.

### 13.1 Unit-файл

`/etc/systemd/system/arena-api.service`

```ini
[Unit]
Description=Arithmetic Arena NestJS API
After=network.target mongod.service redis-server.service
Wants=mongod.service redis-server.service

[Service]
Type=simple
User=arena
Group=arena
WorkingDirectory=/opt/arena/current
EnvironmentFile=/opt/arena/shared/.env.api
ExecStart=/usr/bin/node /opt/arena/current/apps/api/dist/main.js
Restart=always
RestartSec=3
KillSignal=SIGTERM
TimeoutStopSec=30
LimitNOFILE=65535
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full
ProtectHome=true
ReadWritePaths=/opt/arena

[Install]
WantedBy=multi-user.target
```

### 13.2 Запуск

```bash
sudo systemctl daemon-reload
sudo systemctl enable arena-api
sudo systemctl start arena-api
sudo systemctl status arena-api --no-pager
```

### 13.3 Логи

```bash
sudo journalctl -u arena-api -f
sudo journalctl -u arena-api --since "30 min ago"
```

Если рестарт-луп:

```bash
sudo systemctl show arena-api -p NRestarts
```

---

## 14. Serving the frontend in production (Раздача фронтенда)

### Предпочтительный путь

Раздавать `apps/web/dist` напрямую Nginx.

Почему:

- Быстрее и проще, чем держать отдельный Node-процесс для статиков.
- Легко настраивать cache headers.
- Меньше точек отказа.

### Копирование сборки в стабильный путь

```bash
sudo mkdir -p /var/www/arena-web
sudo rsync -a --delete /opt/arena/current/apps/web/dist/ /var/www/arena-web/
sudo chown -R www-data:www-data /var/www/arena-web
```

---

## 15. Nginx reverse proxy configuration (Nginx конфиг)

Создайте файл `/etc/nginx/sites-available/jewlab.online`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name jewlab.online www.jewlab.online;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://jewlab.online$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name jewlab.online;

    # certbot заполнит пути сертификатов
    ssl_certificate /etc/letsencrypt/live/jewlab.online/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jewlab.online/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;

    root /var/www/arena-web;
    index index.html;

    client_max_body_size 2m;

    # Безопасные заголовки
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml+rss image/svg+xml;
    gzip_min_length 1024;

    # API proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # Socket.IO WebSocket + polling
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # Кэш статики Vite (hashed files)
    location ~* \.(?:js|mjs|css|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, max-age=2592000, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri /index.html;
    }
}
```

Активируйте:

```bash
sudo ln -sfn /etc/nginx/sites-available/jewlab.online /etc/nginx/sites-enabled/jewlab.online
sudo nginx -t
sudo systemctl reload nginx
```

Если `nginx -t` упал — не reload, исправьте синтаксис.

---

## 16. Enabling WebSocket support for Socket.IO (WebSocket для Socket.IO)

Критичные параметры уже в `/socket.io/` location:

- `proxy_http_version 1.1`
- `Upgrade` и `Connection "upgrade"`
- увеличенные `proxy_read_timeout`/`proxy_send_timeout`

### Проверка handshake

```bash
curl -i "https://jewlab.online/socket.io/?EIO=4&transport=polling"
```

Ожидаемо: `200` и payload наподобие `0{"sid":...`.

Если 400/502 — см. раздел troubleshooting.

---

## 17. Obtaining and installing Let's Encrypt SSL certificates (Let's Encrypt)

### 17.1 Выпуск сертификата

```bash
sudo certbot --nginx -d jewlab.online -d www.jewlab.online
```

Certbot предложит redirect HTTP→HTTPS — выбирайте redirect.

### 17.2 Проверка автопродления

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

### 17.3 Если выпуск не проходит

Проверить:

1. DNS указывает на сервер.
2. Порты 80/443 открыты.
3. Nginx доступен извне.
4. Нет конфликтующего server_name.

Логи:

```bash
sudo tail -n 200 /var/log/letsencrypt/letsencrypt.log
```

---

## 18. Configuring the Telegram Mini App production URL (Настройка URL Mini App)

### Куда должен указывать Mini App URL

- Прод URL: `https://jewlab.online`
- Только HTTPS с валидным сертификатом.

### Настройка через BotFather

Обычно:

1. `/mybots` → выбрать бота.
2. Bot Settings → Menu Button / Web App.
3. Указать URL: `https://jewlab.online`.

(Точное меню у BotFather может меняться, но принцип тот же — Web App URL на HTTPS домен.)

### Важная backend часть

- На backend **обязательно** валидировать `initDataRaw` по HMAC (бот-токен) и `auth_date` TTL.
- Нельзя доверять `user.id` с клиента без проверки.

### Проверка auth flow

1. Открыть Mini App из Telegram.
2. Проверить успешный `POST /api/auth/telegram`.
3. Убедиться, что user создаётся/обновляется в Mongo.
4. Проверить, что запросы с подменённым hash отклоняются.

---

## 19. Verifying the deployment step by step (Пошаговая верификация)

### Stage A: инфраструктура

```bash
sudo systemctl is-active nginx mongod redis-server arena-api
```

Все должны быть `active`.

### Stage B: локальные проверки API

```bash
curl -i http://127.0.0.1:3000/api/health
curl -i https://jewlab.online/api/health
```

Ожидаемо: HTTP 200 + JSON status.

### Stage C: фронтенд

```bash
curl -I https://jewlab.online
```

Ожидаемо: `200`, `content-type: text/html`.

### Stage D: WebSocket/Socket.IO

```bash
curl -i "https://jewlab.online/socket.io/?EIO=4&transport=polling"
```

### Stage E: Telegram

- Открыть Mini App внутри Telegram.
- Проверить отсутствие mixed content.
- Проверить auth bootstrap и загрузку меню.

### Stage F: безопасность

```bash
sudo ufw status verbose
ss -tulpen | egrep ':22|:80|:443|:27017|:6379|:3000'
```

Ожидаемо наружу доступны только 22/80/443.

---

## 20. Common production mistakes and how to avoid them (Частые ошибки)

1. **MongoDB слушает 0.0.0.0** → всегда `bindIp: 127.0.0.1`.
2. **Redis без protected-mode/пароля** → включить `protected-mode yes`, по возможности ACL/password.
3. **Секреты в frontend env** → backend-only.
4. **Неверный proxy_pass для /api/** → следите за trailing slash.
5. **Нет WebSocket upgrade headers** → Socket.IO не работает.
6. **Слишком агрессивный CSP ломает Telegram WebApp** → вводите CSP постепенно и тестируйте в Telegram.
7. **Приложение от root** → только отдельный user (`arena`).
8. **Нет health checks и rollback-плана** → релизный процесс должен быть предсказуемым.

---

## 21. Logging, monitoring, and troubleshooting (Логи, мониторинг, отладка)

### 21.1 Где смотреть логи

- Nginx access/error:

```bash
sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
```

- Backend (systemd/journald):

```bash
sudo journalctl -u arena-api -f
```

- MongoDB:

```bash
sudo tail -f /var/log/mongodb/mongod.log
```

- Redis:

```bash
sudo journalctl -u redis-server -f
```

### 21.2 Диагностика типовых проблем

#### DNS не резолвится

```bash
dig +short jewlab.online A
```

Исправить A-record, подождать TTL.

#### nginx config test fail

```bash
sudo nginx -t
```

Ошибка покажет файл/строку.

#### certbot challenge fail

Проверить доступность `http://jewlab.online/.well-known/acme-challenge/...` и порт 80.

#### WebSocket 400/502

- backend не работает: `sudo systemctl status arena-api`
- неправильный `/socket.io/` location
- mismatch path на клиенте и сервере

#### backend не стартует

```bash
sudo journalctl -u arena-api -n 200 --no-pager
```

Обычно: env отсутствует, порт занят, ошибка сборки.

#### Mongo connection failure

Проверить `MONGO_URI`, authSource, пароль, `mongod` status.

#### Redis connection failure

Проверить `REDIS_URL`, `requirepass`, `redis-cli ping`.

#### Mini App открывается, но auth падает

- неверный `TELEGRAM_BOT_TOKEN`
- просроченный `auth_date`
- ошибочный HMAC алгоритм/строка
- кривой reverse proxy (тело запроса не доходит)

#### Frontend грузится, API нет

Проверить `VITE_API_URL=https://jewlab.online/api`, Nginx `/api/`, CORS.

#### Mixed content

Все URL только `https://`.

#### Permission denied

Проверить owner/group на `/opt/arena` и env файлы.

#### systemd restart loops

```bash
sudo systemctl show arena-api -p NRestarts
```

Исправить причину, затем `sudo systemctl restart arena-api`.

---

## 22. Backups and recovery (Бэкапы и восстановление)

### 22.1 Что бэкапить

1. MongoDB данные.
2. `/opt/arena/shared/.env.api` (в защищённое хранилище).
3. Nginx configs: `/etc/nginx/sites-available/jewlab.online`.
4. systemd unit: `/etc/systemd/system/arena-api.service`.

### 22.2 Cron для mongo backup

`sudo crontab -e`:

```cron
15 3 * * * /usr/bin/mongodump --uri="mongodb://arenaApp:***@127.0.0.1:27017/arena?authSource=arena" --archive=/opt/backups/mongo/arena-$(date +\%F-\%H\%M).archive --gzip
30 3 * * * /usr/bin/find /opt/backups/mongo -type f -name '*.archive' -mtime +14 -delete
```

### 22.3 Тест восстановления (обязательно)

На staging/временной БД:

```bash
mongorestore --uri="mongodb://..." --archive=/opt/backups/mongo/<file>.archive --gzip --drop
```

---

## 23. Updating / redeploying the project safely (Обновление и редеплой)

### Рекомендуемый flow (blue/green-lite через releases + symlink)

1. Создать новый release каталог.
2. Залить код.
3. `pnpm install && build`.
4. Обновить frontend статику в `/var/www/arena-web`.
5. Переключить `/opt/arena/current` symlink.
6. `systemctl restart arena-api`.
7. Smoke tests.
8. Если ошибка — откатить symlink назад и restart.

### Пример

```bash
NEW_REL=$(date +%Y%m%d%H%M%S)
sudo -u arena mkdir -p /opt/arena/releases/$NEW_REL
# ... загрузить код в /opt/arena/releases/$NEW_REL ...

sudo -u arena -H bash -lc "cd /opt/arena/releases/$NEW_REL && pnpm install --frozen-lockfile && pnpm -r build"
sudo rsync -a --delete /opt/arena/releases/$NEW_REL/apps/web/dist/ /var/www/arena-web/

sudo ln -sfn /opt/arena/releases/$NEW_REL /opt/arena/current
sudo systemctl restart arena-api
```

### Zero-downtime заметки

- На одном экземпляре backend идеального zero-downtime нет, но можно минимизировать downtime до секунд.
- Для настоящего zero-downtime — 2+ backend инстанса за upstream/load balancer.

---

## 24. Security hardening checklist (Чеклист hardening)

### 24.1 Firewall (UFW)

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status verbose
```

### 24.2 Fail2ban

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
sudo fail2ban-client status
```

### 24.3 Nginx rate limiting (базовый анти-DDoS)

В `http {}`:

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=20r/s;
```

В `/api/` location:

```nginx
limit_req zone=api_limit burst=40 nodelay;
```

### 24.4 Backend security

- Строгий CORS (`https://jewlab.online`).
- Origin-check для Socket.IO handshake.
- Валидация всех DTO/событий.
- Rate-limit на match operations.
- Telegram init data валидация на сервере.
- Никогда не доверять клиентскому game state.

### 24.5 Секреты и ротация

- Не хранить секреты в git.
- Ротировать `TELEGRAM_BOT_TOKEN`, `JWT_SECRET`, DB passwords по регламенту.
- Ограничить доступ к `.env.api`.

---

## 25. Final go-live checklist (Финальный checklist запуска)

### Перед запуском

- [ ] DNS A-record указывает на сервер.
- [ ] `https://jewlab.online` открывается с валидным сертификатом.
- [ ] `arena-api`, `nginx`, `mongod`, `redis-server` активны.
- [ ] Mongo/Redis не доступны извне.
- [ ] Telegram Mini App URL установлен на `https://jewlab.online`.
- [ ] Backend проверяет `initDataRaw` и TTL.
- [ ] Логи читаются, алерты настроены (хотя бы базовые).

### Compact copy-paste deployment command checklist

```bash
# 0) Base
sudo apt update && sudo apt -y full-upgrade
sudo apt install -y ca-certificates curl gnupg git ufw fail2ban certbot python3-certbot-nginx

# 1) Node
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs build-essential
sudo corepack enable && corepack prepare pnpm@9.12.0 --activate

# 2) Mongo
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] https://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl enable --now mongod

# 3) Redis
sudo apt install -y redis-server
sudo systemctl enable --now redis-server

# 4) App user + dirs
sudo adduser --system --group --home /opt/arena arena
sudo mkdir -p /opt/arena/{releases,shared,logs,backups}
sudo chown -R arena:arena /opt/arena

# 5) Deploy code (example)
sudo -u arena -H bash -lc 'cd /opt/arena/releases && mkdir -p $(date +%Y%m%d%H%M%S)'
# git clone into latest release, then symlink /opt/arena/current

# 6) Build
sudo -u arena -H bash -lc 'cd /opt/arena/current && pnpm install --no-frozen-lockfile && pnpm -r build'
# затем закоммитьте pnpm-lock.yaml; на следующих релизах используйте --frozen-lockfile

# 7) Front static
sudo mkdir -p /var/www/arena-web
sudo rsync -a --delete /opt/arena/current/apps/web/dist/ /var/www/arena-web/

# 8) systemd backend
sudo systemctl daemon-reload
sudo systemctl enable --now arena-api

# 9) Nginx + SSL
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d jewlab.online -d www.jewlab.online

# 10) Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp
sudo ufw enable
```

### First boot smoke test checklist

- [ ] `curl -i https://jewlab.online` → 200
- [ ] `curl -i https://jewlab.online/api/health` → 200
- [ ] `curl -i "https://jewlab.online/socket.io/?EIO=4&transport=polling"` → 200
- [ ] `sudo journalctl -u arena-api -n 100 --no-pager` без критических ошибок
- [ ] Mini App открывается из Telegram и проходит auth
- [ ] Матч стартует, WebSocket события проходят

### Post-launch hardening checklist

- [ ] Ограничен CORS и WebSocket origins
- [ ] Настроен fail2ban
- [ ] Включен unattended-upgrades
- [ ] Добавлены backup + restore drills
- [ ] Добавлен внешний uptime мониторинг (health endpoint)
- [ ] Добавлены алерты по RAM/CPU/disk/log errors
- [ ] Ротация секретов задокументирована

### Rollback checklist

- [ ] Найти предыдущий стабильный release в `/opt/arena/releases/<old>`
- [ ] `ln -sfn /opt/arena/releases/<old> /opt/arena/current`
- [ ] восстановить предыдущий frontend `dist` в `/var/www/arena-web`
- [ ] `sudo systemctl restart arena-api`
- [ ] `curl https://jewlab.online/api/health`
- [ ] проверить логи `journalctl -u arena-api -f`
- [ ] задокументировать причину отката
