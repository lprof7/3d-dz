import { Link } from 'react-router-dom';
import type { Product } from '../../data/types';

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/product/${product.slug}`} className="group rounded-lg overflow-hidden transition-all hover:-translate-y-1"
      style={{ backgroundColor: '#1e1f25' }}
    >
      <div className="aspect-square overflow-hidden" style={{ backgroundColor: '#282a2f' }}>
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant">3d_rotation</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-body-md font-semibold mb-1 truncate">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="text-price-display text-primary">{(product.effectivePrice || product.price).toLocaleString()} DA</span>
          {product.discountPercent != null && product.discountPercent > 0 && (
            <span className="text-body-sm text-outline line-through">{product.price.toLocaleString()} DA</span>
          )}
        </div>
      </div>
    </Link>
  );
}
