// Registers the editor components, then starts Sveltia with the generated config named by <meta name="moose-cms-config">.
import { components } from '/admin/cms-components.mjs';

const configUrl = document.querySelector('meta[name="moose-cms-config"]').content;
const config = await (await fetch(configUrl, { cache: 'no-store' })).json();
const { CMS } = window;
for (const component of components) CMS.registerEditorComponent(component);
CMS.registerPreviewStyle('/admin/preview.css');
CMS.init({ config });
