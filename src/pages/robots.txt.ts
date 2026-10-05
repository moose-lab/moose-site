import type { APIRoute } from 'astro';
import { isPreviewEnv, robotsTxt } from '../lib/seo';

export const GET: APIRoute = ({ site }) =>
  new Response(robotsTxt(site!, isPreviewEnv(import.meta.env.PUBLIC_SITE_ENV)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
