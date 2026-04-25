/**
 * Avatar — initials-fallback avatar component.
 *
 * If `src` is provided, renders the image; otherwise renders the user's
 * initials over a gradient. Sizes: 'sm' | 'md' | 'lg' (default 'md').
 */
export default function Avatar({ name = '', src = '', size = 'md', alt }) {
    const initials = (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || '?';

    const sizeClass = size === 'sm' ? 'avatar-sm' : size === 'lg' ? 'avatar-lg' : 'avatar-md';

    return (
        <span className={`avatar ${sizeClass}`} aria-label={alt || name || 'avatar'}>
            {src ? <img src={src} alt={alt || name} /> : initials}
        </span>
    );
}
