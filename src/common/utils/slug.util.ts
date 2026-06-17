import slugify from 'slugify';

export function generateSlug(text: string): string {
  return slugify(text, {
    lower: true,
    strict: true,
    trim: true,
  });
}

export function generateUniqueSlug(text: string, suffix?: string): string {
  const baseSlug = generateSlug(text);
  if (suffix) {
    return `${baseSlug}-${suffix}`;
  }
  return baseSlug;
}
