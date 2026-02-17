# Global Design System

## Overview

This document defines the core design tokens and global styles for the Kazas website. All components must adhere to these rules to maintain consistency.

## Colors

### Primary Palette

- **Primary Dark**: `#0f172a` (Tailwind: `bg-primary`, `text-primary`) - Used for main text, deep backgrounds.
- **Gold**: `#d4af37` (Tailwind: `text-gold`, `bg-gold`) - Used for accents, buttons, highlights.
- **Surface Dark**: `#1e293b` (Tailwind: `bg-surface-dark`) - Used for dark mode card backgrounds.
- **Cream/Off-White**: `#fdfcf8` (Tailwind: `bg-[#Fdfcf8]`) - Main background color.

### Functional Colors

- **Success**: Green (used in simulator charts for positive revenue).
- **Muted**: `text-white/60` or `text-primary/60` - Used for secondary text.

## Typography

### Font Family

- **Main**: `Instrument Sans` (Google Fonts).
- **Fallbacks**: `sans-serif`.

### Scale

- **H1 (Hero)**: `text-4xl` (Mobile) / `md:text-7xl` (Desktop). Bold, Tight tracking.
- **H2 (Section Titles)**: `text-3xl` / `md:text-5xl`.
- **Body**: `text-base` / `md:text-lg`.

## Spacing & Layout

### Container

- **Max Width**: `max-w-7xl` (1280px).
- **Padding**: `px-4` (Mobile) / `px-6` (Desktop).

### Section Spacing

- **Vertical Padding**: `py-16` (Mobile) / `py-24` (Desktop).
- **Gap**: `gap-8` (Standard) / `gap-12` (Large).

## Effects

### Glassmorphism

- **Class**: `.glass-morphism`
- **Properties**: `backdrop-blur-md`, `bg-white/10` (or variable opacity), `border-white/20`.

### Shadows

- **Neon Glow**: `shadow-[0_0_15px_rgba(212,175,55,0.3)]` (Gold glow).
- **Soft**: `shadow-lg` (Standard elevation).
