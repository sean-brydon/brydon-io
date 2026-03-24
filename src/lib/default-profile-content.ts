/**
 * Default profile content for new users.
 *
 * Shared between the profile editor (fallback when no content exists)
 * and the seed script (initial profile for seeded users).
 *
 * Returns tiptap-compatible HTML with hero, currently, github, and contact blocks.
 */
export function getDefaultProfileContent(): string {
  const defaultCategories = JSON.stringify([
    {
      label: "reading",
      items: [
        { name: "the way of zen", detail: "alan watts" },
        { name: "the psychology of money", detail: "morgan housel" },
      ],
    },
    {
      label: "playing",
      items: [
        { name: "stardew valley", detail: "farming & vibes" },
        { name: "the finals", detail: "competitive fps" },
      ],
    },
    {
      label: "shooting on",
      items: [
        { name: "sony a6700", detail: "aps-c body" },
        { name: "sony 24-50mm f/2.8 g", detail: "everyday lens" },
      ],
    },
    {
      label: "watching",
      items: [
        { name: "game of thrones", detail: "rewatching" },
        { name: "pokémon", detail: "always" },
      ],
    },
  ])

  return [
    // Hero block with particle animation
    `<div data-type="hero-block" data-shape1-type="heart" data-shape2-type="text" data-shape2-text="S B" data-height="280" data-particle-count="2000" data-show-badge="true" data-badge-text="click to morph"></div>`,
    // Name heading
    `<h1>sean brydon</h1>`,
    // Bio paragraph
    `<p>developer from newcastle, england. building cal.com. interested in real-time systems, gpu rendering, and building things people actually use.</p>`,
    // Currently block with seed data
    `<div data-type="currently-block" data-categories='${defaultCategories}'></div>`,
    // GitHub contributions
    `<div data-type="github-block" data-username="sean-brydon"></div>`,
    // Contact / booking block
    `<div data-type="contact-block" data-cal-username="sean-brydon" data-description="book a 30 min call — times in your timezone"></div>`,
  ].join("\n")
}
