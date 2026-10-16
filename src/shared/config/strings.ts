export const strings = {
  appName: 'Instameter',
  navigation: {
    label: 'Разделы',
    measure: 'Замер',
    catalog: 'Каталог',
    myCameras: 'Мои камеры',
    settings: 'Настройки',
  },
  measurePage: {
    title: 'Замер',
    placeholder: 'Сфотографируйте сюжет камерой телефона — приложение посчитает экспозицию сцены.',
  },
  measure: {
    takePhoto: 'Снять',
    fromGallery: 'Из галереи',
    reading: 'Читаю снимок…',
    hint: 'Перед снимком тапните по главному объекту, чтобы телефон замерил по нему.',
    fields: {
      exposureTime: 'выдержки',
      fNumber: 'диафрагмы',
      iso: 'ISO',
    },
    errors: {
      noExifTitle: 'В снимке нет данных об экспозиции',
      noExifDescription:
        'Так бывает со скриншотами и фото, пересланными через мессенджер. Сделайте снимок камерой телефона.',
      missingFieldsTitle: 'В снимке не хватает данных об экспозиции',
      missingFieldsDescription: 'Телефон не записал значение',
      unreadableTitle: 'Не удалось прочитать файл',
      unreadableDescription: 'Выберите фотографию в формате JPEG или HEIC.',
    },
  },
  advice: {
    title: 'Совет',
    camera: 'Камера',
    changeCamera: 'Сменить',
    noCameraTitle: 'Выберите камеру',
    noCameraDescription: 'Совет считается под конкретную камеру. Добавьте свою из каталога.',
    noCameraAction: 'Открыть каталог',
    unsupportedTitle: 'Для этой камеры совет пока не считается',
    unsupportedDescription: 'У камеры нет автоматического режима выдержки.',
    settings: {
      aperture: 'Диафрагма',
      compensation: 'Коррекция',
      flash: 'Вспышка',
      shutter: 'Камера выберет выдержку',
    },
    flash: {
      on: 'Включить',
      off: 'Выключить',
      'camera-decides': 'Решает камера',
    },
    rationale: {
      exact: 'Экспозиция точная, выдержка достаточно короткая для съёмки с рук.',
      'least-overexposure':
        'Камера не даст выдержку короче — это самый слабый пересвет из возможных.',
      'least-underexposure':
        'Чуть темнее, зато кадр останется резким: это лучший компромисс для такой сцены.',
      'least-blur':
        'Экспозиция точная, но выдержка длинная — держите камеру неподвижно или найдите опору.',
      'fixed-settings': 'Крутить на камере нечего — она всё выставит сама.',
    },
    warnings: {
      shutterCeilingTitle: 'Пересвет',
      shutterCeilingDescription:
        'Камера упрётся в самую короткую выдержку. Поможет ND-фильтр или сюжет в тени.',
      shutterFloorTitle: 'Недодержка',
      shutterFloorDescription:
        'Камера упрётся в самую длинную выдержку. Включите вспышку или найдите больше света.',
      beyondLatitudeTitle: 'Кадр, скорее всего, пропадёт',
      beyondLatitudeDescription: 'Ошибка экспозиции больше, чем вытянет плёнка:',
      blurTitle: 'Риск смаза',
      blurDescription: 'Выдержка длиннее безопасной для съёмки с рук на',
      tooBrightTitle: 'Слишком светло для этой камеры',
      tooDarkTitle: 'Слишком темно для этой камеры',
      outsideRangeBrighter: 'Сцена ярче рабочего диапазона автоматики камеры на',
      outsideRangeDarker: 'Сцена темнее рабочего диапазона автоматики камеры на',
    },
    stops: { one: 'ступень', few: 'ступени', many: 'ступеней', other: 'ступени' },
  },
  measurement: {
    ev100: 'EV₁₀₀',
    phoneBias: 'коррекция телефона',
  },
  catalogPage: {
    title: 'Каталог',
    description:
      'Выберите свою камеру — приложение запомнит её и будет советовать настройки под неё.',
  },
  myCamerasPage: {
    title: 'Мои камеры',
    emptyTitle: 'Камер пока нет',
    emptyDescription: 'Добавьте камеру из каталога, чтобы получать советы по настройкам.',
    addFromCatalog: 'Добавить из каталога',
    addMore: 'Добавить ещё камеру',
  },
  cameraSpec: {
    fixedAperture: 'фиксированная',
    film: 'Плёнка',
    aperture: 'Диафрагма',
    shutter: 'Выдержка',
  },
  addCamera: {
    add: 'Добавить',
    added: 'Уже добавлена',
  },
  userCamera: {
    active: 'Активная',
    makeActive: 'Сделать активной',
    loadedFilm: 'Заряжена',
    remove: 'Удалить камеру',
  },
  settingsPage: {
    title: 'Настройки',
  },
  theme: {
    label: 'Тема',
    system: 'Как в системе',
    light: 'Светлая',
    dark: 'Тёмная',
  },
  storage: {
    unavailableTitle: 'Хранилище недоступно',
    unavailableDescription:
      'Браузер не дал доступ к локальной базе. Изменения не сохранятся после закрытия приложения.',
  },
  update: {
    available: 'Есть новая версия',
    reload: 'Обновить',
  },
} as const;
