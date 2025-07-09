# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Claude Piano is a futuristic web-based electronic piano that allows users to play music using their PC keyboard. This is a planned web application that will be deployed to GitHub Pages.

## Key Features to Implement

- **Keyboard Mapping**: Keys A-\ mapped to piano notes C4-G5
- **Sound Types**: 5 futuristic sound types (Synth Lead, Pad, Bass, Arpeggio, FX)
- **Visual Effects**: Futuristic key press animations, sound visualization, ripple effects
- **Recording**: Real-time recording with MIDI/WAV export
- **Performance**: <50ms key response time, up to 8 simultaneous notes

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Audio**: Web Audio API
- **Animations**: CSS Animations / JavaScript
- **Deployment**: GitHub Pages
- **Requirements**: HTTPS (for Web Audio API)

## Architecture

Based on the specifications, the project will follow a 4-phase development approach:

1. **Phase 1**: Basic structure with HTML/CSS/JS, Web Audio API integration, keyboard event handling
2. **Phase 2**: Visual effects, animations, and sound visualization
3. **Phase 3**: Recording, presets, and tutorial features
4. **Phase 4**: Performance optimization and deployment

## Color Scheme

- Primary: #00D4FF (cyber blue)
- Secondary: #FF0080 (neon pink)
- Accent: #00FF88 (neon green)
- Background: #0A0A0A (dark gray)
- Text: #FFFFFF (white)

## Development Notes

- Web Audio API requires user interaction before audio playback
- Maximum 8 simultaneous notes supported
- Mobile/tablet touch support planned
- Accessibility features required (ARIA, keyboard navigation)
- Browser compatibility: Chrome, Firefox, Safari, Edge (latest versions)

## Current Status

This is a new project with only specifications documented. No source code has been implemented yet.