export default function ProductCard({ product }) {
  const p = product || {};
  const title = p.title || "Untitled product";
  const image = p.image || "https://via.placeholder.com/320x320.png?text=No+Image";
  const price = p.price ?? "Price unavailable";
  const rating =
    typeof p.rating === "number" ? `${p.rating.toFixed(1)}★` : null;
  const reviews =
    typeof p.reviewsCount === "number" ? `(${p.reviewsCount})` : null;

  return (
    <a
      href={p.url || "#"}
      target="_blank"
      rel="noreferrer"
      className="card"
      onClick={(e) => {
        if (!p.url) e.preventDefault();
      }}
    >
      <img src={image} alt={title} loading="lazy" />
      <div className="info">
        <div className="title">{title}</div>
        <div className="meta">
          <span>{price}</span>
          {p.prime ? <span className="badge">Prime</span> : null}
        </div>
        <div className="meta">
          {rating ? <span>{rating}</span> : <span>Rating N/A</span>}
          {reviews ? <span>{reviews}</span> : null}
        </div>
      </div>
    </a>
  );
}
