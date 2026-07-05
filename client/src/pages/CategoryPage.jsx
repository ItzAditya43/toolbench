import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import ToolGrid from "../components/ToolGrid.jsx";
import ToolListCompact from "../components/ToolListCompact.jsx";
import RunPanel from "../components/RunPanel.jsx";
import SplitDivider from "../components/SplitDivider.jsx";

const STORAGE_KEY = "toolbench:splitWidth";
const MIN_LEFT_PCT = 22;
const MIN_RIGHT_PCT = 40;
const DEFAULT_LEFT_PCT = 33;

export default function CategoryPage() {
  const { slug } = useParams();
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
        <h2 className="section-title">{categoryName}</h2>
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