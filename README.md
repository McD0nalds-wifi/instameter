# Instameter

Офлайн-PWA, которая по EXIF снимка с телефона советует, какую диафрагму, экспокоррекцию
и вспышку выставить на камере моментальной печати — до того, как кадр за 100 рублей уйдёт
в пересвет. Снимки не покидают устройство, бэкенда и телеметрии нет.

Продукт, требования и архитектура — в [`docs/`](docs/).

## Требования

- Node 24 (`.nvmrc`)
- Yarn 4 — включается через Corepack, версия зафиксирована в `package.json`

## Установка и запуск

```bash
corepack enable
```

```bash
yarn install
```

```bash
yarn dev
```

## Скрипты

| Команда | Что делает |
|---|---|
| `yarn dev` | Dev-сервер на `http://localhost:5173` |
| `yarn dev:https` | Dev-сервер по HTTPS (см. «Проверка на телефоне») |
| `yarn build` | Сборка в `dist/`; `VITE_BASE=/sub/ yarn build` — для деплоя в подпапку |
| `yarn preview` / `yarn preview:https` | Предпросмотр сборки, в том числе service worker |
| `yarn typecheck` | TypeScript |
| `yarn lint` | ESLint |
| `yarn steiger` | Проверка границ FSD |
| `yarn test` | Юнит- и компонентные тесты (Vitest) |
| `yarn test:e2e` | Офлайн smoke-тест (Playwright); перед первым запуском — `yarn playwright install chromium` |
| `yarn size` | Бюджет начального бандла, 200 КБ gzip (после `yarn build`) |
| `yarn doc-map` | Пересборка индекса документации |

## Проверка на телефоне

Service worker и установка PWA работают только в безопасном контексте. `localhost` им считается,
а `http://192.168.…` — нет, поэтому для проверки с телефона нужен HTTPS с доверенным сертификатом.

1. Установить [mkcert](https://github.com/FiloSottile/mkcert) и корневой сертификат на компьютер:

   ```bash
   brew install mkcert
   ```

   ```bash
   mkcert -install
   ```

2. Выпустить сертификат для localhost и IP компьютера в локальной сети (папка `certs/`
   в `.gitignore`):

   ```bash
   mkdir -p certs && mkcert -key-file certs/dev-key.pem -cert-file certs/dev-cert.pem localhost 127.0.0.1 $(ipconfig getifaddr en0)
   ```

3. Перенести корневой сертификат на телефон. Он лежит в папке, которую печатает
   `mkcert -CAROOT`, файл `rootCA.pem`.
   - **iOS:** отправить файл через AirDrop, установить профиль в «Настройки → Основные →
     VPN и управление устройством», затем включить доверие в «Настройки → Основные →
     Об этом устройстве → Доверие сертификатам».
   - **Android:** «Настройки → Безопасность → Шифрование и учётные данные → Установить
     сертификат → Сертификат ЦС».

4. Запустить сервер и открыть на телефоне `https://<IP компьютера>:5173`:

   ```bash
   yarn dev:https
   ```

   Чтобы проверить офлайн и установку на главный экран, нужна сборка с service worker:
   `yarn build && yarn preview:https`, адрес `https://<IP компьютера>:4173`.

## Работа с Claude Code

Правила для агента — в [`CLAUDE.md`](CLAUDE.md). Перед правкой кода хук `doc-map-precheck`
требует прочитать документацию, привязанную к файлу через `docs/doc-map.json`. Ревью диффа —
скилл `pr-review` по чеклисту [`docs/code-review.md`](docs/code-review.md).

## Источники данных

Технические характеристики камер в каталоге — факты из открытых спецификаций производителей,
у каждой модели указана ссылка на источник (см. [`docs/catalog.md`](docs/catalog.md)).

## Лицензия

[MIT](LICENSE)
