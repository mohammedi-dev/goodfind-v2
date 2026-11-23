# Working on Goodfind

Goodfind is a curated library of software, tools, and useful websites. Preserve the established design direction for routine changes. Treat a redesign as a separate task when the owner asks for one. Preserve the catalog, URLs, and admin workflows through visual changes.

## Stack and code map

- Node.js 22 or newer and pnpm 12.11.2. The lockfile resolves Next.js 15.5.29, React 19.3.1, TypeScript 5.6, and Tailwind CSS 3.4. Check `package.json` and `pnpm-lock.yaml` for the current versions.
- `app/page.tsx` loads published resources on the server. `lib/data.ts`, `lib/showcase.ts`, and `lib/showcase-catalog.ts` handle reads, category aliases, ordering, and public card data. `components/goodfind/showcase.tsx` owns the All view, four category tabs, search, and resource dialogs. Keep the `category` and `search` URL parameters shareable.
- `components/goodfind/showcase-carousel.tsx` uses Embla and its wheel gestures plugin. Framer Motion handles category and rail transitions. The standalone resource route under `app/[slug]` uses the shared site frame and is included in the sitemap for published entries.
- `app/admin`, `components/admin`, and the server actions in `lib/actions.ts` and `lib/resource-actions.ts` handle editing, publishing, category management, and ordering. Admin sessions use an HTTP-only cookie signed with `jose`. Enforce authorization at server entry points as well as in middleware. `lib/public-fetch.ts` guards metadata requests and redirects. `lib/resource-assets.ts` uses Sharp to process editor uploads.
- `db/schema.ts` is the current Drizzle schema. `db/client.ts` supports a local SQLite file or hosted Turso via libSQL. Use the migration workflow described in the README for existing data. Run the demo seed only when intended. Keep drafts, private notes, and unpublished assets out of public queries and previews.

## Design and implementation

- Keep the public collection black and white, with resource marks rendered in their authentic colors. Use the existing Manrope typography, a clear heading hierarchy, consistent gutters, and shared spacing and radii. Keep the public homepage free of a Goodfind logo or wordmark.
- Use the semantic HSL tokens in `app/globals.css` and Tailwind theme for shared and admin UI. Use the `--sc-*` tokens in `app/showcase.css` for the showcase and resource dialogs. `app/discovery.css` styles the shared discovery shell. Extend the appropriate token when a value has a shared purpose. Keep per-resource accent and background colors in the existing appearance settings.
- Reuse components from `components/ui` (shadcn/Radix), Lucide icons, and the shared resource preview. Check both the admin live preview and the public card when changing `ShowcaseCard`. Keep data reads and sensitive logic on the server, with client components for interactive state.
- Prefer authentic product marks and permitted screenshots. Use the editor’s logo and artwork settings and the bundled marks under `public/showcase-icons`. Logo-centered CSS treatments are the fallback. Avoid generic AI imagery and synthetic product screenshots.
- Keep the rail at one, two, or three whole cards according to the current `43rem` and `67rem` breakpoints. Update the CSS capacities and Embla options together. Preserve hidden scrollbars, usable drag and swipe, keyboard and arrow navigation, and wrapping when enough items are present. Handle empty and short categories and long titles without horizontal page overflow.
- Use links for navigation and buttons for actions. Retain visible keyboard focus, named controls, tab arrow-key behavior, a logical tab order, and comfortable touch targets. Keep dialog focus contained, support Escape, and return focus to the initiating control. Check text and controls for contrast.
- Animate state changes using short transform and opacity transitions. Preserve stable layout, respect `prefers-reduced-motion`, and gate decorative hover effects to fine pointers. Keep every action usable with touch and keyboard. Reuse CSS and the existing motion library before adding dependencies.

## Verification

Use `pnpm install --frozen-lockfile` for setup. Copy `.env.example` for local configuration, use local credentials, and keep environments, keys, database files, and backups out of Git. Initialize a new local database using the README. Test destructive admin changes against a disposable database. Turso, Anthropic, Exa, Loops, and Vercel are optional integrations for local work.

Run `pnpm lint`, `pnpm exec tsc --noEmit`, `pnpm build`, and `git diff --check`. The project has no committed automated test suite or GitHub check workflow. Use the available browser testing tools before adding a test dependency. Report any failed or skipped check with its reason.

- Open the changed routes in the browser, inspect the console, and check desktop, tablet, and narrow mobile widths. Include a width near 320px and both sides of a breakpoint when changing layout.
- For showcase changes, verify the category tabs, populated and empty states, URL reloads, keyboard search, result clearing, and the whole-card rail. Exercise arrow wrapping, drag or swipe, hover, reduced motion, and keyboard focus. Open and close a detail dialog, check focus restoration, and verify its destination links.
- For admin changes, verify signed-out access, sign-in, and the affected editor flow. Check that draft, publish, and hide behavior agrees across the homepage, the direct resource route, and sitemap when relevant.
