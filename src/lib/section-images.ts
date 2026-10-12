type Image = { source: string; visible?: boolean };
type ImageInput = {
  hero: { coverImage: string };
  media?: { cover?: string; sections?: { property?: string; features?: string; distances?: string; final?: string } };
  gallery: { images: Image[] };
};

// Keep saved section choices; automatic choices use visible, distinct gallery photos.
export function sectionImagesFor(property: ImageInput) {
  const cover = property.media?.cover || property.hero.coverImage;
  const visible = [...new Set(property.gallery.images.filter(image => image.visible !== false && image.source).map(image => image.source))];
  const supporting = visible.filter(source => source !== cover);
  const used = new Set([cover]);
  let previous = cover;
  const pick = (saved?: string) => {
    const source = saved || supporting.find(image => !used.has(image)) || supporting.find(image => image !== previous) || visible.find(image => image !== previous) || supporting[0] || visible[0] || cover;
    used.add(source); previous = source;
    return source;
  };
  return {
    property: pick(property.media?.sections?.property),
    features: pick(property.media?.sections?.features),
    location: pick(),
    distances: pick(property.media?.sections?.distances),
    final: pick(property.media?.sections?.final)
  };
}
