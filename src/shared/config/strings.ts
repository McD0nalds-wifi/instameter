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
