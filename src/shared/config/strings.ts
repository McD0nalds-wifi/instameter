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
    placeholder: 'Здесь появятся замер по EXIF и карточка совета.',
  },
  catalogPage: {
    title: 'Каталог',
    placeholder: 'Здесь появится справочник камер моментальной печати.',
  },
  myCamerasPage: {
    title: 'Мои камеры',
    placeholder: 'Здесь появится список ваших камер.',
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
