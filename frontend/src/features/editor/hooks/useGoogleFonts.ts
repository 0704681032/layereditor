import { useEffect, useCallback } from 'react';

// Google Fonts that need to be loaded dynamically
const GOOGLE_FONT_NAMES = [
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 'Raleway', 'Poppins',
  'Source Sans Pro', 'Nunito', 'Ubuntu', 'Inter', 'Playfair Display', 'Merriweather',
  'Lora', 'Bitter', 'Libre Baskerville', 'Bebas Neue', 'Lobster', 'Pacifico',
  'Abril Fatface', 'Righteous', 'Caveat', 'Fira Code', 'JetBrains Mono', 'Source Code Pro',
];

// Track loaded fonts to avoid duplicate loading
const loadedFonts = new Set<string>();

/**
 * Load a Google Font dynamically by appending a link element to the document head
 */
export function loadGoogleFont(fontFamily: string): void {
  // Skip if already loaded or not a Google font
  if (loadedFonts.has(fontFamily) || !GOOGLE_FONT_NAMES.includes(fontFamily)) {
    return;
  }

  // Create the Google Fonts URL
  const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@300;400;500;600;700;800&display=swap`;

  // Create and append the link element
  const link = document.createElement('link');
  link.href = fontUrl;
  link.rel = 'stylesheet';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);

  // Mark as loaded
  loadedFonts.add(fontFamily);
}

/**
 * Load multiple Google Fonts at once
 */
export function loadGoogleFonts(fonts: string[]): void {
  fonts.forEach(loadGoogleFont);
}

/**
 * React hook to load Google Fonts used in layer content
 */
export function useGoogleFontsLoader(layers: { fontFamily?: string }[]): void {
  useEffect(() => {
    const fontsToLoad = layers
      .map(layer => layer.fontFamily)
      .filter((font): font is string => font !== undefined && GOOGLE_FONT_NAMES.includes(font));

    loadGoogleFonts(fontsToLoad);
  }, [layers]);
}

/**
 * Preload all common Google Fonts for better UX
 */
export function preloadCommonFonts(): void {
  loadGoogleFonts(['Roboto', 'Open Sans', 'Montserrat', 'Inter', 'Playfair Display', 'Lato']);
}