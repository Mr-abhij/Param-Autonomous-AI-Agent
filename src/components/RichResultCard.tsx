import { MapPin, Star, Tag, ExternalLink, IndianRupee, DollarSign, Utensils, Hotel, Camera, Bus, ShoppingBag, Dumbbell } from 'lucide-react';

interface StructuredItem {
  name: string;
  category?: string;
  location?: string;
  priceRange?: string;
  rating?: number;
  description?: string;
  tags?: string[];
  mapQuery?: string;
}

interface BudgetItem {
  category: string;
  amount: string;
  percentage: number;
}

interface StructuredData {
  items?: StructuredItem[];
  budgetBreakdown?: {
    items: BudgetItem[];
    total?: string;
  };
  tips?: string[];
}

interface RichResultCardProps {
  structuredData: StructuredData;
}

const categoryIcons: Record<string, React.ReactNode> = {
  restaurant: <Utensils className="h-4 w-4" />,
  hotel: <Hotel className="h-4 w-4" />,
  attraction: <Camera className="h-4 w-4" />,
  transport: <Bus className="h-4 w-4" />,
  shopping: <ShoppingBag className="h-4 w-4" />,
  activity: <Dumbbell className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  restaurant: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  hotel: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  attraction: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  transport: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  shopping: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  activity: 'bg-green-500/15 text-green-400 border-green-500/20',
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3 w-3 ${i <= Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : i - 0.5 <= rating ? 'text-yellow-400 fill-yellow-400/50' : 'text-muted-foreground/30'}`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{rating.toFixed(1)}</span>
    </div>
  );
}

function ItemCard({ item }: { item: StructuredItem }) {
  const cat = item.category?.toLowerCase() || 'attraction';
  const colorClass = categoryColors[cat] || categoryColors.attraction;
  const icon = categoryIcons[cat] || <Camera className="h-4 w-4" />;
  const mapUrl = item.mapQuery
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.mapQuery)}`
    : item.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.name + ' ' + item.location)}`
      : null;

  return (
    <div className="group border border-border rounded-lg bg-card/80 hover:bg-secondary/50 transition-all duration-200 overflow-hidden">
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`shrink-0 p-1.5 rounded-md border ${colorClass}`}>
              {icon}
            </span>
            <div className="min-w-0">
              <h4 className="text-sm font-semibold text-foreground truncate">{item.name}</h4>
              {item.location && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">{item.location}</span>
                </div>
              )}
            </div>
          </div>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              title="View on map"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {item.description && (
          <p className="text-xs text-secondary-foreground leading-relaxed mb-2">{item.description}</p>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            {item.rating && <StarRating rating={item.rating} />}
            {item.priceRange && (
              <span className="flex items-center gap-0.5 text-xs font-medium text-primary">
                {item.priceRange.includes('₹') ? <IndianRupee className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                {item.priceRange.replace(/[₹$]/g, '')}
              </span>
            )}
          </div>
        </div>

        {item.tags && item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {item.tags.map((tag, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetBar({ item, maxPercentage }: { item: BudgetItem; maxPercentage: number }) {
  const width = Math.max((item.percentage / maxPercentage) * 100, 8);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-secondary-foreground font-medium">{item.category}</span>
        <span className="text-foreground font-semibold">{item.amount}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground">{item.percentage}% of budget</span>
    </div>
  );
}

export function RichResultCard({ structuredData }: RichResultCardProps) {
  if (!structuredData) return null;

  const { items, budgetBreakdown, tips } = structuredData;
  const maxPercentage = budgetBreakdown?.items?.length
    ? Math.max(...budgetBreakdown.items.map(b => b.percentage))
    : 100;

  return (
    <div className="space-y-4 mt-3">
      {/* Items Grid */}
      {items && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {items.map((item, i) => (
            <ItemCard key={i} item={item} />
          ))}
        </div>
      )}

      {/* Budget Breakdown */}
      {budgetBreakdown && budgetBreakdown.items?.length > 0 && (
        <div className="border border-border rounded-lg bg-card/80 p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Budget Breakdown</h4>
            {budgetBreakdown.total && (
              <span className="text-sm font-bold text-primary">{budgetBreakdown.total}</span>
            )}
          </div>
          <div className="space-y-3">
            {budgetBreakdown.items.map((item, i) => (
              <BudgetBar key={i} item={item} maxPercentage={maxPercentage} />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <div className="border border-border rounded-lg bg-card/80 p-3.5">
          <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">💡 Pro Tips</h4>
          <ul className="space-y-1.5">
            {tips.map((tip, i) => (
              <li key={i} className="text-xs text-secondary-foreground flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">▸</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
