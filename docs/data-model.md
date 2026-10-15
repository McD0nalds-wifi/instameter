# Модель данных и хранилище

## Ключевое решение схемы

Камера описывается не набором полей, а набором того, что на ней вообще можно крутить.
У Instax Mini 12 нет ни диафрагмы, ни экспокоррекции, у Polaroid I-2 есть полный ручной режим.
Один алгоритм обслуживает обе, если работает с пересечением доступных осей управления.

## Справочник

Статика в бандле, версионируется вместе с приложением. Типы выводятся из схем valibot,
схемы лежат в `entities/camera` и `entities/film` (появятся вместе с каталогом).

```ts
interface FilmSpec {
  id: string;
  name: string;
  iso: number;
  frameSize: [number, number];
  latitudeStops: number;
}

type ShutterRange =
  | { kind: 'program'; fastest: number; slowest: number }
  | { kind: 'fixed'; values: number[] }
  | { kind: 'bulb' };

interface CameraSpec {
  id: string;
  brand: string;
  model: string;
  filmIds: string[];
  apertures: number[];
  effectiveAperture?: number;
  shutter: ShutterRange[];
  exposureCompensation: number[];
  flash: {
    canDisable: boolean;
    guideNumber?: number;
    guideNumberIso?: number;
  };
  focusZones?: { label: string; min: number; max: number }[];
  notes?: string;
}
```

Смысл полей:

- `frameSize` — поле изображения в миллиметрах; `latitudeStops` — допустимое отклонение
  экспозиции плёнки в ступенях в обе стороны.
- `apertures: []` значит «диафрагма не управляется», тогда фактическое значение лежит
  в `effectiveAperture`.
- `shutter` — режимы затвора, доступные одновременно; выдержки в секундах.
- `exposureCompensation: []` — коррекции нет.
- `guideNumber` в метрах, `guideNumberIso` — ISO, для которого оно указано. Оба поля
  заводятся сразу, даже если до FR-16 их никто не читает.

## Пользовательские сущности

Живут в IndexedDB. Ссылка на каталог хранится по `specId`, но камера, заведённая вручную,
несёт собственный слепок спеки — иначе удаление модели из каталога сломает чужие данные.

```ts
interface UserCamera {
  id: string;
  specId: string | null;
  customSpec?: CameraSpec;
  nickname: string;
  loadedFilmId: string;
  isActive: boolean;
  createdAt: number;
}

interface Measurement {
  ev100: number;
  source: 'exif' | 'scene';
  confidence: 'high' | 'low';
  exif?: {
    exposureTime: number;
    fNumber: number;
    iso: number;
    exposureBias?: number;
    brightnessValue?: number;
  };
  sceneId?: string;
  at: number;
}

interface Recommendation {
  aperture: number | null;
  exposureCompensation: number | null;
  flash: 'on' | 'off' | 'camera-decides';
  focusZone?: string;
  predictedShutter: number;
  residualError: number;
  warnings: Warning[];
  rationale: string;
}
```

`Measurement.source` заводится с первого дня, даже пока значение одно: второй источник
(сцен-пикер, FR-15) подключается без правок движка.

## Настройки приложения

Хранилище `appSettings` — пары «ключ — значение». Каждая настройка — отдельная запись,
у каждой своя схема valibot в `src/entities/preference`. Сейчас там одна настройка:

| Ключ | Значение | По умолчанию |
|---|---|---|
| `themePreference` | `'system' \| 'light' \| 'dark'` | `'system'` |

Постоянная поправка устройства (см. `exposure-engine.md`) появится здесь же как настройка,
а не константа в коде.

## Схема хранилища

| Хранилище | Ключ | Индексы | Появляется |
|---|---|---|---|
| `userCameras` | `id` | — (см. ниже) | MVP |
| `appSettings` | `key` | — | MVP |
| `shots` | `id` | `at`, `cameraId` | v3 |
| `shotPhotos` | `shotId` | — | v3 |
| `calibration` | `cameraId` | — | v3 |

Индекс `isActive` из SDLC в первой миграции не заведён: `boolean` не является допустимым
ключом IndexedDB, и записи с таким значением в индекс просто не попадают. Варианты решения
(хранить `activeCameraId` в `appSettings` или флаг числом `0/1`) — открытый вопрос в `risks.md`.
Камер единицы, поэтому до решения активная ищется перебором в памяти.

Фото отпечатков лежат в отдельном хранилище как Blob, чтобы чтение списка кадров не тянуло
десятки мегабайт с диска.

## Версии и миграции

Обёртка над `idb` — `src/shared/api/db`. Она не знает о сущностях: значения в ней `unknown`,
типизацию и проверку даёт схема valibot сущности при чтении.

- Номер версии схемы — длина массива миграций. Миграция с индексом `i` переводит базу
  с версии `i` на `i + 1`.
- В `upgrade(db, oldVersion)` выполняются все миграции начиная с `oldVersion`, по порядку.
- Миграции **только аддитивные**: добавляют хранилища, индексы или поля. Удалений нет.
- Каждая выполненная миграция пишет `console.info` с номером версии.
- Если открыть базу не удалось, `openAppDb` бросает ошибку, а bootstrap стартует приложение
  без хранилища (см. `architecture.md`, «Гидратация до первого рендера»).

### Валидация при чтении

Всё, что приходит из IndexedDB, проходит через `safeParse`. Невалидная запись пропускается
с `console.warn` и не роняет приложение: лучше потерять одну камеру, чем открыть пустой
экран с ошибкой. Каталог в рантайме не валидируется — его проверяет тест в CI.
