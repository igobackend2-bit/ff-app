'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';

interface WishlistButtonProps {
  product: Product;
  size?: 'sm' | 'md';
  className?: string;
}

export function WishlistButton({ product, size = 'sm', className }: WishlistButtonProps) {
  const toggleItem   = useWishlistStore((s) => s.toggleItem);
  const isWishlisted = useWishlistStore((s) => s.isWishlisted);
  const [mounted, setMounted] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const wishlisted = mounted && isWishlisted(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    toggleItem(product);
    setTimeout(() => setAnimating(false), 400);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={wishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
      aria-pressed={wishlisted}
      className={cn(
        'flex items-center justify-center rounded-full transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-1',
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9',
        wishlisted
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/80 text-neutral-400 hover:bg-white hover:text-red-400',
        animating && 'scale-125',
        className,
      )}
    >
      <Heart
        className={cn(
          'transition-all duration-200',
          size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5',
          wishlisted ? 'fill-red-500 stroke-red-500' : 'fill-none',
        )}
        aria-hidden="true"
      />
    </button>
  );
}
