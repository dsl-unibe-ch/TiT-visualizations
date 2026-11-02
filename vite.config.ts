import adapter from '@sveltejs/adapter-static';
import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

function getBasePath(): '' | `/${string}` | undefined {
	const basePath = process.env.BASE_PATH;

	if (basePath === undefined || basePath === '') {
		return basePath;
	}

	if (!basePath.startsWith('/')) {
		throw new Error('BASE_PATH must start with "/".');
	}

	return `/${basePath.slice(1)}`;
}

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			adapter: adapter({ fallback: '404.html' }),
			paths: {
				base: process.argv.includes('dev') ? '' : getBasePath()
			}
		}),
		devtoolsJson()
	]
});
