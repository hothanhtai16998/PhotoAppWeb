import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': path.resolve(
				__dirname,
				'./src'
			),
		},
	},
	build: {
		// Optimize build for better Lighthouse scores
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router', 'react-router-dom'],
					'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
					'utils-vendor': ['axios', 'zustand', '@tanstack/react-query'],
					'sentry': ['@sentry/react'],
				},
			},
		},
		// Enable source maps for production debugging (optional)
		sourcemap: false,
		// Optimize chunk size
		chunkSizeWarningLimit: 1000,
		// Minify CSS
		cssMinify: true,
		// Target modern browsers for smaller bundles
		target: 'esnext',
	},
});
