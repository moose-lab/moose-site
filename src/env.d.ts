/// <reference types="astro/client" />

// YAML imports via @rollup/plugin-yaml; the shape is validated in src/lib/site.ts.
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
