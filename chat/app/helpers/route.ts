export function encodeParam(value: string) {
  return btoa(value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function decodeParam(value: string) {
  return atob(value.replace(/-/g, '+').replace(/_/g, '/'));
}
