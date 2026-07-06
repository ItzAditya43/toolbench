import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AssistBar() {
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  async function handleAsk() {
    if (!instruction.trim()) return;
    setStatus({ type: "busy", text: "asking Ollama…" });
    try {
      const res = await fetch("/api/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (data.error) {
        setStatus({ type: "err", text: data.error });
        return;
      }
      if (data.toolId) {
        const toolId = data.toolId;
        setStatus({ type: "ok", text: `Found it — opening ${toolId.replace(/-/g, " ")}…` });
        // Fetch tools to find the category for this tool
        const toolsRes = await fetch("/api/tools");
        const toolsData = await toolsRes.json();
        const tool = toolsData.tools.find((t) => t.id === toolId);
        if (tool) {
          // Navigate to the category page with the tool as a query param
          navigate(`/category/${tool.category}?tool=${toolId}`);
        } else {
          setStatus({ type: "err", text: `Tool "${toolId}" not found.` });
        }
      } else {
        setStatus({ type: "ok", text: "couldn't match that to a tool yet." });
      }
    } catch (err) {
      setStatus({ type: "err", text: err.message });
    }
  }

  return (
    <section className="pipeline" id="assist">
      <div className="wrap">
        <div className="section-label">ai layer — optional, local</div>
        <h2 className="section-title">Tell it what you need. Ollama picks the tool.</h2>
        <p className="section-desc">
          This calls a local model at localhost:11434 — nothing leaves your network.
          If Ollama isn't running, the tool grid above still works fine on its own.
        </p>
        <div className="assist-bar">
          <input
            type="text"
            placeholder='try: "shrink this pdf under 2mb"'
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button className="btn btn-primary" onClick={handleAsk}>Ask</button>
        </div>
        <div className={`status-line ${status?.type === "ok" ? "ok" : status?.type === "err" ? "err" : ""}`}>
          {status?.text}
        </div>
      </div>
    </section>
  );
}