import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getRouteWithLang(url: URL, lang: string) {
  const currentLang = getLangFromUrl(url);
  const path = url.pathname;
  let newPath = path;
  if (currentLang === defaultLang && lang !== defaultLang) {
    newPath = `/${lang}${path === '/' ? '' : path}`;
  } else if (currentLang !== defaultLang && lang === defaultLang) {
    newPath = path.replace(`/${currentLang}`, '');
    if (newPath === '') newPath = '/';
  } else if (currentLang !== defaultLang && lang !== defaultLang) {
    newPath = path.replace(`/${currentLang}`, `/${lang}`);
  }
  return newPath;
}