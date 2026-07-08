export const CATEGORIES = [
  { name: "Branding", slug: "branding", angle: -90 },
  { name: "Social Media", slug: "social-media", angle: -18 },
  { name: "Web Design", slug: "web-design", angle: 54 },
  { name: "Illustrations", slug: "illustrations", angle: 126 },
  { name: "Layouts", slug: "layouts", angle: 198 },
];

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

export function getCategoryBySlug(slug) {
  return CATEGORIES.find((category) => category.slug === slug) || CATEGORIES[0];
}

export function categorySlug(name) {
  const found = CATEGORIES.find((category) => category.name === name);
  return found ? found.slug : CATEGORIES[0].slug;
}

export function categoryOrder(name) {
  const index = CATEGORIES.findIndex((category) => category.name === name);
  return index === -1 ? 999 : index;
}
