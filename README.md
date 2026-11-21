# Goodfind

A Next.js resource library for discovering useful tools, learning resources, and software. Goodfind started from the MIT-licensed [9d8/directory template](https://github.com/9d8dev/directory).

## Overview

Built with modern web technologies and designed with a focus on user experience, this template provides everything you need to create a professional resource directory:

- **Resource Management**: Organize and share bookmarks with rich metadata
- **AI Integration**: Website metadata and generated resource overviews
- **Newsletter**: Built-in email subscription with Loops integration
- **Beautiful UI**: Responsive design with dark/light mode support
- **Admin Dashboard**: Powerful tools for content management

The homepage is a four-category showcase for AI, Software, Gaming, and Media. Existing categories remain editable from the admin. Legacy resources from other categories appear under Software unless a category or tag matches another showcase group. Existing private notes stay in the database.

The optional local seed adds the curated Goodfind catalog. The resource cards link to official sites and external guides. FMHY is credited as the discovery source, and the search dialog links to Virgil's software search. Bundled marks are from [Simple Icons](https://simpleicons.org/) and official resource sites where available.

## Tech Stack

- **Framework**: Next.js 15 with App Router and Server Actions
- **Database**: Local SQLite or hosted Turso with Drizzle ORM
- **Styling**: Tailwind CSS + shadcn/ui components
- **AI**: Anthropic Claude for content generation
- **Search**: Case-insensitive keyword matching for the public directory. Exa supplies content for admin enrichment.
- **Analytics**: Built-in Vercel Analytics

## Features

### For Users

- **Smart Search**: Search across titles, descriptions, and categories
- **Category Filtering**: Browse resources by custom categories
- **Responsive Design**: Works beautifully on all devices
- **Theme Support**: Automatic dark/light mode
- **Newsletter**: Subscribe for weekly resource updates

### For Admins

- **Secure Admin Panel**: Password-protected admin interface
- **Rich Content Editor**: Full-featured bookmark management
- **AI Assistance**: Automatic metadata extraction and content generation
- **Dashboard**: View statistics and manage content
- **Category Management**: Create and organize categories

## Quick Start

Use Node.js 22 or newer and pnpm 12 (the exact pnpm release is in `package.json`).

```bash
git clone https://github.com/mohammedi-dev/goodfind-v2.git
cd goodfind-v2
pnpm install --frozen-lockfile
```

Copy `.env.example` to `.env` with `cp .env.example .env` or `Copy-Item .env.example .env` in PowerShell. Set `BOHO_PASSWORD` to a local password and `BOHO_SECRET` to a random string of at least 32 characters. This command generates a suitable secret.

```bash
node -p "require('node:crypto').randomBytes(32).toString('hex')"
```

With the example `file:` database URL, initialize and optionally seed your local database.

```bash
pnpm db:push
pnpm db:seed
pnpm dev
```

Open the showcase at [http://localhost:3000](http://localhost:3000) and sign in at [/admin](http://localhost:3000/admin). The seed adds 12 resources to a fresh database and can be rerun safely. On an existing installation with the original demo catalog, back up the database and run `pnpm db:seed --replace-starters` to remove the published starter cards and add the curated catalog. This leaves drafts and independently added entries intact.

`pnpm lint`, `pnpm exec tsc --noEmit`, and `pnpm build` check the project.

The local setup initializes a database directly from `db/schema.ts`. For an existing schema-initialized database, back it up and run `pnpm db:push` to add the showcase settings table. On a database managed by Drizzle migrations, review and apply migration `0003_showcase_resource_settings.sql`. It adds one table and leaves existing records intact. Reconcile the older migrations against a backup if their schema differs from the current database.

### External services

| Configuration | Used for |
| --- | --- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Hosted Turso database. Local SQLite needs only the `file:` URL. |
| `ANTHROPIC_API_KEY`, `EXASEARCH_API_KEY` | Optional admin AI overviews and bulk enrichment. Single-URL import works without keys. |
| `LOOPS_API_KEY` | Newsletter signups. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for metadata and sitemap. |
| Vercel project | Optional hosting and Vercel Analytics. |

Before deploying publicly, review infrastructure egress controls, admin sign-in throttling, and production dependency advisories with `pnpm audit --prod`.

## Admin Dashboard

1. Sign in at `/admin` and choose **Add resource** or **Import URL**. For an import, paste the website or GitHub URL and select **Read metadata**. Goodfind fills empty fields from the website or GitHub's public repository API. Review the result and choose a showcase category.
2. Use **Appearance** to set a logo URL, link permitted artwork or a screenshot, or upload PNG, JPEG, or WebP files up to 2 MB each. Colors and patterns customize the logo-centered fallback. Uploads are stored with the resource so they remain available after a restart.
3. Check **Card preview**, then choose **Save draft** or **Publish resource**. Use **Edit** to update a resource and **Hide resource** to take it offline. Drafts stay out of the carousel, public resource pages, and sitemap.
4. Filter by one category with visibility set to **All statuses** to reorder using the arrows. Select **Delete resource** and confirm to permanently remove an entry and its uploads.

Metadata requests use standard HTTP(S) ports, recheck public destinations on redirects, and enforce request and response limits. The optional bulk enrichment workflow saves drafts for review.

### Managing Categories

- Create custom categories with colors and icons
- Organize bookmarks into categories
- Edit category metadata

### API Integration

The admin interface uses Next.js Server Actions for:

- Real-time updates
- Optimistic UI
- Error handling
- Bulk import results

## Customization

Edit `directory.config.ts` to customize your site:

```typescript
export const directory = {
  baseUrl: "https://your-domain.com",
  name: "Your Directory Name",
  title: "Your Site Title",
  description: "Your site description",
};
```

## Deployment

Vercel can host the Next.js app and optionally provide analytics. For a hosted deployment, configure persistent storage and production credentials after resolving the migration and security items in the local setup section.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. Some areas we'd love help with:

- Additional bookmark import sources
- Enhanced AI features
- New UI components
- Documentation improvements

## License

MIT License - feel free to use this template for your own projects!

## Support

For support:

- Open an issue in the [GitHub repository](https://github.com/9d8dev/directory)
- Check out the [documentation](https://directory.9d8.dev/docs)
- Join our [Discord community](https://discord.gg/your-server)

## Created by

Built at [9d8](https://9d8.dev) by [Bridger](https://bridger.to) and [Cameron](https://cameron.so).
