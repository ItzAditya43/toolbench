import { useState } from "react";

export default function AssistBar() {
  const [instruction, setInstruction] = useState("");
  const [status, setStatus] = useState(null);

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
      setStatus({
        type: "ok",
        text: data.toolId
          ? `→ routed to "${data.toolId}". Open that socket above to run it.`
          : "couldn't match that to a tool yet.",
      });
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
