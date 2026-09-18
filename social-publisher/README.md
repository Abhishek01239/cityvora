# Social Publisher

A Postiz-style social publishing dashboard designed for ChatGPT-triggered publishing.

## Architecture
- Static frontend hosted alongside Cityvora
- Vercel serverless API endpoints for OAuth and publishing
- Supabase for connected-account metadata and publishing history
- Official social APIs via OAuth
- ChatGPT calls the publish endpoint through an authenticated API surface

## Important
Platform OAuth credentials are intentionally not included. Configure them as Vercel environment variables.

This first version provides the dashboard shell, account model, publish API contract, and provider adapter structure. Each social platform must be enabled with its own official developer app and permissions.
