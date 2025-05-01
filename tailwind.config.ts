
import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				tech: {
					dark: '#121212',
					blue: '#1EAEDB',
					purple: '#9b87f5',
					cyan: '#33C3F0', 
					gray: '#2a2a2a',
					gold: '#FFD700',
					red: '#ea384c',
					black: '#000000e6',
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'pulse-gentle': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'gradient-x': {
					'0%': {
						'background-size': '200% 200%',
						'background-position': 'left center'
					},
					'50%': {
						'background-size': '200% 200%',
						'background-position': 'right center'
					},
					'100%': {
						'background-size': '200% 200%',
						'background-position': 'left center'
					}
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'spin-slow': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(360deg)' }
				},
				'morph': {
					'0%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' },
					'50%': { borderRadius: '30% 60% 70% 40%/50% 60% 30% 60%' },
					'100%': { borderRadius: '60% 40% 30% 70%/60% 30% 70% 40%' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-4px)' }
				},
				'slide-in': {
					'0%': { transform: 'translateY(20px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				'reveal-right': {
					'0%': { transform: 'translateX(-100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 5s ease-in-out infinite',
				'pulse-gentle': 'pulse-gentle 3s ease-in-out infinite',
				'gradient-x': 'gradient-x 15s ease infinite',
				'shimmer': 'shimmer 2s infinite linear',
				'spin-slow': 'spin-slow 8s linear infinite',
				'morph': 'morph 8s ease-in-out infinite',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
				'slide-in': 'slide-in 0.6s ease-out',
				'reveal-right': 'reveal-right 1s ease-out'
			},
			boxShadow: {
				'neon': '0 0 5px theme("colors.tech.gold"), 0 0 20px theme("colors.tech.gold")',
				'inner-glow': 'inset 0 0 20px rgba(255,215,0,0.3)',
				'tech': '0 10px 30px -10px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 215, 0, 0.2)',
				'cyber': '0 0 0 2px rgba(255, 215, 0, 0.1), 0 15px 35px rgba(0, 0, 0, 0.2), 0 5px 15px rgba(0, 0, 0, 0.1)'
			},
			backgroundImage: {
				'tech-gradient': 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(42,42,42,0.8) 100%)',
				'gold-gradient': 'linear-gradient(90deg, #FFD700 0%, #FFC107 100%)',
				'dark-gradient': 'radial-gradient(circle at center, rgba(42,42,42,1) 0%, rgba(0,0,0,1) 100%)',
				'cyber-grid': 'linear-gradient(transparent 0%, rgba(255, 215, 0, 0.05) 1px, transparent 2px), linear-gradient(90deg, transparent 0%, rgba(255, 215, 0, 0.05) 1px, transparent 2px)',
				'holographic': 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(234, 56, 76, 0.2) 50%, rgba(155, 135, 245, 0.2) 100%)'
			},
			backdropFilter: {
				'none': 'none',
				'blur': 'blur(4px)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
