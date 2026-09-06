import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang && Object.prototype.hasOwnProperty.call(ui, lang)) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof typeof ui[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  }
}

export function getRouteWithLang(url: URL, lang: string) {
  const parts = url.pathname.split('/');
  
  if (parts[1] && Object.prototype.hasOwnProperty.call(ui, parts[1])) {
    parts.splice(1, 1);
  }
  
  let newPath = parts.join('/') || '/';
  
  if (lang !== defaultLang) {
    newPath = newPath === '/' ? `/${lang}` : `/${lang}${newPath}`;
  }
  
  return newPath + url.search + url.hash;
}