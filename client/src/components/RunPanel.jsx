import { useState } from "react";

export default function RunPanel({ tool, onClose }) {
  const isUrlOnly = tool.accepts?.includes("url");
  const isTextOnly = tool.accepts?.includes("text");
  const isMultiFile = tool.multiFile;
  const hasNamedFiles = tool.namedFiles && tool.namedFiles.length > 0;
  const isFileUpload = !isUrlOnly && !isTextOnly;

  const schema = tool.optionsSchema || [];

  const initialValues = Object.fromEntries(
    schema.map((f) => [f.key, f.default ?? ""])
  );

  const [files, setFiles] = useState([]);         // for multiFile
  const [namedFileValues, setNamedFileValues] = useState({}); // for namedFiles
  const [file, setFile] = useState(null);          // single file
  const [values, setValues] = useState(initialValues);
  const [aiRename, setAiRename] = useState(false);
  const [status, setStatus] = useState(null);
  const [result, setResult] = useState(null);

  function setValue(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  function setNamedFile(name, fileObj) {
    setNamedFileValues((v) => ({ ...v, [name]: fileObj }));
  }

  async function handleRun() {
    setStatus({ type: "busy", text: "running…" });
    setResult(null);
    try {
      const form = new FormData();

      if (isMultiFile) {
        if (files.length === 0) {
          setStatus({ type: "err", text: "choose at least one file first" });
          return;
        }
        for (const f of files) {
          form.append("files", f);
        }
      } else if (hasNamedFiles) {
        for (const name of tool.namedFiles) {
          const f = namedFileValues[name];
          if (!f) {
            setStatus({ type: "err", text: `upload a file for "${name}"` });
            return;
          }
          form.append(name, f);
        }
      } else if (isFileUpload) {
        if (!file) {
          setStatus({ type: "err", text: "choose a file first" });
          return;
        }
        form.append("file", file);
      }

      form.append("options", JSON.stringify(values));
      form.append("aiRename", String(aiRename));

      const res = await fetch(`/api/tools/${tool.id}`, { method: "POST", body: form });
      const data = await res.json();

      if (!data.ok) {
        setStatus({ type: "err", text: data.error || "something went wrong" });
        return;
      }
      setResult(data);
      setStatus({ type: "ok", text: "done" });
    } catch (err) {
      setStatus({ type: "err", text: err.message });
    }
  }

  function renderDropzone(key, label, fileVal, setter) {
    return (
      <label className={`dropzone ${fileVal ? "active" : ""}`} key={key}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) setter(e.dataTransfer.files[0]);
        }}
      >
        {fileVal ? fileVal.name : `drop ${label} here, or click to choose`}
        <input type="file" style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files[0]) setter(e.target.files[0]);
          }} />
      </label>
    );
  }

  return (
    <div className="run-panel-inline">
      <div className="run-panel-header">
        <h3>{tool.name}</h3>
        <button className="btn btn-ghost btn-close" onClick={onClose}>✕</button>
      </div>
      <p className="desc">{tool.description}</p>

      {isMultiFile && (
        <label className={`dropzone ${files.length > 0 ? "active" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length > 0) setFiles(Array.from(e.dataTransfer.files));
          }}
        >
          {files.length > 0
            ? `${files.length} file(s) selected: ${files.map((f) => f.name).join(", ")}`
            : "drop files here, or click to choose (multi-file)"}
          <input type="file" style={{ display: "none" }} multiple
            onChange={(e) => {
              if (e.target.files.length > 0) setFiles(Array.from(e.target.files));
            }} />
        </label>
      )}

      {hasNamedFiles && tool.namedFiles.map((name) =>
        renderDropzone(name, name, namedFileValues[name], (f) => setNamedFile(name, f))
      )}

      {isFileUpload && !isMultiFile && !hasNamedFiles && (
        <label
          className={`dropzone ${file ? "active" : ""}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]);
          }}
        >
          {file ? file.name : "drop a file here, or click to choose"}
          <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
        </label>
      )}

      {schema.map((f) => (
        <div className="field" key={f.key}>
          <label>{f.label}</label>
          {f.type === "select" && (
            <select
              value={values[f.key]}
              onChange={(e) => setValue(f.key, e.target.value)}
              style={{ width: "100%", background: "var(--panel-2)", border: "1px solid var(--line)", color: "var(--text)", padding: "10px 12px", borderRadius: 4, fontFamily: "var(--mono)", fontSize: 13 }}
            >
              {f.options.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
          {f.type === "checkbox" && (
            <input
              type="checkbox"
              checked={!!values[f.key]}
              onChange={(e) => setValue(f.key, e.target.checked)}
            />
          )}
          {f.type === "text" && (
            <input
              type="text"
              placeholder={f.placeholder}
              value={values[f.key]}
              onChange={(e) => setValue(f.key, e.target.value)}
            />
          )}
        </div>
      ))}

      <label className="ai-toggle">
        <input type="checkbox" checked={aiRename} onChange={(e) => setAiRename(e.target.checked)} />
        suggest a filename with Ollama (optional, needs it running locally)
      </label>

      <div className="modal-actions">
        <button className="btn btn-primary" onClick={handleRun}>Run</button>
      </div>

      <div className={`status-line ${status?.type === "ok" ? "ok" : status?.type === "err" ? "err" : ""}`}>
        {status?.text}
      </div>

      {result && (
        <div className="status-line ok">
          <a href={result.downloadUrl} download={result.outputName}>
            ↓ download {result.outputName}
          </a>
          {result.meta?.savedPercent != null && ` — ${result.meta.savedPercent}% smaller`}
          {result.meta?.fileCount > 1 && ` — ${result.meta.fileCount} files (playlist), first one shown`}
        </div>
      )}
    </div>
  );
}