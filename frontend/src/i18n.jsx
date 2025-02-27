import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

const ru_tr = {
  'Back to main website': 'Назад на основной сайт',
  'All tools': 'Все инструменты',
  Tools: 'Инструменты',
  'Tool types': 'Все инструменты',
  'View available': 'Посмотреть доступные',
  'Tool not found.': 'Инструмент не найден.',
  Save: 'Сохранить',
  Run: 'Запуск',
  'Unsaved changes exist. Apply?':
    'Есть несохранённые изменения. Применить?',
  Apply: 'Применить',
  Discard: 'Сбросить',
  Mine: 'Мои',
  'Edit Node': 'Редактировать узел',
  'Unknown error': 'Неизвестная ошибка',
  'not selected': 'не выбрано',
  Add: 'Добавить',
  'Add item': 'Добавить элемент',
  'Change item key': 'Изменить ключ элемента',
  Key: 'Ключ',
  'Change value': 'Поменять значение',
  Value: 'Значение',
  'Add JSON': 'Добавить JSON',
  Save: 'Сохранить'
}

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    resources: {
      en: {
        translation: Object.fromEntries(Object.keys(ru_tr).map(k => ([k, k])))
      },
      ru: {
        translation: ru_tr
      }
    }
  })

export default i18n
