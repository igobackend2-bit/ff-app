// Product reviews section
export async function ProductReviews({ productId }: { productId: string }) {
  // In prod: fetch reviews from /api/products/[id]/reviews
  return (
    <section aria-labelledby="reviews-heading" className="mt-8 border-t border-neutral-100 pt-8">
      <h2 id="reviews-heading" className="mb-4 text-lg font-bold text-neutral-900">
        Customer Reviews
      </h2>
      <p className="text-sm text-neutral-500">
        Reviews for this product will appear here once customers start sharing their experience.
      </p>
    </section>
  );
}
