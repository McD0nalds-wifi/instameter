# CLAUDE.md

## Обзор проекта

Instameter — офлайн-PWA, которая по EXIF снимка с телефона советует диафрагму, экспокоррекцию
и вспышку для камер моментальной печати (Instax, Lomo'Instant, Polaroid). Бэкенда, аккаунтов
и сетевых запросов в рантайме нет: всё живёт в браузере, данные — в IndexedDB.

Стек: React 19, Vite 8, TypeScript 6 (strict), HeroUI v3 + Tailwind v4, Jotai, wouter, idb,
valibot, exifr, vite-plugin-pwa, FSD + Steiger, Vitest, Playwright, Yarn 4, Node 24.

> Продукт, требования, архитектура, модель данных и алгоритм — в `docs/`.
> Перед правкой кода хук `doc-map-precheck` потребует прочитать привязанную документацию.

### Документация

| Док | О чём |
|---|---|
| `docs/product.md` | Цель, рамки, критерии успеха, сценарии |
| `docs/requirements.md` | FR и НФТ, план итераций с оценками |
| `docs/architecture.md` | Стек, FSD-раскладка, состояние и гидратация, base path, тема |
| `docs/data-model.md` | Типы, схема IndexedDB, миграции, валидация |
| `docs/exposure-engine.md` | Алгоритм совета и эталонная таблица |
| `docs/catalog.md` | Каталог камер и источники спеков |
| `docs/styling.md` | Tailwind, токены HeroUI, тема, UI-правила |
| `docs/testing.md` | Слои верификации, правила тестов, офлайн-тест |
| `docs/deployment.md` | Сборка, service worker, манифест, ловушки, телефон |
| `docs/risks.md` | Риски и открытые вопросы |
| `docs/code-review.md` | Чеклист ревью |

Индекс для выборочного чтения — `docs/doc-map.json` (скилл `doc-map-reading`).
Ревью диффа — скилл `pr-review`.

## Правила разработки

### TypeScript
- `strict: true` и `noUncheckedIndexedAccess: true` — не отключать
- `import type { Foo }` для типовых импортов
- Типы из React импортировать напрямую: `import type { ChangeEvent } from 'react'`, не `React.ChangeEvent`
- Типы данных выводить из схем valibot (`v.InferOutput`), не дублировать руками

### Стиль кода
- Функции — стрелочные выражения: `const foo = () => {}`
- Компоненты — `const MyComponent: FC<Props> = ({ prop }) => {}`
- Именованные колбэки вместо инлайн-лямбд при нетривиальной логике
- Не сокращать имена параметров: `event` вместо `e`, `error` вместо `err` и т.д.
- Итерация — методы массивов (`map`, `filter`, `reduce`, `find`, `some`, `every`, `forEach` и т.д.), не циклы `for`/`for...of`
- Деструктуризация в `map`: `({ id, name }) => ...`
- Текст в UI — через Typography HeroUI (`Heading`, `Paragraph`, `Typography`), не сырые `<span>`/`<p>`/`<h1>`
- Стили — Tailwind-классы в JSX. CSS Modules и inline `style={{}}` не используются
- Цвета — только токены HeroUI (`bg-background`, `text-muted`, `text-accent`…). Произвольные
  значения (`bg-[#fff]`) и палитра Tailwind (`bg-red-500`) запрещены линтером
- Все строки интерфейса — в `src/shared/config/strings.ts`; склонения — `pluralize`

### Комментарии
- **Комментариев в коде нет.** Ни `//`, ни `/* */`, ни JSDoc — включая тесты, типы и поля
  интерфейсов. Исключение — triple-slash директивы `/// <reference types>`
- Исключение одно: пользователь явно попросил прокомментировать конкретное место
- Всё, что хотелось бы объяснить — «почему», внешнее ограничение, ловушка, — пишется в доку
  из `docs/` и находится по `codePaths` в `doc-map.json`
- Нечитаемый без пояснения код переписывается: имя переменной, выделенная функция или ранний
  `return` объясняют лучше комментария, который разойдётся с кодом

### Структура компонентов
- Render-функции внутри компонента (`const renderFoo = () => <JSX />`) — только в крайнем случае.
  Вместо них: отдельный компонент с ранними `return` либо условный JSX по месту.
  Исключение — render-пропсы библиотек
- Каждый нетривиальный компонент — в своей поддиректории (camelCase)
- Корневой компонент страницы — прямо в `ui/`, без обёртки
- Public API (`index.ts`) — на уровне слайса, не внутри `ui/`
- Именование слайсов — по сущности (`myCameras`), компонентов страниц — с суффиксом `Page`

### FSD (контролируется Steiger)
- Импорты сверху вниз: `app → pages → widgets → features → entities → shared`
- Нет кросс-импортов между слайсами одного слоя
- В `app` нет сегментов `ui` и `providers`: оболочка — `widgets/appShell`
- Движок рекомендаций (`shared/lib/exposure`) — чистые функции без React, Jotai и IndexedDB

### Состояние и данные
- IndexedDB — источник правды, атомы Jotai — кэш. Запись — через write-атом: сначала БД, потом атом
- `shared/api/db` хранит значения как `unknown`; сущность валидирует их схемой valibot при чтении,
  битая запись пропускается с `console.warn`
- Миграции только аддитивные: новая — в конец массива, существующие не трогать
- Гидратация атомов — в `bootstrap` до первого рендера, без Suspense
- Сетевых запросов в рантайме нет

### Тесты
- `__tests__/` рядом с модулем, файл `moduleName.test.ts(x)`
- Описания `describe`/`it` — на русском языке
- Один рендер на тест
- `userEvent` — только через `setupUser()` из `@/shared/lib/testing`
- Компоненты с атомами — в своём Jotai `Provider` со свежим `createStore()`
- IndexedDB — `fake-indexeddb` (подключён в `setupTests.ts`), база с уникальным именем на тест
- Правки PWA-обвязки (`vite.config.ts`, регистрация SW) — прогонять `yarn test:e2e`

## Команды

```bash
yarn dev            # Dev-сервер
yarn dev:https      # Dev-сервер по HTTPS (сертификаты mkcert в certs/)
yarn build          # Сборка (VITE_BASE=/sub/ — для подпапки)
yarn preview        # Предпросмотр сборки
yarn typecheck      # TypeScript
yarn lint           # ESLint
yarn steiger        # FSD-линтер
yarn test           # Vitest
yarn test:e2e       # Playwright: офлайн smoke-тест
yarn size           # Бюджет бандла (после build)
yarn doc-map        # Пересборка индекса документации
```

## Git

- Ветка по умолчанию — `main`; ветки `feature/…`, `fix/…`, `chore/…`
- Коммиты — английское повелительное предложение с заглавной буквы, без префиксов
  conventional commits: `Add theme switcher`
- pre-commit (husky + lint-staged): Prettier и `eslint --fix` по изменённым `*.ts(x)`
