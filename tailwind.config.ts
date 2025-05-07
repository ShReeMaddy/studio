import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card) / 0.65)', // Adjusted for glassmorphism (opacity here)
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary-hsl))', 
  				foreground: 'hsl(var(--primary-foreground-hsl))' 
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
        activity: { 
          DEFAULT: 'hsl(var(--activity-accent-hsl))',
          foreground: 'hsl(var(--activity-accent-foreground-hsl))',
        },
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
        'activity-accent': 'hsl(var(--activity-accent-hsl))', 
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring-hsl))', 
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: { // Sidebar colors now primarily driven by dynamic gradient or solid background var
  				DEFAULT: 'hsl(var(--sidebar-background-hsl) / 0.7)', // Base for glassmorphism
  				foreground: 'hsl(var(--sidebar-foreground-hsl))',
  				primary: 'hsl(var(--sidebar-primary-hsl))', 
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground-hsl))', 
  				accent: 'hsl(var(--sidebar-accent-hsl))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground-hsl))',
  				border: 'hsl(var(--sidebar-border-hsl))',
  				ring: 'hsl(var(--sidebar-ring-hsl))' 
  			}
  		},
      backgroundImage: {
        'dynamic-primary-gradient': 'linear-gradient(135deg, hsl(var(--primary-gradient-start-hsl)), hsl(var(--primary-gradient-end-hsl)))',
        'sidebar-dynamic-gradient': 'linear-gradient(135deg, hsl(var(--sidebar-gradient-start-hsl)), hsl(var(--sidebar-gradient-end-hsl)))',
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
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 10px 2px hsla(var(--activity-accent-hsl), 0.5)' },
          '50%': { boxShadow: '0 0 16px 5px hsla(var(--activity-accent-hsl), 0.7)' },
        },
        'ripple': {
          '0%': { boxShadow: '0 0 0 0 hsla(var(--activity-accent-hsl), 0.6)', opacity: '1'},
          '70%': { boxShadow: '0 0 0 12px hsla(var(--activity-accent-hsl), 0)', opacity: '0.3'},
          '100%': { boxShadow: '0 0 0 0 hsla(var(--activity-accent-hsl), 0)', opacity: '0'},
        },
        'wave-border': { // More subtle wave for borders
          '0%, 100%': { borderColor: 'hsla(var(--activity-accent-hsl), 0.8)' },
          '50%': { borderColor: 'hsla(var(--activity-accent-hsl), 0.4)' },
        }
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.65, 0, 0.35, 1) infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite',
        'wave-border': 'wave-border 2.5s cubic-bezier(0.65, 0, 0.35, 1) infinite',
  		},
      transitionTimingFunction: {
        'ease-in-out-cubic': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      transitionDuration: {
        '500': '500ms',
        '600': '600ms',
        '700': '700ms',
        '800': '800ms',
      },
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
