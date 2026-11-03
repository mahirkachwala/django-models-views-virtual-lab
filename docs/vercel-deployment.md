# Vercel deployment

The Vercel build publishes the same academic pages, styles, quizzes and seven
guided simulation activities used on localhost. `deploy/main.tsx` imports
`app/page.tsx` and `app/globals.css` directly; it does not maintain a second UI.
The existing Vinext/Cloudflare development and production commands remain available.

## Build and preview

Use Node.js 24 and the committed npm lockfile:

```sh
npm ci
npx vite build --config vite.vercel.config.ts
npx vite preview --config vite.vercel.config.ts --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/#simulation`. `vercel.json` selects this build and
the generated `dist-vercel` directory. All lab sections use hash navigation,
so their URLs work without a server rewrite.

## Publish

Production site: [django-models-views-virtual-lab.vercel.app](https://django-models-views-virtual-lab.vercel.app/#simulation). Initial production deployment reached `READY` on 3 November 2026. Changes pushed to `main` automatically rebuild the site.

The source is [mahirkachwala/django-models-views-virtual-lab](https://github.com/mahirkachwala/django-models-views-virtual-lab). The Vercel project is `django-models-views-virtual-lab` in `kachwalamahir575-8695s-projects`, connected to the repository's `main` branch. Node.js is pinned to the tested 24.x release line. Arnav Kadhe is credited as a contributor and has been invited to collaborate on GitHub.

Import the GitHub repository into the owner's Vercel account, retain the root
directory, use Node.js 24, and deploy. The committed `vercel.json` supplies the
install command, build command and output directory. Alternatively, from an
authenticated Vercel CLI session, run `vercel --prod` from the repository root.
For a fresh copy, link to the existing project instead of creating another one.

## Runtime scope

The guided lab is an educational browser simulation, including its record store,
migration snapshots, relationships and quizzes. Learner state is stored in that
browser's local storage. A new domain has its own storage; localhost work is not
automatically transferred to the deployed domain.

The optional real Django/SQLite reference application in `backend/` is retained
in source and remains runnable locally. It is independent of the mounted guided
simulation and is not a server process in this static Vercel deployment.
Do not describe the animations or displayed Python snippets as live Django
execution. Deploying the optional Django application would require a separate
Python service with suitable persistent database configuration.

## Source references

- [Vite deployment on Vercel](https://vercel.com/docs/frameworks/frontend/vite)
- [Vite static deployment](https://vite.dev/guide/static-deploy)

The deployment entry is deliberately separate because the existing `vite.config.ts`
builds a Cloudflare Worker, which is not a Vercel function artifact.

## Windows CLI setup

If Vercel CLI 65 reports a `builders-vlt` symlink permission error on Windows,
set `VERCEL_CLI_USE_NATIVE_BINARY=0`, `VERCEL_VC_NATIVE=0`, and
`VERCEL_CLI_MANAGED_BUILDERS=0` for that PowerShell session. When linking this
repository, select only the detected **frontend** service. The `backend/`
directory is a separate local Django reference project, not an additional
production service. Using `link --yes` can incorrectly select both services.
