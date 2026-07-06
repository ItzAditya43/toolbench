import * as Icons from "lucide-react";

function Icon({ name, size = 20, strokeWidth = 1.75 }) {
  const LucideIcon = Icons[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} strokeWidth={strokeWidth} />;
}

export default function ToolListCompact({ tools, activeTool, onSelect }) {
  return (
    <div className="tool-list-compact">
      {tools.map((tool) => (
        <div
          key={tool.id}
          className={`tool-row${activeTool && activeTool.id === tool.id ? " active" : ""}`}
          onClick={() => onSelect(tool)}
        >
          <span className="tool-row-icon">
            <Icon name={tool.icon} size={20} strokeWidth={1.75} />
          </span>
          <div className="tool-row-body">
            <div className="tool-row-name">{tool.name}</div>
            <div className="tool-row-desc">{tool.description}</div>
          </div>
        </div>
      ))}
    </div>
  );
}