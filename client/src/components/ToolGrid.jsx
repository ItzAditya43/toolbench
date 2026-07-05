import { useEffect, useState } from "react";

export default function ToolGrid({ tools: externalTools, onToolSelect }) {
  const [tools, setTools] = useState(externalTools || []);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (externalTools) {
      setTools(externalTools);
      return;
    }

    fetch("/api/tools")
      .then((r) => r.json())
      .then((data) => setTools(data.tools))
      .catch(() => setError("Couldn't reach the API server at :4500 — is it running?"));
  }, [externalTools]);

  return (
    <>
      <div className="socket-grid">
        {tools.map((tool, i) => (
          <div key={tool.id} className="socket" onClick={() => onToolSelect(tool)} style={{ cursor: "pointer" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="socket-id">{String(i + 1).padStart(2, "0")} / {tool.category.toUpperCase()}</span>
              <span className="socket-status">● active</span>
            </div>
            <div>
              <div className="socket-icon">{tool.icon}</div>
              <div className="socket-name">{tool.name}</div>
              <div className="socket-desc">{tool.description}</div>
            </div>
          </div>
        ))}
      </div>

      {error && <p className="status-line err" style={{ marginTop: 20 }}>{error}</p>}
    </>
  );
}