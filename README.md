# 9d8/directory

![CleanShot 2024-12-04 at 16 52 10@2x](https://github.com/user-attachments/assets/6fcd8458-eb07-411d-b813-212b5b26b67e)


A modern, AI-powered Next.js directory template for creating beautiful resource collections and bookmarks. Perfect for creating your own curated list of resources, bookmarks, or link directories. View the live demo at [directory.9d8.dev](https://directory.9d8.dev).

## Overview

Built with modern web technologies and designed with a focus on user experience, this template provides everything you need to create a professional resource directory:

- **Resource Management**: Organize and share bookmarks with rich metadata
- **AI Integration**: Website metadata and generated resource overviews
- **Newsletter**: Built-in email subscription with Loops integration
- **Beautiful UI**: Responsive design with dark/light mode support
- **Admin Dashboard**: Powerful tools for content management

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

Open the directory at [http://localhost:3000](http://localhost:3000) and sign in at [/admin](http://localhost:3000/admin). The seed adds four categories and six example resources and can be rerun. `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm build` check the project.

The local setup initializes a disposable database directly from `db/schema.ts`. The legacy migrations and the schema differ. Reconcile those migrations against a backup before changing an existing Goodfind or Turso database.

### External services

| Configuration | Used for |
| --- | --- |
| `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` | Hosted Turso database. Local SQLite needs only the `file:` URL. |
| `ANTHROPIC_API_KEY`, `EXASEARCH_API_KEY` | Admin AI overviews and bulk URL import. Public keyword search works locally. |
| `LOOPS_API_KEY` | Newsletter signups. |
| `NEXT_PUBLIC_SITE_URL` | Canonical site origin for metadata and sitemap. |
| Vercel project | Optional hosting and Vercel Analytics. |

Before deploying publicly, add outbound network restrictions for metadata fetches, add sign-in throttling and review remaining advisories with `pnpm audit --prod`.

## Admin Dashboard

The admin dashboard at `/admin` provides a powerful interface for managing your directory:

### Managing Bookmarks

1. **Add Single Bookmark**

   - Enter URL for automatic metadata extraction
   - AI-powered description and overview generation
   - Customize metadata and categorization
   - Set favorite/archived status

2. **Bulk Import**

   - Upload a CSV with one URL per line
   - Generate metadata and overviews during import
   - Review and edit imported entries in the dashboard

3. **Edit Bookmarks**
   - Update metadata and categories
   - Regenerate AI content
   - Manage bookmark status

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
