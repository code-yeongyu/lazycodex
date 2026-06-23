The docs site at `lazycodex.ai` deploys automatically to Cloudflare Workers. There is no manual publish step for the web — a push to `main` that touches the web package ships it.

### Trigger

The `Web Deploy (Cloudflare Workers)` workflow runs on push to `main` when `packages/web/**` or the workflow file itself changes, and on manual `workflow_dispatch`. A concurrency group keyed by ref serializes runs and never cancels an in-flight deploy.

### Build

Inside `packages/web`, the prebuild step regenerates `lib/docs-content.generated.ts` from `content/docs/*.md`. The site is then built with OpenNext for Cloudflare (`pnpm exec opennextjs-cloudflare build`).

### Deploy

`cloudflare/wrangler-action@v4` runs `wrangler deploy` (or `deploy --env <environment>` when an environment is supplied) against the `web-production` environment, whose URL is `https://lazycodex.ai`.

### Post-deploy smoke checks

The workflow fails the job if any check breaks:

- Apex `https://lazycodex.ai/` returns `200`.
- `www.lazycodex.ai`, `lazycodex.dev`, and `www.lazycodex.dev` each return `301` redirecting to `https://lazycodex.ai`.

A PageSpeed Insights pass audits the live URL for Lighthouse 100/100/100/100 across performance, accessibility, best-practices, and SEO, on both mobile and desktop. It is non-blocking here because PSI shared quota throttles frequent CI; the gating Lighthouse check runs in `web-ci.yml` via real Playwright Chromium.

### Local preview

```bash
cd packages/web
pnpm preview   # opennextjs-cloudflare build && preview
pnpm deploy    # build && deploy (requires Cloudflare auth)
```

### Reading more

- [Skills](./skills.md) — what the docs site documents.
- [Configuration](./configuration.md) — tuning that affects the build.
