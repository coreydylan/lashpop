# LashPop Studios - Comprehensive Design & Development Specification
*The Complete Guide to Building a Chill Modern Aesthetic Website*

## Table of Contents
1. [Project Overview](#project-overview)
2. [Design Philosophy & Aesthetic Vision](#design-philosophy--aesthetic-vision)
3. [Technical Architecture](#technical-architecture)
4. [Visual Design System](#visual-design-system)
5. [Component Library Specifications](#component-library-specifications)
6. [Animation & Interaction System](#animation--interaction-system)
7. [Page Structures & Layouts](#page-structures--layouts)
8. [Mobile-First Implementation](#mobile-first-implementation)
9. [Performance & Optimization](#performance--optimization)
10. [Content Strategy & Data Structure](#content-strategy--data-structure)
11. [Vagaro Integration Specifications](#vagaro-integration-specifications)
12. [Development Timeline & Deliverables](#development-timeline--deliverables)

---

## Project Overview

### Project Goals
Create a **chill modern aesthetic** website for LashPop Studios that:
- Embodies "quiet luxury" and effortless beauty
- Increases booking conversions by 40-60%
- Provides seamless mobile experience
- Integrates beautifully with Vagaro booking system
- Reflects the premium, award-winning studio experience

### Target Aesthetic
**"Instagram-worthy, but never try-hard"**
- Subtle luxury over flashy elements
- Breathing space as a design element
- Organic motion and physics-based interactions
- Editorial elegance in typography
- Warm, inviting color palette

### Development Approach
**Phase 1:** Static prototype for client approval (3 weeks)
**Phase 2:** CMS integration after design sign-off (4-5 weeks)

---

## Design Philosophy & Aesthetic Vision

### Core Principles

#### 1. Quiet Luxury
```
Philosophy: Enhanced beauty that looks completely natural
Implementation: 
- Generous white space as premium element
- Subtle interactions over flashy animations
- Quality materials (soft shadows, rounded corners, gradients)
- Typography as an art form
```

#### 2. Effortless Flow
```
Philosophy: Content that breathes and moves naturally
Implementation:
- Organic scroll-triggered animations
- Physics-based micro-interactions
- Parallax that enhances rather than distracts
- Seamless transitions between sections
```

#### 3. Editorial Elegance
```
Philosophy: Each element feels curated and intentional
Implementation:
- Sophisticated typography hierarchy
- Purposeful color choices
- Thoughtful content spacing
- Gallery-like image presentation
```

#### 4. Touch Poetry
```
Philosophy: Every interaction feels beautiful and intentional
Implementation:
- Gesture-based navigation
- Magnetic hover effects
- Tactile button responses
- Smooth momentum scrolling
```

### Brand Personality Translation
- **Award-winning** → Confident but not boastful
- **Natural beauty** → Effortless, unforced aesthetic
- **Professional** → Clean, organized, trustworthy
- **Welcoming** → Warm colors, friendly interactions
- **Modern** → Contemporary design patterns, current tech

---

## Technical Architecture

### Technology Stack

#### Frontend Stack
```javascript
Core Framework:
├── Next.js 14 (React 18)
├── TypeScript (strict mode)
├── Tailwind CSS 3.4+
└── ESLint + Prettier

Animation & Interaction Libraries:
├── Framer Motion (primary animations)
├── React Spring (physics-based micro-interactions)
├── Lenis (smooth scrolling)
├── GSAP ScrollTrigger (scroll-based reveals)
├── React Use Gesture (touch interactions)
└── React Intersection Observer (reveal triggers)

Enhancement Libraries:
├── React Parallax Tilt (subtle hover effects)
├── React Masonry CSS (gallery layouts)
├── React Hot Toast (styled notifications)
└── Lucide React (icon system)
```

#### Development Tools
```javascript
Build & Deployment:
├── Vercel (hosting & CI/CD)
├── Cloudinary (image optimization)
├── Bundle Analyzer (performance monitoring)
└── Lighthouse CI (performance testing)

Development Environment:
├── VS Code with extensions
├── Git hooks (Husky)
├── Conventional commits
└── Staging environment
```

### Project Structure
```
lashpop-prototype/
├── public/
│   ├── images/
│   │   ├── team/              # All team member photos (13 total)
│   │   │   ├── emily-rogers.jpeg      # Owner - Primary team member
│   │   │   ├── rachel-edwards.jpeg    # LashPop employee  
│   │   │   ├── ryann-alcorn.png       # LashPop employee
│   │   │   ├── ashley-petersen.jpg    # Collective artist - Hydrafacials/Lash
│   │   │   ├── ava-mata.jpg           # Collective artist - Lash
│   │   │   ├── savannah-scherer.jpeg  # Collective artist - Lash/Brows/Facials
│   │   │   ├── elena-castellanos.jpeg # Collective artist - Jet Plasma/Fibroblast
│   │   │   ├── adrianna-arnaud.jpg    # Collective artist
│   │   │   ├── kelly-katona.jpeg      # Collective artist
│   │   │   ├── bethany-peterson.jpeg  # Collective artist
│   │   │   ├── grace-ramos.jpg        # Collective artist
│   │   │   ├── renee-belton.jpg       # Collective artist
│   │   │   └── evie-ells.jpg          # Collective artist
│   │   ├── services/          # Service icons and photos (5 total)
│   │   │   ├── classic-lash.png       # Classic lash service icon
│   │   │   ├── hybrid-lash.png        # Hybrid lash service icon
│   │   │   ├── volume-lash.png        # Volume lash service icon
│   │   │   ├── lash-lift.png          # Lash lift service icon
│   │   │   └── brow-photo.png         # Brow service icon
│   │   ├── gallery/           # Portfolio/before-after images (13+ total)
│   │   │   ├── lash-136.jpeg          # High-quality lash work sample
│   │   │   ├── lash-102.jpeg          # Professional lash results
│   │   │   ├── lash-92.jpeg           # Natural lash transformation
│   │   │   ├── gallery-img-3405.jpeg  # Portfolio work - subtle results
│   │   │   ├── gallery-075b32b2.jpg   # Premium lash work sample
│   │   │   ├── gallery-img-3973.jpeg  # Professional portfolio image
│   │   │   ├── gallery-lash-40.jpeg   # High-res transformation
│   │   │   ├── gallery-img-7044.jpg   # Quality lash results
│   │   │   ├── gallery-img-3974.jpeg  # Portfolio showcase
│   │   │   ├── gallery-img-1754.jpg   # Natural-looking results
│   │   │   ├── gallery-img-3962.jpeg  # Professional work sample
│   │   │   ├── gallery-1b1e9a79.jpg   # High-quality transformation
│   │   │   └── gallery-img-3961.jpeg  # Close-up lash work
│   │   ├── studio/            # Studio environment photos (3 total)
│   │   │   ├── studio-lash-65.jpeg         # Studio interior/work environment
│   │   │   ├── studio-photo-135a7828.jpg   # Featured studio photography
│   │   │   └── studio-photos-by-salome.jpg # Professional studio shoot
│   │   ├── branding/          # Logo and brand assets (2 total)
│   │   │   ├── logo.png               # Main LashPop Studios logo
│   │   │   └── logo-secondary.png     # Secondary logo variation
│   │   └── ui/                # UI elements, backgrounds
│   ├── data/
│   │   ├── team.json          # Team member information
│   │   ├── services.json      # Service details and pricing
│   │   ├── gallery.json       # Portfolio image data
│   │   ├── testimonials.json  # Client reviews
│   │   └── settings.json      # Business info, hours, contact
│   └── fonts/                 # Custom font files (if needed)
├── src/
│   ├── components/
│   │   ├── ui/                # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── LazyImage.tsx
│   │   ├── sections/          # Page section components
│   │   │   ├── HeroSection.tsx
│   │   │   ├── ServicesShowcase.tsx
│   │   │   ├── TeamSpotlight.tsx
│   │   │   └── ContactSection.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── Layout.tsx
│   │   ├── booking/           # Booking-related components
│   │   │   ├── VagaroWidget.tsx
│   │   │   ├── BookingButton.tsx
│   │   │   └── AvailabilityPreview.tsx
│   │   └── animations/        # Animation utilities
│   │       ├── ScrollReveal.tsx
│   │       ├── FloatingElements.tsx
│   │       └── MagneticButton.tsx
│   ├── pages/
│   │   ├── index.tsx          # Homepage
│   │   ├── services/
│   │   │   ├── index.tsx      # Services overview
│   │   │   └── [slug].tsx     # Individual service pages
│   │   ├── team.tsx           # Team/About page
│   │   ├── gallery.tsx        # Portfolio gallery
│   │   ├── contact.tsx        # Contact/Booking page
│   │   └── _app.tsx           # App wrapper
│   ├── styles/
│   │   ├── globals.css        # Global styles & Tailwind
│   │   └── components.css     # Component-specific styles
│   ├── hooks/                 # Custom React hooks
│   │   ├── useScrollPosition.ts
│   │   ├── useSmoothScroll.ts
│   │   └── useMediaQuery.ts
│   ├── utils/                 # Utility functions
│   │   ├── animations.ts      # Animation presets
│   │   ├── constants.ts       # Site constants
│   │   └── helpers.ts         # Helper functions
│   └── types/                 # TypeScript definitions
│       ├── index.ts
│       ├── components.ts
│       └── api.ts
├── tailwind.config.js         # Tailwind configuration
├── next.config.js             # Next.js configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Dependencies
```

---

## Visual Design System

### Color Palette

#### Primary Colors - "Warm Neutrals"
```css
:root {
  /* Background Hierarchy */
  --cream-white: #FEFDFB;        /* Primary background */
  --soft-ivory: #F9F7F4;         /* Secondary background */
  --warm-gray: #F5F3F0;          /* Subtle contrast background */
  --paper-white: #FCFAF8;        /* Card backgrounds */
  
  /* Accent Colors - "Understated Luxury" */
  --rose-dust: #F4E4E2;          /* Gentle accent */
  --blush-hint: #F0D5D3;         /* Hover states */
  --champagne: #E8DDD4;          /* Subtle highlights */
  --pearl: #F7F5F3;              /* Ultra-subtle contrast */
  
  /* Text Hierarchy */
  --charcoal: #2A2A2A;           /* Primary text */
  --soft-black: #1A1A1A;         /* Headings */
  --warm-gray-text: #6B6661;     /* Secondary text */
  --muted-text: #9B9890;         /* Placeholder text */
  
  /* Metallic Accents - "Whisper Metallics" */
  --gold-whisper: #D4AF37;       /* Awards, badges */
  --rose-gold: #E8B4B8;          /* CTA accents */
  --bronze-hint: #CD7F32;        /* Warm metallic */
}

/* Semantic Color Applications */
.bg-primary { background-color: var(--cream-white); }
.bg-secondary { background-color: var(--soft-ivory); }
.bg-accent { background-color: var(--rose-dust); }
.bg-card { background-color: var(--paper-white); }

.text-primary { color: var(--charcoal); }
.text-heading { color: var(--soft-black); }
.text-secondary { color: var(--warm-gray-text); }
.text-muted { color: var(--muted-text); }
```

#### Color Usage Guidelines
```css
/* Background Applications */
.hero-section { background: linear-gradient(135deg, var(--cream-white), var(--soft-ivory)); }
.service-card { background: var(--paper-white); }
.section-alt { background: var(--warm-gray); }

/* Interactive States */
.button-primary {
  background: var(--charcoal);
  color: var(--cream-white);
}

.button-primary:hover {
  background: var(--soft-black);
  transform: translateY(-2px);
}

.button-secondary {
  background: transparent;
  border: 2px solid var(--charcoal);
  color: var(--charcoal);
}

.button-secondary:hover {
  background: var(--charcoal);
  color: var(--cream-white);
}
```

### Typography System - "Editorial Elegance"

#### Font Stack
```css
/* Import fonts with optimal loading */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400&display=swap');

/* Font Family Definitions */
.font-primary {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-feature-settings: 'kern' 1, 'liga' 1, 'cv01' 1, 'cv03' 1;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.font-accent {
  font-family: 'Playfair Display', Georgia, 'Times New Roman', serif;
  font-feature-settings: 'kern' 1, 'liga' 1, 'dlig' 1;
}

/* Display Typography */
.font-display {
  font-family: 'Inter', sans-serif;
  font-weight: 300;
  font-feature-settings: 'kern' 1, 'liga' 1, 'cv01' 1;
}
```

#### Typography Hierarchy
```css
/* Hero & Display Text */
.text-hero {
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-family: var(--font-display);
}

.text-hero-accent {
  font-family: var(--font-accent);
  font-style: italic;
  font-weight: 400;
  color: var(--warm-gray-text);
}

/* Section Headings */
.text-section-title {
  font-size: clamp(1.75rem, 4vw, 3rem);
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: -0.01em;
  margin-bottom: 1.5rem;
}

.text-subsection-title {
  font-size: clamp(1.25rem, 3vw, 1.875rem);
  font-weight: 500;
  line-height: 1.3;
  letter-spacing: 0;
  margin-bottom: 1rem;
}

/* Body Text */
.text-body-large {
  font-size: 1.125rem;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0;
}

.text-body {
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0;
}

.text-body-small {
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  letter-spacing: 0.01em;
}

/* Accent Typography */
.text-elegant {
  font-family: var(--font-accent);
  font-style: italic;
  color: var(--warm-gray-text);
  font-weight: 400;
}

.text-caps {
  font-size: 0.875rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--warm-gray-text);
}
```

#### Typography Usage Guidelines
```typescript
// Component-specific typography examples
const HeroHeadline = () => (
  <h1 className="text-hero text-heading font-display">
    Wake up
    <span className="text-hero-accent block mt-2">
      gorgeous
    </span>
    every day
  </h1>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-section-title text-heading font-primary mb-6">
    {children}
  </h2>
);

const ServiceDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-body text-secondary leading-relaxed">
    {children}
  </p>
);
```

### Spacing & Layout System

#### Spacing Scale
```css
/* Custom spacing scale for breathing room */
:root {
  --space-xs: 0.5rem;    /* 8px */
  --space-sm: 0.75rem;   /* 12px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
  --space-4xl: 6rem;     /* 96px */
  --space-5xl: 8rem;     /* 128px */
  --space-6xl: 12rem;    /* 192px */
}

/* Section spacing */
.section-padding-y {
  padding-top: var(--space-5xl);
  padding-bottom: var(--space-5xl);
}

.section-padding-x {
  padding-left: var(--space-xl);
  padding-right: var(--space-xl);
}

@media (max-width: 768px) {
  .section-padding-y {
    padding-top: var(--space-4xl);
    padding-bottom: var(--space-4xl);
  }
  
  .section-padding-x {
    padding-left: var(--space-lg);
    padding-right: var(--space-lg);
  }
}
```

#### Layout Containers
```css
/* Container system with breathing room */
.container-fluid {
  width: 100%;
  max-width: 100vw;
  margin: 0 auto;
  padding-left: var(--space-xl);
  padding-right: var(--space-xl);
}

.container-xl {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-left: var(--space-xl);
  padding-right: var(--space-xl);
}

.container-lg {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

.container-md {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding-left: var(--space-lg);
  padding-right: var(--space-lg);
}

/* Responsive containers */
@media (max-width: 768px) {
  .container-fluid,
  .container-xl,
  .container-lg,
  .container-md {
    padding-left: var(--space-md);
    padding-right: var(--space-md);
  }
}
```

### Visual Elements & Styling

#### Border Radius System
```css
/* Rounded corner hierarchy for softness */
:root {
  --radius-sm: 0.5rem;    /* 8px - small elements */
  --radius-md: 0.75rem;   /* 12px - buttons, inputs */
  --radius-lg: 1rem;      /* 16px - cards, images */
  --radius-xl: 1.5rem;    /* 24px - sections, modals */
  --radius-2xl: 2rem;     /* 32px - hero elements */
  --radius-full: 9999px;  /* Full rounded */
}

.rounded-soft { border-radius: var(--radius-md); }
.rounded-gentle { border-radius: var(--radius-lg); }
.rounded-generous { border-radius: var(--radius-xl); }
.rounded-luxurious { border-radius: var(--radius-2xl); }
```

#### Shadow System
```css
/* Soft, warm shadow system */
:root {
  --shadow-soft: 0 1px 3px rgba(42, 42, 42, 0.05), 0 1px 2px rgba(42, 42, 42, 0.03);
  --shadow-gentle: 0 4px 6px rgba(42, 42, 42, 0.05), 0 2px 4px rgba(42, 42, 42, 0.03);
  --shadow-warm: 0 10px 15px rgba(42, 42, 42, 0.08), 0 4px 6px rgba(42, 42, 42, 0.05);
  --shadow-luxurious: 0 20px 25px rgba(42, 42, 42, 0.1), 0 10px 10px rgba(42, 42, 42, 0.04);
  --shadow-floating: 0 25px 50px rgba(42, 42, 42, 0.15);
}

.shadow-soft { box-shadow: var(--shadow-soft); }
.shadow-gentle { box-shadow: var(--shadow-gentle); }
.shadow-warm { box-shadow: var(--shadow-warm); }
.shadow-luxurious { box-shadow: var(--shadow-luxurious); }
.shadow-floating { box-shadow: var(--shadow-floating); }
```

#### Gradient System
```css
/* Subtle, warm gradients */
:root {
  --gradient-primary: linear-gradient(135deg, var(--cream-white) 0%, var(--soft-ivory) 100%);
  --gradient-warm: linear-gradient(135deg, var(--soft-ivory) 0%, var(--warm-gray) 100%);
  --gradient-accent: linear-gradient(135deg, var(--rose-dust) 0%, var(--champagne) 100%);
  --gradient-metallic: linear-gradient(135deg, var(--gold-whisper) 0%, var(--rose-gold) 100%);
  --gradient-overlay: linear-gradient(180deg, rgba(42, 42, 42, 0) 0%, rgba(42, 42, 42, 0.1) 100%);
}

.bg-gradient-primary { background: var(--gradient-primary); }
.bg-gradient-warm { background: var(--gradient-warm); }
.bg-gradient-accent { background: var(--gradient-accent); }
.bg-gradient-metallic { background: var(--gradient-metallic); }
```

---

## Component Library Specifications

### Base UI Components

#### Button Component System
```typescript
// src/components/ui/Button.tsx
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  magnetic?: boolean;
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  magnetic = false,
  children,
  className = '',
  ...props
}, ref) => {
  const baseStyles = "relative inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-charcoal text-cream-white hover:bg-soft-black focus:ring-charcoal shadow-gentle hover:shadow-warm",
    secondary: "bg-transparent border-2 border-charcoal text-charcoal hover:bg-charcoal hover:text-cream-white focus:ring-charcoal",
    ghost: "bg-transparent text-charcoal hover:bg-warm-gray hover:text-soft-black",
    accent: "bg-gradient-metallic text-charcoal hover:shadow-warm focus:ring-gold-whisper"
  };
  
  const sizes = {
    sm: "px-4 py-2 text-sm rounded-gentle",
    md: "px-6 py-3 text-base rounded-generous", 
    lg: "px-8 py-4 text-lg rounded-generous",
    xl: "px-12 py-5 text-xl rounded-luxurious"
  };
  
  const ButtonComponent = magnetic ? MagneticButton : motion.button;
  
  return (
    <ButtonComponent
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      whileHover={{ y: -2 }}
      whileTap={{ y: 0, scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      {...props}
    >
      {children}
    </ButtonComponent>
  );
});

Button.displayName = 'Button';
```

#### MagneticButton Component
```typescript
// src/components/animations/MagneticButton.tsx
import { useSpring, animated } from 'react-spring';
import { useRef } from 'react';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  strength?: number;
  children: React.ReactNode;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({ 
  strength = 0.15, 
  children, 
  className = '',
  ...props 
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [springProps, set] = useSpring(() => ({ 
    x: 0, 
    y: 0, 
    scale: 1,
    config: { tension: 300, friction: 40 }
  }));
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;
    
    const { left, top, width, height } = buttonRef.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const x = (e.clientX - centerX) * strength;
    const y = (e.clientY - centerY) * strength;
    
    set({ x, y, scale: 1.02 });
  };
  
  const handleMouseLeave = () => {
    set({ x: 0, y: 0, scale: 1 });
  };
  
  return (
    <animated.button
      ref={buttonRef}
      style={{
        transform: springProps.x.to((x, y, scale) => 
          `translate3d(${x}px, ${y}px, 0) scale(${scale})`
        )
      }}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </animated.button>
  );
};
```

#### Card Component System
```typescript
// src/components/ui/Card.tsx
import { motion } from 'framer-motion';
import { forwardRef } from 'react';

interface CardProps {
  variant?: 'default' | 'elevated' | 'outlined' | 'glass';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  variant = 'default',
  padding = 'lg',
  hover = true,
  children,
  className = '',
  ...props
}, ref) => {
  const baseStyles = "relative bg-paper-white rounded-generous transition-all duration-300";
  
  const variants = {
    default: "shadow-gentle",
    elevated: "shadow-warm",
    outlined: "border border-warm-gray shadow-soft",
    glass: "backdrop-blur-sm bg-cream-white/80 shadow-soft"
  };
  
  const paddings = {
    sm: "p-4",
    md: "p-6", 
    lg: "p-8",
    xl: "p-12"
  };
  
  const hoverStyles = hover ? "hover:shadow-warm hover:-translate-y-1" : "";
  
  return (
    <motion.div
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.21, 1, 0.81, 1] }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';
```

#### LazyImage Component
```typescript
// src/components/ui/LazyImage.tsx
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import Image, { ImageProps } from 'next/image';

interface LazyImageProps extends Omit<ImageProps, 'onLoad'> {
  className?: string;
  blurDataURL?: string;
  fallbackSrc?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  blurDataURL,
  fallbackSrc,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);
  
  // Intersection Observer for lazy loading
  useIntersectionObserver(imgRef, (isIntersecting) => {
    if (isIntersecting) {
      setIsInView(true);
    }
  }, { threshold: 0.1, rootMargin: '50px' });
  
  const handleLoad = () => {
    setIsLoaded(true);
  };
  
  const handleError = () => {
    setError(true);
    if (fallbackSrc) {
      // Handle fallback if needed
    }
  };
  
  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-warm-gray to-soft-ivory"
        initial={{ opacity: 1 }}
        animate={{ opacity: isLoaded ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      />
      
      {/* Actual image */}
      {isInView && (
        <motion.div
          className="relative w-full h-full"
          initial={{ filter: "blur(20px)", scale: 1.1 }}
          animate={{ 
            filter: isLoaded ? "blur(0px)" : "blur(20px)",
            scale: isLoaded ? 1 : 1.1 
          }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image
            src={error && fallbackSrc ? fallbackSrc : src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className="object-cover w-full h-full"
            {...props}
          />
        </motion.div>
      )}
    </div>
  );
};
```

### Service Components

#### ServiceCard Component
```typescript
// src/components/ui/ServiceCard.tsx
import { motion } from 'framer-motion';
import { useState } from 'react';
import { LazyImage } from './LazyImage';
import { Button } from './Button';
import { Badge } from './Badge';

interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    shortDescription: string;
    price: number;
    duration: string;
    isPopular?: boolean;
    beforeAfter?: string[];
    perfectFor?: string[];
  };
  variant?: 'compact' | 'detailed';
  showBooking?: boolean;
  index?: number;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  variant = 'compact',
  showBooking = true,
  index = 0
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.21, 1, 0.81, 1] }}
      whileHover={{ y: -8 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Popular badge */}
      {service.isPopular && (
        <motion.div
          className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 + index * 0.1, type: "spring", stiffness: 200 }}
        >
          <Badge variant="popular" className="shadow-warm">
            Most Popular ✨
          </Badge>
        </motion.div>
      )}
      
      <div className="relative bg-paper-white rounded-luxurious shadow-gentle hover:shadow-luxurious transition-all duration-500 overflow-hidden">
        {/* Subtle gradient overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-accent opacity-0 rounded-luxurious"
          animate={{ opacity: isHovered ? 0.1 : 0 }}
          transition={{ duration: 0.4 }}
        />
        
        {/* Service image - Use gallery images for before/after results */}
        {service.beforeAfter && service.beforeAfter[0] && (
          <div className="relative h-56 w-full overflow-hidden">
            <LazyImage
              src={service.beforeAfter[0]} // Map to: gallery-img-3405.jpeg, gallery-075b32b2.jpg, gallery-img-3973.jpeg, gallery-lash-40.jpeg, etc.
              alt={`${service.name} results`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-overlay" />
          </div>
        )}
        
        {/* Content */}
        <div className="relative z-10 p-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-subsection-title text-heading group-hover:text-soft-black transition-colors duration-300">
                {service.name}
              </h3>
            </div>
            <div className="text-right">
              <motion.span 
                className="text-3xl font-light text-heading"
                animate={{ scale: isHovered ? 1.05 : 1 }}
                transition={{ duration: 0.3 }}
              >
                ${service.price}
              </motion.span>
              <p className="text-body-small text-secondary font-light">
                {service.duration}
              </p>
            </div>
          </div>
          
          <p className="text-body text-secondary leading-relaxed mb-6">
            {service.shortDescription}
          </p>
          
          {/* Perfect for tags */}
          {variant === 'detailed' && service.perfectFor && (
            <div className="mb-6">
              <p className="text-caps text-secondary mb-3">Perfect for:</p>
              <div className="flex flex-wrap gap-2">
                {service.perfectFor.slice(0, 3).map((item, idx) => (
                  <Badge key={idx} variant="outline" size="sm">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Book button */}
          {showBooking && (
            <Button
              variant="primary"
              size="lg"
              magnetic
              className="w-full"
              onClick={() => {/* Handle booking */}}
            >
              Book {service.name}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
```

#### TeamMemberCard Component
```typescript
// src/components/ui/TeamMemberCard.tsx
import { motion } from 'framer-motion';
import { LazyImage } from './LazyImage';
import { Button } from './Button';
import { Badge } from './Badge';
import { InstagramIcon } from '@/components/icons';

interface TeamMemberCardProps {
  member: {
    id: string;
    name: string;
    role: string;
    photo: string;
    bio: string;
    specialties: string[];
    instagram?: string;
    isOwner?: boolean;
  };
  showBookingCTA?: boolean;
  index?: number;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({
  member,
  showBookingCTA = false,
  index = 0
}) => {
  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.21, 1, 0.81, 1] }}
    >
      <div className="bg-paper-white rounded-luxurious shadow-gentle hover:shadow-luxurious transition-all duration-500 overflow-hidden">
        <div className="relative">
          {/* Member photo - Map to specific team member images */}
          <div className="aspect-square relative overflow-hidden">
            <LazyImage
              src={member.photo} // Map to: emily-rogers.jpeg (Owner), rachel-edwards.jpeg, ryann-alcorn.png, ashley-petersen.jpg, ava-mata.jpg, savannah-scherer.jpeg, etc.
              alt={member.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
          </div>
          
          {/* Instagram link */}
          {member.instagram && (
            <motion.a
              href={`https://instagram.com/${member.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute top-4 right-4 bg-paper-white/90 backdrop-blur-sm p-3 rounded-generous hover:bg-paper-white transition-colors duration-300 shadow-soft"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <InstagramIcon className="w-5 h-5 text-rose-gold" />
            </motion.a>
          )}
          
          {/* Owner badge */}
          {member.isOwner && (
            <div className="absolute bottom-4 left-4">
              <Badge variant="accent" className="shadow-warm">
                Owner
              </Badge>
            </div>
          )}
        </div>
        
        {/* Member info */}
        <div className="p-8">
          <h3 className="text-subsection-title text-heading mb-1">
            {member.name}
          </h3>
          <p className="text-body text-rose-gold font-medium mb-4">
            {member.role}
          </p>
          
          {/* Specialties */}
          <div className="flex flex-wrap gap-2 mb-4">
            {member.specialties.slice(0, 4).map(specialty => (
              <Badge key={specialty} variant="soft" size="sm">
                {specialty}
              </Badge>
            ))}
          </div>
          
          {/* Bio */}
          <p className="text-body-small text-secondary leading-relaxed mb-6">
            {member.bio}
          </p>
          
          {/* Booking CTA */}
          {showBookingCTA && (
            <Button
              variant="secondary"
              size="md"
              magnetic
              className="w-full"
              onClick={() => {/* Handle booking with specific member */}}
            >
              Book with {member.name.split(' ')[0]}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
```

#### Badge Component
```typescript
// src/components/ui/Badge.tsx
import { motion } from 'framer-motion';

interface BadgeProps {
  variant?: 'default' | 'popular' | 'accent' | 'outline' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'md',
  children,
  className = ''
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300";
  
  const variants = {
    default: "bg-warm-gray text-charcoal",
    popular: "bg-gradient-metallic text-charcoal",
    accent: "bg-rose-dust text-charcoal",
    outline: "bg-transparent border border-warm-gray text-secondary",
    soft: "bg-pearl text-warm-gray-text"
  };
  
  const sizes = {
    sm: "px-3 py-1 text-xs rounded-gentle",
    md: "px-4 py-2 text-sm rounded-generous",
    lg: "px-6 py-3 text-base rounded-generous"
  };
  
  return (
    <motion.span
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      {children}
    </motion.span>
  );
};
```

---

## Animation & Interaction System

### Core Animation Utilities

#### Smooth Scrolling Setup
```typescript
// src/hooks/useSmoothScroll.ts
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

export const useSmoothScroll = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup
    return () => {
      lenis.destroy();
    };
  }, []);
};
```

#### Scroll Reveal Component
```typescript
// src/components/animations/ScrollReveal.tsx
import { motion } from 'framer-motion';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  blur?: boolean;
  className?: string;
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  delay = 0,
  duration = 1.2,
  y = 60,
  scale = 0.95,
  blur = true,
  className = ''
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { 
    once: true, 
    margin: "-10% 0px -10% 0px" 
  });
  
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ 
        opacity: 0, 
        y, 
        scale,
        filter: blur ? "blur(10px)" : "blur(0px)"
      }}
      animate={isInView ? { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        filter: "blur(0px)" 
      } : {}}
      transition={{ 
        duration,
        delay,
        ease: [0.21, 1, 0.81, 1] // Custom easing for elegance
      }}
    >
      {children}
    </motion.div>
  );
};
```

#### Breathing Animation Component
```typescript
// src/components/animations/BreathingElement.tsx
import { motion } from 'framer-motion';

interface BreathingElementProps {
  children: React.ReactNode;
  strength?: number;
  duration?: number;
  className?: string;
}

export const BreathingElement: React.FC<BreathingElementProps> = ({
  children,
  strength = 0.02,
  duration = 4,
  className = ''
}) => {
  return (
    <motion.div
      className={className}
      animate={{
        scale: [1, 1 + strength, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
};
```

#### Parallax Component
```typescript
// src/components/animations/ParallaxSection.tsx
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ParallaxSectionProps {
  children: React.ReactNode;
  speed?: number;
  direction?: 'up' | 'down';
  className?: string;
}

export const ParallaxSection: React.FC<ParallaxSectionProps> = ({
  children,
  speed = 0.5,
  direction = 'up',
  className = ''
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const multiplier = direction === 'up' ? -1 : 1;
  const y = useTransform(
    scrollYProgress, 
    [0, 1], 
    [100 * speed * multiplier, -100 * speed * multiplier]
  );
  
  return (
    <motion.div ref={ref} style={{ y }} className={`relative ${className}`}>
      {children}
    </motion.div>
  );
};
```

#### Floating Elements Component
```typescript
// src/components/animations/FloatingElements.tsx
import { motion } from 'framer-motion';

export const FloatingElements = () => {
  const elements = Array.from({ length: 6 }, (_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15
  }));
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {elements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute rounded-full opacity-20"
          style={{
            width: element.size,
            height: element.size,
            left: `${element.x}%`,
            top: `${element.y}%`,
            background: 'var(--champagne)'
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.sin(element.id) * 50, 0],
            opacity: [0, 0.3, 0],
            scale: [0.8, 1, 0.8]
          }}
          transition={{
            duration: element.duration,
            repeat: Infinity,
            delay: element.delay,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
```

### Gesture Interactions

#### Swipeable Gallery Component
```typescript
// src/components/animations/SwipeableGallery.tsx
import { useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { LazyImage } from '@/components/ui/LazyImage';

interface SwipeableGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    caption?: string;
  }>;
  className?: string;
}

export const SwipeableGallery: React.FC<SwipeableGalleryProps> = ({
  images,
  className = ''
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  
  const handleDragEnd = (event: any, { offset, velocity }: PanInfo) => {
    const swipe = Math.abs(offset.x) > 100 || Math.abs(velocity.x) > 500;
    
    if (!swipe) return;
    
    if (offset.x > 0 && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    } else if (offset.x < 0 && currentIndex < images.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };
  
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    })
  };
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <motion.div
        key={currentIndex}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          x: { type: "spring", stiffness: 300, damping: 30 },
          opacity: { duration: 0.2 }
        }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragEnd={handleDragEnd}
        className="cursor-grab active:cursor-grabbing"
      >
        <LazyImage
          src={images[currentIndex].src}
          alt={images[currentIndex].alt}
          width={800}
          height={600}
          className="rounded-luxurious"
        />
      </motion.div>
      
      {/* Indicators */}
      <div className="flex justify-center mt-6 space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? 'bg-charcoal w-8' 
                : 'bg-warm-gray hover:bg-muted-text'
            }`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
};
```

### Performance Optimization

#### Reduced Motion Handling
```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';

export const useReducedMotion = (): boolean => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };
    
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);
  
  return prefersReducedMotion;
};

// Usage in components
const OptimizedMotion = ({ children, ...props }: any) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return <div {...props}>{children}</div>;
  }
  
  return <motion.div {...props}>{children}</motion.div>;
};
```

---

## Page Structures & Layouts

### Homepage Structure

```typescript
// src/pages/index.tsx
import { GetStaticProps } from 'next';
import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/sections/HeroSection';
import { SocialProofBar } from '@/components/sections/SocialProofBar';
import { PopularServices } from '@/components/sections/PopularServices';
import { WhyChooseLashPop } from '@/components/sections/WhyChooseLashPop';
import { TransformationGallery } from '@/components/sections/TransformationGallery';
import { TeamSpotlight } from '@/components/sections/TeamSpotlight';
import { TestimonialsSection } from '@/components/sections/TestimonialsSection';
import { FinalCTA } from '@/components/sections/FinalCTA';
import { useSmoothScroll } from '@/hooks/useSmoothScroll';

interface HomePageProps {
  services: Service[];
  teamMembers: TeamMember[];
  galleryImages: GalleryImage[];
  testimonials: Testimonial[];
  businessInfo: BusinessInfo;
}

export default function HomePage({ 
  services, 
  teamMembers, 
  galleryImages, 
  testimonials,
  businessInfo 
}: HomePageProps) {
  useSmoothScroll();
  
  const popularServices = services
    .filter(service => service.isPopular)
    .slice(0, 3);
    
  const featuredTeam = teamMembers
    .filter(member => member.isOwner || member.displayOrder <= 3)
    .sort((a, b) => a.displayOrder - b.displayOrder);
  
  return (
    <Layout>
      <HeroSection 
        headline="Wake up gorgeous every day"
        subheadline="Award-winning lash extensions that enhance your natural beauty with an effortless, comfortable feel that lasts."
        backgroundImage="/images/studio/studio-photos-by-salome.jpg" // Use professional studio shot as hero background
        primaryCTA={{
          text: "Book Your Transformation",
          href: "/book",
          variant: "primary"
        }}
        secondaryCTA={{
          text: "Free Consultation", 
          href: "/consultation",
          variant: "secondary"
        }}
      />
      
      <SocialProofBar
        awards={businessInfo.awards}
        reviewCount={businessInfo.reviewStats.count}
        rating={businessInfo.reviewStats.rating}
        instagramFollowers={businessInfo.socialStats.instagram}
      />
      
      <PopularServices 
        services={popularServices}
        title="Our Most Popular Services"
        subtitle="Trusted by 2,000+ satisfied clients"
      />
      
      <WhyChooseLashPop
        benefits={[
          {
            icon: "🏆",
            title: "Award-Winning Expertise", 
            description: "Voted Best Lash Studio in North County San Diego"
          },
          {
            icon: "👩‍🎨",
            title: "Expert Team of 10+ Artists",
            description: "Certified professionals specializing in natural-looking results"
          },
          {
            icon: "⚡",
            title: "Same-Day Appointments",
            description: "Flexible scheduling to fit your busy lifestyle"
          }
        ]}
      />
      
      <TransformationGallery
        images={galleryImages.slice(0, 12)}
        title="Real Results from Real Clients" 
        subtitle="See the LashPop difference"
      />
      
      <TestimonialsSection
        testimonials={testimonials.slice(0, 6)}
        title="What Our Clients Say"
      />
      
      <TeamSpotlight
        teamMembers={featuredTeam}
        title="Meet Your Lash Artists"
        showBookingCTA={true}
      />
      
      <FinalCTA
        headline="Ready for Your Lash Transformation?"
        description="Join 2,000+ satisfied clients who wake up gorgeous every day"
        primaryCTA="Book Your Appointment"
        secondaryCTA="Schedule Free Consultation"
        backgroundImage="/images/studio/studio-photo-135a7828.jpg" // Use elegant studio environment shot
      />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // Load data from static JSON files
  const servicesData = await import('@/data/services.json');
  const teamData = await import('@/data/team.json');
  const galleryData = await import('@/data/gallery.json');
  const testimonialsData = await import('@/data/testimonials.json');
  const businessData = await import('@/data/settings.json');
  
  return {
    props: {
      services: servicesData.lashServices,
      teamMembers: [
        ...teamData.lashpopEmployees, 
        ...teamData.collectiveArtists
      ],
      galleryImages: galleryData.portfolioImages,
      testimonials: testimonialsData.reviews,
      businessInfo: businessData.business
    }
  };
};
```

### Hero Section Component

```typescript
// src/components/sections/HeroSection.tsx
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FloatingElements } from '@/components/animations/FloatingElements';
import { BreathingElement } from '@/components/animations/BreathingElement';
import { LazyImage } from '@/components/ui/LazyImage';

interface HeroSectionProps {
  headline: string;
  subheadline: string;
  backgroundImage: string;
  primaryCTA: {
    text: string;
    href: string;
    variant: string;
  };
  secondaryCTA: {
    text: string;
    href: string;
    variant: string;
  };
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  headline,
  subheadline,
  backgroundImage,
  primaryCTA,
  secondaryCTA
}) => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0 bg-gradient-primary"
          animate={{
            background: [
              "linear-gradient(135deg, var(--cream-white) 0%, var(--soft-ivory) 50%, var(--warm-gray) 100%)",
              "linear-gradient(135deg, var(--soft-ivory) 0%, var(--warm-gray) 50%, var(--cream-white) 100%)",
              "linear-gradient(135deg, var(--cream-white) 0%, var(--soft-ivory) 50%, var(--warm-gray) 100%)"
            ]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      
      {/* Floating ambient elements */}
      <FloatingElements />
      
      {/* Background image with parallax */}
      {backgroundImage && (
        <div className="absolute inset-0 opacity-10">
          <LazyImage
            src={backgroundImage} // Use studio-photos-by-salome.jpg for premium feel
            alt="LashPop Studio Interior"
            fill
            className="object-cover"
          />
        </div>
      )}
      
      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <BreathingElement>
          <motion.h1
            className="text-hero text-heading font-display mb-8"
            initial={{ opacity: 0, y: 40, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 1.5, ease: [0.21, 1, 0.81, 1] }}
          >
            {headline.split(' ').slice(0, 2).join(' ')}
            <motion.span 
              className="text-elegant block mt-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.5, delay: 0.3 }}
            >
              {headline.split(' ').slice(2).join(' ')}
            </motion.span>
          </motion.h1>
        </BreathingElement>
        
        <motion.p
          className="text-body-large text-secondary font-light leading-relaxed mb-12 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        >
          {subheadline}
        </motion.p>
        
        <motion.div
          className="flex flex-col sm:flex-row gap-6 justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 0.8 }}
        >
          <Button
            variant={primaryCTA.variant as any}
            size="xl"
            magnetic
            className="group shadow-warm hover:shadow-luxurious"
          >
            <span className="inline-block">{primaryCTA.text}</span>
            <motion.span
              className="inline-block ml-3"
              animate={{ x: [0, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              →
            </motion.span>
          </Button>
          
          <Button
            variant={secondaryCTA.variant as any}
            size="lg"
            magnetic
            className="text-secondary hover:text-heading"
          >
            {secondaryCTA.text}
          </Button>
        </motion.div>
        
        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, delay: 1.2 }}
        >
          <motion.div
            className="w-6 h-10 border-2 border-warm-gray-text rounded-full flex justify-center"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 bg-warm-gray-text rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
```

### Services Showcase Section

```typescript
// src/components/sections/PopularServices.tsx
import { motion } from 'framer-motion';
import { ServiceCard } from '@/components/ui/ServiceCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';

interface PopularServicesProps {
  services: Service[];
  title: string;
  subtitle?: string;
}

export const PopularServices: React.FC<PopularServicesProps> = ({
  services,
  title,
  subtitle
}) => {
  return (
    <section className="section-padding-y bg-soft-ivory">
      <div className="container-xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-section-title text-heading mb-4">
              {title}
            </h2>
            {subtitle && (
              <p className="text-body-large text-secondary max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        </ScrollReveal>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {services.map((service, index) => (
            <ScrollReveal key={service.id} delay={index * 0.1}>
              <ServiceCard
                service={service}
                variant="detailed"
                showBooking={true}
                index={index}
              />
            </ScrollReveal>
          ))}
        </div>
        
        {/* View all services CTA */}
        <ScrollReveal delay={0.4}>
          <div className="text-center mt-16">
            <Button
              variant="secondary"
              size="lg"
              magnetic
            >
              View All Services
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
```

### Team Spotlight Section

```typescript
// src/components/sections/TeamSpotlight.tsx
import { motion } from 'framer-motion';
import { TeamMemberCard } from '@/components/ui/TeamMemberCard';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { Button } from '@/components/ui/Button';

interface TeamSpotlightProps {
  teamMembers: TeamMember[];
  title: string;
  showBookingCTA?: boolean;
}

export const TeamSpotlight: React.FC<TeamSpotlightProps> = ({
  teamMembers,
  title,
  showBookingCTA = false
}) => {
  return (
    <section className="section-padding-y">
      <div className="container-xl">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-section-title text-heading mb-4">
              {title}
            </h2>
            <p className="text-body-large text-secondary max-w-2xl mx-auto">
              Certified lash artists dedicated to enhancing your natural beauty
            </p>
          </div>
        </ScrollReveal>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
          {teamMembers.map((member, index) => (
            <ScrollReveal key={member.id} delay={index * 0.15}>
              <TeamMemberCard
                member={member}
                showBookingCTA={showBookingCTA}
                index={index}
              />
            </ScrollReveal>
          ))}
        </div>
        
        {/* Meet full team CTA */}
        <ScrollReveal delay={0.5}>
          <div className="text-center mt-16">
            <Button
              variant="ghost"
              size="lg"
              magnetic
            >
              Meet Our Full Team
            </Button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
```

---

## Mobile-First Implementation

### Responsive Design Breakpoints

```css
/* Mobile-first breakpoint system */
:root {
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}

/* Base mobile styles */
.container {
  width: 100%;
  padding-left: 1rem;
  padding-right: 1rem;
}

/* Responsive container sizes */
@media (min-width: 640px) {
  .container { max-width: 640px; padding-left: 1.5rem; padding-right: 1.5rem; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; padding-left: 2rem; padding-right: 2rem; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1200px; }
}
```

### Mobile Navigation Component

```typescript
// src/components/layout/MobileNav.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  const navItems = [
    { name: 'Services', href: '/services' },
    { name: 'Our Team', href: '/team' }, 
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' }
  ];
  
  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  return (
    <div className="lg:hidden">
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50 p-2 text-charcoal"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-6 relative">
          <motion.span
            className="absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out"
            animate={{
              rotate: isOpen ? 45 : 0,
              y: isOpen ? 0 : -8
            }}
          />
          <motion.span
            className="absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out"
            animate={{
              opacity: isOpen ? 0 : 1
            }}
          />
          <motion.span
            className="absolute h-0.5 w-6 bg-current transform transition-all duration-300 ease-out"
            animate={{
              rotate: isOpen ? -45 : 0,
              y: isOpen ? 0 : 8
            }}
          />
        </div>
      </button>
      
      {/* Mobile menu overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-cream-white z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center justify-center h-full space-y-8">
              {navItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.4 }}
                >
                  <Link
                    href={item.href}
                    className="text-3xl font-light text-charcoal hover:text-soft-black transition-colors duration-300"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.name}
                  </Link>
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.4 }}
                className="mt-12"
              >
                <Button 
                  variant="primary"
                  size="lg"
                  magnetic
                  onClick={() => setIsOpen(false)}
                >
                  Book Now
                </Button>
              </motion.div>
              
              {/* Contact info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="text-center mt-8"
              >
                <p className="text-secondary mb-2">Call us directly</p>
                <a 
                  href="tel:760-212-0448"
                  className="text-xl font-medium text-charcoal hover:text-rose-gold transition-colors"
                >
                  760-212-0448
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

### Mobile Booking Float

```typescript
// src/components/booking/MobileBookingFloat.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VagaroWidget } from './VagaroWidget';

export const MobileBookingFloat = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  
  return (
    <>
      {/* Floating booking button */}
      <motion.button
        className="fixed bottom-4 right-4 z-30 lg:hidden bg-gradient-metallic text-charcoal font-semibold px-6 py-4 rounded-full shadow-luxurious"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsBookingOpen(true)}
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        Book Now
      </motion.button>
      
      {/* Mobile booking drawer */}
      <AnimatePresence>
        {isBookingOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-charcoal bg-opacity-50"
              onClick={() => setIsBookingOpen(false)}
            />
            
            {/* Drawer */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-cream-white rounded-t-luxurious max-h-[80vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              <div className="p-6 border-b border-warm-gray">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-medium text-heading">
                    Book Your Appointment
                  </h3>
                  <button
                    onClick={() => setIsBookingOpen(false)}
                    className="p-2 text-secondary hover:text-heading"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto">
                <VagaroWidget
                  isOpen={isBookingOpen}
                  onClose={() => setIsBookingOpen(false)}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
```

### Touch-Optimized Components

```css
/* Touch-friendly interactive elements */
.touch-target {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

/* Mobile-specific spacing */
@media (max-width: 768px) {
  .section-padding-y {
    padding-top: 4rem;
    padding-bottom: 4rem;
  }
  
  .text-hero {
    font-size: 2.5rem;
    line-height: 1.1;
  }
  
  .text-section-title {
    font-size: 2rem;
    line-height: 1.2;
    margin-bottom: 2rem;
  }
  
  /* Mobile service cards */
  .service-card {
    margin-bottom: 2rem;
  }
  
  /* Mobile team cards */
  .team-member-card {
    margin-bottom: 2rem;
  }
  
  /* Mobile gallery */
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

/* Extra small devices */
@media (max-width: 480px) {
  .container {
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .text-hero {
    font-size: 2rem;
  }
  
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
```

---

## Performance & Optimization

### Image Optimization Strategy

```typescript
// src/utils/imageOptimization.ts
export const getOptimizedImageUrl = (
  src: string, 
  width: number, 
  height?: number,
  quality: number = 85
): string => {
  // If using Cloudinary
  if (src.includes('cloudinary.com')) {
    const baseUrl = src.split('/upload/')[0] + '/upload/';
    const imagePath = src.split('/upload/')[1];
    
    let transformations = [`w_${width}`, `q_${quality}`, 'f_auto'];
    
    if (height) {
      transformations.push(`h_${height}`, 'c_fill', 'g_auto');
    }
    
    return `${baseUrl}${transformations.join(',/')}/${imagePath}`;
  }
  
  // Fallback for other images
  return src;
};

// Responsive image sizes
export const getResponsiveSizes = (maxWidth: number): string => {
  return [
    `(max-width: 640px) ${Math.round(maxWidth * 0.9)}px`,
    `(max-width: 768px) ${Math.round(maxWidth * 0.8)}px`,
    `(max-width: 1024px) ${Math.round(maxWidth * 0.7)}px`,
    `${maxWidth}px`
  ].join(', ');
};
```

### Lazy Loading Implementation

```typescript
// src/hooks/useIntersectionObserver.ts
import { useEffect, RefObject } from 'react';

export const useIntersectionObserver = (
  ref: RefObject<Element>,
  callback: (isIntersecting: boolean) => void,
  options: IntersectionObserverInit = {}
) => {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        callback(entry.isIntersecting);
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    );
    
    observer.observe(element);
    
    return () => {
      observer.unobserve(element);
    };
  }, [ref, callback, options]);
};
```

### Bundle Optimization

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    domains: ['images.squarespace-cdn.com', 'res.cloudinary.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },
  
  // Compression
  compress: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // Bundle optimization
  experimental: {
    optimizeCss: true,
    legacyBrowsers: false,
    browsersListForSwc: true,
  },
  
  // Webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle splitting
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|react-spring)[\\/]/,
            name: 'animations',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const trackWebVitals = (metric: any) => {
  // Track Core Web Vitals
  switch (metric.name) {
    case 'CLS':
      // Cumulative Layout Shift
      console.log('CLS:', metric.value);
      break;
    case 'FID':
      // First Input Delay
      console.log('FID:', metric.value);
      break;
    case 'FCP':
      // First Contentful Paint
      console.log('FCP:', metric.value);
      break;
    case 'LCP':
      // Largest Contentful Paint
      console.log('LCP:', metric.value);
      break;
    case 'TTFB':
      // Time to First Byte
      console.log('TTFB:', metric.value);
      break;
    default:
      break;
  }
  
  // Send to analytics (Google Analytics, etc.)
  if (typeof gtag !== 'undefined') {
    gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_label: metric.id,
      non_interaction: true,
    });
  }
};
```

---

## Image Asset Mapping & Component Integration

### Component-Specific Image Recommendations

#### Hero Section Background Images
```typescript
// Primary hero backgrounds (studio environment shots)
const heroBgs = {
  primary: '/images/studio/studio-photos-by-salome.jpg',     // Professional studio photography - main hero
  secondary: '/images/studio/studio-photo-135a7828.jpg',     // Featured studio interior - alternate hero
  environmental: '/images/studio/studio-lash-65.jpeg'        // Studio work environment - testimonials section
};
```

#### Service Card Image Mapping
```typescript
// Map service types to gallery images for before/after showcase
const serviceImages = {
  'classic-lash': {
    icon: '/images/services/classic-lash.png',
    gallery: ['/images/gallery/gallery-img-3405.jpeg', '/images/gallery/lash-136.jpeg'],
    hero: '/images/gallery/gallery-img-3961.jpeg'  // Close-up natural results
  },
  'hybrid-lash': {
    icon: '/images/services/hybrid-lash.png', 
    gallery: ['/images/gallery/gallery-075b32b2.jpg', '/images/gallery/lash-102.jpeg'],
    hero: '/images/gallery/gallery-lash-40.jpeg'  // Premium transformation
  },
  'volume-lash': {
    icon: '/images/services/volume-lash.png',
    gallery: ['/images/gallery/gallery-1b1e9a79.jpg', '/images/gallery/gallery-img-3973.jpeg'],
    hero: '/images/gallery/gallery-img-7044.jpg'  // Dramatic volume results
  },
  'lash-lift': {
    icon: '/images/services/lash-lift.png',
    gallery: ['/images/gallery/lash-92.jpeg', '/images/gallery/gallery-img-3962.jpeg'],
    hero: '/images/gallery/gallery-img-1754.jpg'  // Natural lift results
  },
  'brow-services': {
    icon: '/images/services/brow-photo.png',
    gallery: ['/images/gallery/gallery-img-3974.jpeg'],
    hero: '/images/gallery/gallery-img-3962.jpeg'  // Brow work showcase
  }
};
```

#### Team Member Photo Mapping
```typescript
// Team member image assignments with roles and specialties
const teamMembers = {
  // LashPop Studios Core Team
  'emily-rogers': {
    photo: '/images/team/emily-rogers.jpeg',        // Owner - Primary featured member
    role: 'Owner & Master Lash Artist',
    isOwner: true,
    displayOrder: 1,
    specialties: ['Volume Lashes', 'Classic Lashes', 'Training']
  },
  'rachel-edwards': {
    photo: '/images/team/rachel-edwards.jpeg',      // Core team member
    role: 'Senior Lash Artist',
    displayOrder: 2,
    specialties: ['Hybrid Lashes', 'Classic Lashes']
  },
  'ryann-alcorn': {
    photo: '/images/team/ryann-alcorn.png',         // Core team member
    role: 'Lash Specialist',
    displayOrder: 3,
    specialties: ['Volume Lashes', 'Lash Lifts']
  },
  
  // Collective of Beauty Businesses Artists
  'ashley-petersen': {
    photo: '/images/team/ashley-petersen.jpg',      // Multi-service artist
    role: 'Hydrafacials & Lash Artist',
    displayOrder: 4,
    specialties: ['Hydrafacials', 'Classic Lashes']
  },
  'ava-mata': {
    photo: '/images/team/ava-mata.jpg',             // Lash specialist
    role: 'Lash Artist',
    displayOrder: 5,
    specialties: ['Volume Lashes', 'Hybrid Lashes']
  },
  'savannah-scherer': {
    photo: '/images/team/savannah-scherer.jpeg',    // Multi-service artist
    role: 'Lash Artist & Brow Specialist',
    displayOrder: 6,
    specialties: ['Lash Extensions', 'Brow Shaping', 'Facials']
  }
  // Additional team members: elena-castellanos.jpeg, adrianna-arnaud.jpg, 
  // kelly-katona.jpeg, bethany-peterson.jpeg, grace-ramos.jpg, 
  // renee-belton.jpg, evie-ells.jpg
};
```

#### Gallery Section Image Curation
```typescript
// Curated gallery images for different sections
const galleryCollections = {
  // Homepage transformation gallery (best quality, diverse styles)
  homepage: [
    '/images/gallery/gallery-1b1e9a79.jpg',        // High-res transformation (880KB)
    '/images/gallery/gallery-lash-40.jpeg',        // Premium portfolio work (664KB) 
    '/images/gallery/gallery-075b32b2.jpg',        // Professional results (471KB)
    '/images/gallery/lash-102.jpeg',               // Quality work sample (406KB)
    '/images/gallery/lash-136.jpeg',               // Portfolio highlight (292KB)
    '/images/gallery/gallery-img-3961.jpeg',       // Close-up detail (230KB)
    '/images/gallery/gallery-img-3962.jpeg',       // Natural results (192KB)
    '/images/gallery/gallery-img-7044.jpg',        // Professional work (163KB)
    '/images/gallery/gallery-img-3974.jpeg',       // Portfolio sample (155KB)
    '/images/gallery/gallery-img-3973.jpeg',       // Quality results (131KB)
    '/images/gallery/lash-92.jpeg',                // Natural transformation (206KB)
    '/images/gallery/gallery-img-3405.jpeg'        // Subtle results (57KB)
  ],
  
  // Service-specific galleries
  classicLashes: [
    '/images/gallery/gallery-img-3405.jpeg',       // Natural, classic look
    '/images/gallery/lash-136.jpeg',               // Professional classic work
    '/images/gallery/gallery-img-1754.jpg'         // Subtle enhancement
  ],
  
  volumeLashes: [
    '/images/gallery/gallery-1b1e9a79.jpg',        // Dramatic volume
    '/images/gallery/gallery-lash-40.jpeg',        // Full volume results
    '/images/gallery/gallery-075b32b2.jpg'         // Premium volume work
  ],
  
  hybridLashes: [
    '/images/gallery/lash-102.jpeg',               // Balanced hybrid style
    '/images/gallery/gallery-img-3973.jpeg',       // Natural hybrid results
    '/images/gallery/gallery-img-7044.jpg'         // Professional hybrid work
  ]
};
```

#### Brand Asset Integration
```typescript
// Logo and branding usage throughout site
const brandAssets = {
  logos: {
    primary: '/images/branding/logo.png',          // Main logo (7.5KB) - header, footer
    secondary: '/images/branding/logo-secondary.png' // Alt logo (7.5KB) - mobile, small spaces
  },
  
  // Service icon usage in UI components
  serviceIcons: {
    '/images/services/classic-lash.png': 'Classic Lashes',     // 1.7KB
    '/images/services/hybrid-lash.png': 'Hybrid Lashes',       // 2.0KB  
    '/images/services/volume-lash.png': 'Volume Lashes',       // 2.2KB
    '/images/services/lash-lift.png': 'Lash Lifts',           // 2.0KB
    '/images/services/brow-photo.png': 'Brow Services'         // 1.8KB
  }
};
```

#### Mobile-Optimized Image Strategy
```typescript
// Mobile-specific image handling and optimization
const mobileImageStrategy = {
  hero: {
    desktop: '/images/studio/studio-photos-by-salome.jpg',
    mobile: '/images/studio/studio-photo-135a7828.jpg',  // Better mobile composition
    placeholder: 'data:image/jpeg;base64...'              // Blur placeholder
  },
  
  gallery: {
    // Use smaller file sizes for mobile gallery thumbnails
    thumbnails: [
      '/images/gallery/gallery-img-3405.jpeg',           // 57KB - quick load
      '/images/gallery/gallery-img-1754.jpg',            // 103KB - small size
      '/images/gallery/gallery-img-3973.jpeg'            // 131KB - good quality
    ],
    
    // High-res versions for modal/fullscreen
    fullsize: [
      '/images/gallery/gallery-1b1e9a79.jpg',           // 880KB - premium quality
      '/images/gallery/gallery-lash-40.jpeg',           // 664KB - detailed work
      '/images/gallery/gallery-075b32b2.jpg'            // 471KB - professional shot
    ]
  }
};
```

#### Image Loading Performance Strategy
```typescript
// Priority loading for critical images
const imageLoadingPriority = {
  critical: [
    '/images/studio/studio-photos-by-salome.jpg',     // Hero background
    '/images/branding/logo.png',                      // Site logo
    '/images/team/emily-rogers.jpeg'                  // Owner photo (above fold)
  ],
  
  high: [
    '/images/services/classic-lash.png',              // Popular service icons
    '/images/services/hybrid-lash.png',
    '/images/services/volume-lash.png',
    '/images/gallery/gallery-1b1e9a79.jpg'           // Hero gallery image
  ],
  
  lazy: [
    // All other gallery images load as user scrolls
    // Team member photos load when team section is visible
    // Studio environment photos load for testimonials section
  ]
};
```

### Image Optimization Guidelines

#### File Size Optimization
- **Small icons (< 10KB)**: Service icons, logos - Use PNG for transparency, optimize for web
- **Medium photos (100-300KB)**: Team member photos - JPEG 85% quality, 800px max width
- **Large gallery images (300-500KB)**: Portfolio images - JPEG 90% quality, 1200px max width  
- **Hero images (400-800KB)**: Background images - JPEG 95% quality, 1920px max width

#### Responsive Image Strategy
- Generate 3 sizes: mobile (640px), tablet (1024px), desktop (1920px)
- Use WebP format with JPEG fallbacks
- Implement lazy loading for all images below the fold
- Use blur-to-sharp transitions for premium feel

---

## Content Strategy & Data Structure

*[Content section includes all the JSON data structures for team, services, gallery, testimonials, and business settings as detailed in the previous comprehensive specification]*

---

## Vagaro Integration Specifications

*[Complete Vagaro integration code including VagaroWidget component, BookingButton, and AvailabilityPreview components as detailed in the previous specification]*

---

## Development Timeline & Deliverables

### Development Timeline (Prototype Phase)

#### Week 1: Setup & Core Components

**Days 1-2: Project Setup**
- [ ] Initialize Next.js project with TypeScript
- [ ] Set up Tailwind CSS and Framer Motion  
- [ ] Configure image optimization (Cloudinary/Next.js Image)
- [ ] Create project structure
- [ ] Set up static data files with current content
- [ ] **Import all 36 images from existing library into organized structure**
  - [ ] Team photos: emily-rogers.jpeg (Owner), rachel-edwards.jpeg, etc.
  - [ ] Service icons: classic-lash.png, hybrid-lash.png, etc.
  - [ ] Gallery images: gallery-1b1e9a79.jpg, gallery-lash-40.jpeg, etc.
  - [ ] Studio photos: studio-photos-by-salome.jpg, studio-photo-135a7828.jpg
  - [ ] Brand assets: logo.png, logo-secondary.png

**Days 3-5: Core UI Components**
- [ ] Build ServiceCard component with animations
  - [ ] **Integrate service icons**: classic-lash.png, hybrid-lash.png, volume-lash.png, lash-lift.png, brow-photo.png
  - [ ] **Map gallery images** to service before/after showcases
- [ ] Create TeamMemberCard component
  - [ ] **Integrate all 13 team member photos** with proper mapping
  - [ ] **Feature emily-rogers.jpeg prominently** as Owner
- [ ] Develop BookingButton component  
- [ ] Build responsive Layout components (Header, Footer)
  - [ ] **Integrate logo.png in header**, logo-secondary.png for mobile
- [ ] Create reusable UI elements (buttons, badges, etc.)

#### Week 2: Page Development

**Days 1-2: Homepage**
- [ ] Build HeroSection with background video/image
  - [ ] **Use studio-photos-by-salome.jpg as primary hero background**
  - [ ] **Implement subtle parallax with studio environment**
- [ ] Create SocialProofBar component
- [ ] Develop PopularServices showcase
  - [ ] **Feature top gallery images**: gallery-1b1e9a79.jpg, gallery-lash-40.jpeg, gallery-075b32b2.jpg
- [ ] Build WhyChooseLashPop benefits section

**Days 3-4: Service & Team Pages**
- [ ] Create individual service detail pages
  - [ ] **Map specific gallery images to each service type**
  - [ ] **Use service icons as visual elements throughout**
- [ ] Build comprehensive team page
  - [ ] **Feature all 13 team member photos in organized layout**
  - [ ] **Prioritize emily-rogers.jpeg, rachel-edwards.jpeg, ryann-alcorn.png as core team**
  - [ ] **Include collective artists with proper attribution**
- [ ] Develop service category filtering
- [ ] Add before/after gallery integration
  - [ ] **Curate 12 best gallery images for main showcase**
  - [ ] **Implement swipeable gallery with all portfolio images**

**Day 5: Contact & Mobile**
- [ ] Build contact page with Vagaro integration
- [ ] Implement mobile navigation
- [ ] Add mobile-specific interactions
- [ ] Mobile booking flow optimization

#### Week 3: Polish & Integration

**Days 1-2: Vagaro Integration**
- [ ] Implement styled Vagaro booking widget
- [ ] Create booking modal/drawer for mobile
- [ ] Add service-specific booking flows
- [ ] Test booking functionality

**Days 3-4: Performance & SEO**
- [ ] Image optimization and lazy loading
- [ ] SEO meta tags and schema markup
- [ ] Performance testing and optimization
- [ ] Cross-browser compatibility testing

**Day 5: Final Polish**
- [ ] Animation refinements
- [ ] Mobile experience testing
- [ ] Content review and optimization
- [ ] Deployment to staging environment

### Budget Breakdown

#### Prototype Phase: $8,000 - $12,000
- Design implementation: $4,000 - $6,000
- Component development: $2,000 - $3,000
- Vagaro integration: $1,000 - $1,500
- Testing and optimization: $1,000 - $1,500

#### CMS Integration Phase (if approved): $18,000 - $25,000
- Backend/CMS development: $8,000 - $12,000  
- Dynamic frontend integration: $6,000 - $8,000
- Admin interface development: $3,000 - $4,000
- Training and documentation: $1,000 - $1,000

**Total Potential Investment:** $26,000 - $37,000

---

## Conclusion

This comprehensive specification provides the complete roadmap for creating LashPop Studios' chill modern aesthetic website. The prototype-first approach allows for client feedback and approval before committing to the full development investment, while the detailed technical specifications ensure consistent implementation of the sophisticated design vision.

The combination of quiet luxury design principles, modern web technologies, and seamless Vagaro integration will create a website that truly reflects LashPop's premium brand while driving significant improvements in user experience and booking conversions.