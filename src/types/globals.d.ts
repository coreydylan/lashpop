// Ambient module declaration for side-effect CSS imports
// (e.g. `import 'react-photo-view/dist/react-photo-view.css'`,
// `import '@/app/globals.css'`).
//
// Without this, `next build` fails on a clean cache with TS2882
// ("Cannot find module or type declarations for side-effect import")
// because the package author shipped no `.d.ts` for the CSS file.

declare module '*.css'
