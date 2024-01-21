export async function randomPhoto(picsumFallback = false) {
  try {
    const {url} = await fetch(
      picsumFallback
        ? 'https://picsum.photos/300'
        : 'https://source.unsplash.com/random/300x300'
    );
    if (picsumFallback) {
      return url;
    } else {
      const {origin, pathname} = new URL(url);
      return `${origin}${pathname}?w=300&h=300&fit=crop&q=70`;
    }
  } catch (error) {
    return await randomPhoto(true);
  }
}
