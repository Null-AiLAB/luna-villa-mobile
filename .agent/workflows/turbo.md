---
description: Luna's Turbo Mode - High-speed Automation Flow
---
// turbo-all

1. Clean project build cache `npm run clean`
2. Install dependencies `npm install`
3. Check TypeScript types `npx tsc --noEmit`
4. Run background server `npm run server:dev`
5. Trigger EAS Local Build `eas build --platform android --profile preview --local --non-interactive`

> [!TIP]
> This workflow automates the entire CI/CD pipeline for local development.
