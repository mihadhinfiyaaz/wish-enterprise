import { Link } from 'react-router-dom';
import ProductImage from './ProductImage';
import { formatPrice } from '../lib/format';

export default function ProductCard({ product }) {
  return (
    <Link
      to={`/product/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-line-2 hover:shadow-lift"
    >
      {/* Studio product photo — consistent framing + subtle hover zoom */}
      <div className="relative aspect-[4/3] overflow-hidden border-b border-line">
        <ProductImage product={product} />
        <span className="pill absolute left-3 top-3 z-10 !py-1 text-[10px] uppercase tracking-[0.12em]">
          {product.material}
        </span>
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[15px] font-semibold leading-snug text-fg transition-colors group-hover:text-accent">
          {product.name}
        </h3>

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wider text-faint">Retail</p>
            <p className="mt-0.5 text-base font-semibold text-fg">{formatPrice(product.retail_price)}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent-2 dark:text-accent">
              Wholesale
            </p>
            <p className="mt-0.5 text-base font-bold text-fg">
              {formatPrice(product.wholesale_price)}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
