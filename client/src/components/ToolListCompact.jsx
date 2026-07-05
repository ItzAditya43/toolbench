export default function ToolListCompact({ tools, activeTool, onSelect }) {
  return (
    <div className="tool-list-compact">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className={`tool-row${activeTool && activeTool.id === tool.id ? " active" : ""}`}
          onClick={() => onSelect(tool)}
        >
          <span className="tool-row-icon">{tool.icon}</span>
          <div className="tool-row-body">
            <div className="tool-row-name">{tool.name}</div>
            <div className="tool-row-desc">{tool.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}