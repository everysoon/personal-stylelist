import "./HairstyleGrid.css";

export interface HairstyleItem {
  name: string;
  desc: string;
  imageUrl: string | null;
}

interface Props {
  items: HairstyleItem[];
}

export default function HairstyleGrid({ items }: Props) {
  return (
    <div className="hair-grid">
      {items.map((item, i) => (
        <div key={i} className="hair-card">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.name} className="hair-card-img" />
          ) : (
            <div className="hair-card-error">생성 실패</div>
          )}
          <div className="hair-card-info">
            <p className="hair-card-name">{item.name}</p>
            <p className="hair-card-desc">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
