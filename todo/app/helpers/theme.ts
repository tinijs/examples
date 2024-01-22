import {setTheme} from 'tinijs';

const THEME_KEY = 'theme';

export enum Themes {
  Light = 'bootstrap/light',
  Dark = 'bootstrap/dark',
}

export function initTheme() {
  const themeId = localStorage.getItem(THEME_KEY) || Themes.Light;
  const [soulId, skinId] = themeId.split('/');
  setTheme({soulId, skinId});
  return themeId;
}

export function changeTheme(themeId: string) {
  const [soulId, skinId] = themeId.split('/');
  localStorage.setItem(THEME_KEY, themeId);
  return setTheme({soulId, skinId});
}
