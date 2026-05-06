import { useState } from 'react';
import Scene from './Scene.jsx';
import { ORG } from './data.js';

export default function App() {
  const [showAgents, setShowAgents] = useState(false);
  const [orgData, setOrgData] = useState(ORG);
  const [showEditor, setShowEditor] = useState(false);
  const [editorText, setEditorText] = useState("");

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showHeadshots, setShowHeadshots] = useState(true);
  const [showTitles, setShowTitles] = useState(true);
  const [showLocations, setShowLocations] = useState(true);

  // Detail panel state
  const [selectedNode, setSelectedNode] = useState(null);

  const openEditor = () => {
    setEditorText(JSON.stringify(orgData, null, 2));
    setShowEditor(true);
  };

  const saveEditor = () => {
    try {
      const parsed = JSON.parse(editorText);
      setOrgData(parsed);
      setShowEditor(false);
    } catch (e) {
      alert("Invalid JSON format. Please fix any syntax errors before saving.");
    }
  };

  return (
    <div className="app">
      <Scene
        key={JSON.stringify(orgData) + `${showHeadshots}-${showTitles}-${showLocations}`}
        data={orgData}
        showAgents={showAgents}
        zoomLevel={zoomLevel}
        showHeadshots={showHeadshots}
        showTitles={showTitles}
        showLocations={showLocations}
        onSelect={(node) => setSelectedNode(node)}
      />

      {/* ----- top toolbar ----- */}
      <header className="topbar">
        <div className="brand">
          <BrandMark />
          <span className="brand-name">Acme</span>
        </div>

        <div className="topbar-section">
          <span className="ctl-label">Zoom Level</span>
          <div className="zoom-group">
            {[1, 2, 3, 4].map(lvl => (
              <button
                key={lvl}
                className={`zoom-btn ${zoomLevel === lvl ? 'active' : ''}`}
                onClick={() => setZoomLevel(lvl)}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div className="topbar-section view-controls">
          <span className="ctl-label">View Controls</span>

          <label className="toggle-label">
            <input type="checkbox" checked={showHeadshots} onChange={(e) => setShowHeadshots(e.target.checked)} />
            <span className="slider"></span>
            Headshots
          </label>

          <label className="toggle-label">
            <input type="checkbox" checked={showTitles} onChange={(e) => setShowTitles(e.target.checked)} />
            <span className="slider"></span>
            Titles
          </label>

          <label className="toggle-label">
            <input type="checkbox" checked={showLocations} onChange={(e) => setShowLocations(e.target.checked)} />
            <span className="slider"></span>
            Locations
          </label>

          <label className="toggle-label">
            <input type="checkbox" checked={showAgents} onChange={(e) => setShowAgents(e.target.checked)} />
            <span className="slider"></span>
            Show Agents
          </label>
        </div>

        <div className="topbar-actions">
          <button className="icon-btn" onClick={openEditor}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
          </button>
        </div>
      </header>

      {/* Slide-in Detail Panel */}
      <div className={`detail-panel ${selectedNode ? 'open' : ''}`}>
        {selectedNode && (
          <div className="detail-content">
            <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
            <div className="detail-header">
              <h2>{selectedNode.name}</h2>
              <div className="detail-title">{selectedNode.title}</div>
              {selectedNode.location && <div className="detail-loc">📍 {selectedNode.location}</div>}
            </div>

            {selectedNode.agents && selectedNode.agents.length > 0 && (
              <div className="detail-agents">
                <h3>Direct Reporting Agents</h3>
                <ul>
                  {selectedNode.agents.map((agent, i) => (
                    <li key={i}>
                      <span className="agent-dot" style={{ backgroundColor: agent.color || '#888' }}></span>
                      <div className="agent-info">
                        <strong>{agent.name}</strong>
                        <span>{agent.kind}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* JSON Editor Modal — glassy lavender to match the rest of the page */}
      {showEditor && (
        <div className="editor-backdrop" onClick={(e) => {
          if (e.target === e.currentTarget) setShowEditor(false);
        }}>
          <div className="editor-card">
            <div className="editor-head">
              <div>
                <div className="editor-eyebrow">Org Data</div>
                <h2 className="editor-title">Edit Chart Data</h2>
              </div>
              <button
                className="editor-close"
                onClick={() => setShowEditor(false)}
                aria-label="Close"
              >×</button>
            </div>
            <p className="editor-hint">
              Edit the JSON below to change the org structure. Save to apply changes.
            </p>
            <textarea
              className="editor-textarea"
              value={editorText}
              onChange={(e) => setEditorText(e.target.value)}
              spellCheck="false"
            />
            <div className="editor-actions">
              <button className="agents-btn" onClick={() => setShowEditor(false)}>
                Cancel
              </button>
              <button className="agents-btn on" onClick={saveEditor}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------- icons --------------------

function BrandMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M4 20 L12 4 L20 20 L15 20 L12 14 L9 20 Z" fill="#2563eb" />
    </svg>
  );
}
