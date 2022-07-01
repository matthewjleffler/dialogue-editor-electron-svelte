import sveltePreprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/** @type {import("@sveltejs/kit").Config} */
const config = {
  kit: {
    adapter: adapter({}),
    alias: {
      $modules: 'src/modules',
      $stores: 'src/stores',
    }
  },
  preprocess: sveltePreprocess({
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ]
    }
  })
};

export default config;
