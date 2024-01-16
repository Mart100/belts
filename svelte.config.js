import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

export default {
  preprocess: vitePreprocess(),
  base: '/belts',
  kit: {
    paths: {
      base: '/belts/',
    }
  }
}
