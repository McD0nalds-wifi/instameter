# Модель данных и хранилище

## Ключевое решение схемы

Камера описывается не набором полей, а набором того, что на ней вообще можно крутить.
У Instax Mini 12 нет ни диафрагмы, ни экспокоррекции, у Polaroid I-2 есть полный ручной режим.
Один алгоритм обслуживает обе, если работает с пересечением доступных осей управления.

## Справочник

Статика в бандле, версионируется вместе с приложением. Схемы valibot — в
`src/entities/camera/model/cameraSpec.ts` и `src/entities/film/model/filmSpec.ts`, типы выводятся
из них через `v.InferOutput`. Общие примитивы (положительное число, slug, URL) — в
`shared/lib/schema`. Данные каталога и их происхождение — `catalog.md`.

```ts
type FilmSpec = {
  id: string;
  name: string;
  iso: number;
  frameSize: [number, number];
  latitudeStops: number | null;
  sourceUrl?: string;
};

type ShutterRange =
  | { kind: 'program'; fastest: number; slowest: number }
  | { kind: 'fixed'; values: number[] }
  | { kind: 'bulb'; maxSeconds?: number };

type DistanceRange = { min: number; max: number | null };

type CameraSpec = {
  id: string;
  brand: string;
  model: string;
  filmIds: string[];
  focalLength: number;
  apertures: number[];
  effectiveAperture?: number;
  shutter: ShutterRange[];
  exposureCompensation: number[];
  flash: {
    canDisable: boolean;
    guideNumber?: number;
    guideNumberIso?: number;
    range?: DistanceRange;
  };
  focusZones?: (DistanceRange & { label: string })[];
  meteringRange?: { minLv: number; maxLv: number; iso: number };
  notes?: string;
  sourceUrl?: string;
};
```

Смысл полей:

- `id` — slug из латиницы, цифр и дефисов: `lomo-instant-wide`.
- `frameSize` — поле изображения в миллиметрах.
- `latitudeStops` — допустимое отклонение экспозиции плёнки в ступенях в обе стороны.
  `null` — производитель не указывает; сейчас так у всех плёнок.
- `focalLength` — фактическое фокусное расстояние в миллиметрах. Эквивалент для порога смаза
  движок считает сам по диагонали `frameSize`.
- `apertures: []` значит «диафрагма не управляется», тогда фактическое значение лежит
  в `effectiveAperture`. Схема не пропускает камеру без того и другого.
- `shutter` — режимы затвора, доступные одновременно; выдержки в секундах. У `program`
  `fastest` строго меньше `slowest`.
- `exposureCompensation` — доступные значения в ступенях, включая `0`; `[]` — коррекции нет.
- `flash.guideNumber` в метрах, `guideNumberIso` — ISO, для которого оно указано. Если ISO
  производитель не называет, поле отсутствует (Lomo). `flash.range` — рабочий диапазон
  в метрах, как его дают Fujifilm.
- `max: null` в дистанциях — бесконечность: JSON не умеет хранить `Infinity`.
- `meteringRange` — рабочий диапазон автоматики в Lv при указанном ISO. Для пересчёта
  в EV₁₀₀: `EV₁₀₀ = Lv − log₂(ISO / 100)`.
- `sourceUrl` необязателен в схеме: камера, заведённая вручную (FR-05), источника не имеет.
  Для каталога его наличие требует тест.

Каталог хранится как `{ version, films }` и `{ version, cameras }`.

## Пользовательские сущности

Живут в IndexedDB, код — `entities/userCamera`. Ссылка на каталог хранится по `specId`,
спеку камера получает через `entities/camera/@x/userCamera`. Камера, заведённая вручную,
несёт собственный слепок спеки — иначе удаление модели из каталога сломает чужие данные.

```ts
type UserCamera = {
  id: string;
  specId: string | null;
  customSpec?: CameraSpec;
  nickname: string;
  loadedFilmId: string;
  createdAt: number;
};

interface Measurement {
  ev100: number;
  source: 'exif' | 'scene';
  confidence: 'high' | 'low';
  exif?: {
    exposureTime: number;
    fNumber: number;
    iso: number;
    exposureBias?: number;
  };
  sceneId?: string;
  at: number;
}

type Recommendation = {
  aperture: number | null;
  exposureCompensation: number | null;
  flash: 'on' | 'off' | 'camera-decides';
  predictedShutter: number;
  residualError: number;
  blurStops: number;
  warnings: ExposureWarning[];
  rationale: Rationale;
};
```

`Recommendation` не хранится: это результат движка (`exposure-engine.md`, «Реализация»),
коды `rationale` и предупреждений превращает в текст карточка совета. Зоны фокусировки в нём
пока нет — для неё нужна дистанция до объекта (`risks.md`).

`Measurement.source` заводится с первого дня, даже пока значение одно: второй источник
(сцен-пикер, FR-15) подключается без правок движка.

## Настройки приложения

Хранилище `appSettings` — пары «ключ — значение». Каждая настройка — отдельная запись,
у каждой своя схема valibot в сущности-владельце: тема и поправка — `entities/preference`,
активная камера — `entities/userCamera`. Чтение и запись — общие `readSetting` и `writeSetting`
из `shared/api`:

| Ключ | Значение | По умолчанию |
|---|---|---|
| `themePreference` | `'system' \| 'light' \| 'dark'` | `'system'` |
| `deviceCorrection` | число от −2 до +2, ступени | `0` |
| `activeCameraId` | id камеры из `userCameras` или `null` | `null` |
| `installHintDismissed` | `boolean` — подсказку про установку на iOS закрыли | `false` |

`deviceCorrection` — постоянная поправка устройства (`exposure-engine.md`, шаг 1). Значение
вне диапазона при чтении отбрасывается к умолчанию. Меняется на экране настроек степпером
с шагом 1/3 ступени (`features/adjustDeviceCorrection`) и показывается в третях, как на шкале
камеры: «−1/3 EV». Применяется к следующим замерам — уже сделанный замер не пересчитывается.

Замер (`Measurement`) в базе не хранится до лога кадров (v3): текущий замер живёт в атоме
`currentMeasurementAtom` сущности `measurement` и пропадает при перезагрузке. Схема valibot
у него уже есть — она понадобится, когда замер начнёт сохраняться.

## Схема хранилища

| Хранилище | Ключ | Индексы | Появляется |
|---|---|---|---|
| `userCameras` | `id` | — | MVP |
| `appSettings` | `key` | — | MVP |
| `shots` | `id` | `at`, `cameraId` | v3 |
| `shotPhotos` | `shotId` | — | v3 |
| `calibration` | `cameraId` | — | v3 |

Флага `isActive` из SDLC нет: активная камера хранится одним ключом `activeCameraId`
в `appSettings`. Так структура сама гарантирует, что активная камера одна, а индекс
не нужен — `boolean` IndexedDB всё равно не индексирует. Если id не найден среди камер
(камеру удалили в другой вкладке, битая запись), активной считается первая по `createdAt`.
Добавленная камера сразу становится активной; при удалении активной активной становится
первая оставшаяся.

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
