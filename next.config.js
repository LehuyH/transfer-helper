/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import { setupDevPlatform } from '@cloudflare/next-on-pages/next-dev';
await import("./src/env.js");

/** @type {import("next").NextConfig} */
const config = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};


if (process.env.NODE_ENV === 'development') {
  await setupDevPlatform();
}
export default config;
