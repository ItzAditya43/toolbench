import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";

const CATEGORY_ICONS = {
  pdf: "FileText",
  image: "Image",
  video: "Video",
  audio: "Music",
  text: "FileType",
  downloader: "Download",
};

function Icon({ name, size = 20, strokeWidth = 1.75 }) {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} strokeWidth={strokeWidth} />;
}

export default function CategoryGrid() {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        const grouped = {};
        data.tools.forEach((tool) => {
          const cat = tool.category || "other";
          if (!grouped[cat]) {
            grouped[cat] = { slug: cat, name: cat.charAt(0).toUpperCase() + cat.slice(1), tools: [] };
          }
          grouped[cat].tools.push(tool);
        });
        setCategories(Object.values(grouped));
      })
      .catch(() => setError("Couldn't reach the API server at :4500 — is it running?"));
  }, []);

  if (error) {
    return <p className="status-line err" style={{ marginTop: 20 }}>{error}</p>;
  }

  return (
    <div className="category-grid">
      {categories.map((cat) => (
        <Link key={cat.slug} to={`/category/${cat.slug}`} className="category-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span className="socket-id">{cat.slug.toUpperCase()}</span>
            <span className="category-count">{cat.tools.length} {cat.tools.length === 1 ? "tool" : "tools"}</span>
          </div>
          <div>
            <div className="socket-icon">
              <Icon name={CATEGORY_ICONS[cat.slug] || "Box"} size={26} strokeWidth={1.5} />
            </div>
            <div className="socket-name">{cat.name}</div>
            <div className="socket-desc">
              {cat.tools.map((t) => t.name).join(", ")}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}