export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function parsePrice(value) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/,/g, "").match(/(\d+(?:\.\d{1,2})?)/);
  return normalized ? Number(normalized[1]) : null;
}
