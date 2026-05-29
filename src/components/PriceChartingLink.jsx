import { buildPriceChartingSearchUrl } from "../priceChartingService";

function PriceChartingLink({ title, className = "" }) {
  const url = buildPriceChartingSearchUrl(title);
  if (!url) return null;

  return (
    <div className={className}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="button is-link is-light is-small"
      >
        Check PriceCharting
      </a>
      <p className="help">Opens PriceCharting in a new tab</p>
    </div>
  );
}

export default PriceChartingLink;
