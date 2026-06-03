import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		container: {
			center: true,
			padding: '1rem'
		},
		extend: {
			colors: {
				brand: {
					50: '#f0f5ff',
					100: '#e0ebff',
					200: '#c7dbff',
					300: '#a4c2ff',
					400: '#7b9eff',
					500: '#5b7bf6',
					600: '#4458e8',
					700: '#3845d1',
					800: '#303aab',
					900: '#2e3687',
					950: '#1f2350'
				},
				gray: {
					50: '#f9fafb',
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6b7280',
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827',
					950: '#030712'
				}
			},
			fontFamily: {
				sans: [
					'Inter',
					'ui-sans-serif',
					'system-ui',
					'-apple-system',
					'sans-serif'
				]
			},
			boxShadow: {
				soft: '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)'
			},
			animation: {
				'slide-in-from-bottom-2': 'slideInFromBottom 200ms ease-out',
				'slide-in-from-top-2': 'slideInFromTop 200ms ease-out',
				'fade-in': 'fadeIn 150ms ease-out'
			},
			keyframes: {
				slideInFromBottom: {
					'0%': { transform: 'translateY(8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				slideInFromTop: {
					'0%': { transform: 'translateY(-8px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				}
			}
		}
	},
	plugins: [animate]
};

export default config;
