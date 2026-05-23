'use client';

// Skill #29 — Skip to main content link
// Must be the FIRST element in every page layout.
// Visually hidden until focused via keyboard.

export function SkipNavLink() {
  return (
    <a
      href="#main-content"
      className={[
        // Hidden by default
        'sr-only',
        // Visible when focused — keyboard users can see it
        'focus:not-sr-only',
        'focus:fixed',
        'focus:left-4',
        'focus:top-4',
        'focus:z-[9999]',
        'focus:rounded-lg',
        'focus:bg-primary-700',
        'focus:px-4',
        'focus:py-2',
        'focus:text-sm',
        'focus:font-semibold',
        'focus:text-white',
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-white',
        'focus:ring-offset-2',
        'focus:ring-offset-primary-700',
      ].join(' ')}
    >
      Skip to main content
    </a>
  );
}
