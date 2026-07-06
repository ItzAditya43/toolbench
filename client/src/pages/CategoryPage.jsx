import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import ToolGrid from "../components/ToolGrid.jsx";
import ToolListCompact from "../components/ToolListCompact.jsx";
import RunPanel from "../components/RunPanel.jsx";
import SplitDivider from "../components/SplitDivider.jsx";

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

const STORAGE_KEY = "toolbench:splitWidth";
const MIN_LEFT_PCT = 22;
const MIN_RIGHT_PCT = 40;
const DEFAULT_LEFT_PCT = 33;

export default function CategoryPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [tools, setTools] = useState([]);
  const [error, setError] = useState(null);
  const [activeTool, setActiveTool] = useState(null);
  const [leftPct, setLeftPct] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const n = parseFloat(saved);
      if (!isNaN(n)) return Math.max(MIN_LEFT_PCT, Math.min(100 - MIN_RIGHT_PCT, n));
    }
    return DEFAULT_LEFT_PCT;
  });

  useEffect(() => {
    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => {
        const filtered = data.tools.filter((t) => t.category === slug);
        setTools(filtered);
      })
      .catch(() => setError("Couldn't reach the API server at :4500 — is it running?"));
  }, [slug]);

  // Auto-open tool from query param (used by AI assist deep-link)
  useEffect(() => {
    const toolId = searchParams.get("tool");
    if (toolId && tools.length > 0) {
      const found = tools.find((t) => t.id === toolId);
      if (found) {
        setActiveTool(found);
      }
    }
  }, [searchParams, tools]);

  const handleResize = useCallback(
    (pct) => {
      const clamped = Math.max(MIN_LEFT_PCT, Math.min(100 - MIN_RIGHT_PCT, pct));
      setLeftPct(clamped);
      localStorage.setItem(STORAGE_KEY, String(clamped));
    },
    []
  );

  const handleSelectTool = useCallback((tool) => {
    setActiveTool(tool);
  }, []);

  const handleCloseTool = useCallback(() => {
    setActiveTool(null);
  }, []);

  const categoryName = slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "";

  return (
    <section className="sockets" id="tools">
      <div className="wrap">
        <div className="breadcrumb">
          <Link to="/">← all categories</Link>
        </div>

        <div className="section-label">category</div>
        <h2 className="section-title" style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Icon name={CATEGORY_ICONS[slug] || "Box"} size={28} strokeWidth={1.5} />
          {categoryName}
        </h2>
        <p className="section-desc">
          {tools.length} {tools.length === 1 ? "tool" : "tools"} in this category
        </p>

        {error && <p className="status-line err" style={{ marginTop: 20 }}>{error}</p>}

        {!error && tools.length === 0 && (
          <p className="status-line" style={{ marginTop: 20 }}>No tools found in this category.</p>
        )}

        {!error && tools.length > 0 && !activeTool && (
          <ToolGrid tools={tools} onToolSelect={handleSelectTool} />
        )}

        {!error && tools.length > 0 && activeTool && (
          <div className="split-container">
            <div className="split-left" style={{ flexBasis: `${leftPct}%` }}>
              <ToolListCompact
                tools={tools}
                activeTool={activeTool}
                onSelect={handleSelectTool}
              />
            </div>
            <SplitDivider onResize={handleResize} />
            <div className="split-right" style={{ flexBasis: `${100 - leftPct}%` }}>
              <RunPanel tool={activeTool} onClose={handleCloseTool} />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}