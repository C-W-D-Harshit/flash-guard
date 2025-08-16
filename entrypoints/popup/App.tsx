import { useState, useEffect } from "react";
import { browser } from "wxt/browser";
import "./App.css";

function App() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [dimLevel, setDimLevel] = useState(0.5);
  const [brightnessThreshold, setBrightnessThreshold] = useState(0.6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from storage
    browser.storage.sync
      .get([
        "flashGuardEnabled",
        "flashGuardDimLevel",
        "flashGuardBrightnessThreshold",
      ])
      .then((result) => {
        setIsEnabled(result.flashGuardEnabled !== false);
        setDimLevel(result.flashGuardDimLevel || 0.5);
        setBrightnessThreshold(result.flashGuardBrightnessThreshold || 0.6);
        setIsLoading(false);
      });
  }, []);

  const handleToggle = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    browser.storage.sync.set({ flashGuardEnabled: newEnabled });
  };

  const handleDimLevelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDimLevel = parseFloat(e.target.value);
    setDimLevel(newDimLevel);
    browser.storage.sync.set({ flashGuardDimLevel: newDimLevel });
  };

  const handleBrightnessThresholdChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newThreshold = parseFloat(e.target.value);
    setBrightnessThreshold(newThreshold);
    browser.storage.sync.set({ flashGuardBrightnessThreshold: newThreshold });
  };

  const getDimLevelLabel = (value: number) => {
    if (value <= 0.2) return "Light";
    if (value <= 0.4) return "Moderate";
    if (value <= 0.6) return "Strong";
    if (value <= 0.8) return "Very Strong";
    return "Maximum";
  };

  const getBrightnessLabel = (value: number) => {
    if (value <= 0.3) return "Very Low";
    if (value <= 0.5) return "Low";
    if (value <= 0.7) return "Medium";
    if (value <= 0.9) return "High";
    return "Very High";
  };

  if (isLoading) {
    return (
      <div className="flashguard-popup">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flashguard-popup">
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <div className="shield-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L3 6V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V6L12 2Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12L11 14L15 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="brand">
              <h1>FlashGuard</h1>
              <span className="tagline">Eye Protection</span>
            </div>
          </div>
          <div className="status">
            <span
              className={`status-indicator ${
                isEnabled ? "active" : "inactive"
              }`}
            >
              <span className="status-dot"></span>
              {isEnabled ? "Active" : "Disabled"}
            </span>
          </div>
        </div>
      </div>

      <div className="controls">
        <div className="toggle-section">
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={handleToggle}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
          </label>
          <div className="toggle-label">
            <span className="main-text">
              Protection {isEnabled ? "Enabled" : "Disabled"}
            </span>
            <span className="sub-text">
              {isEnabled
                ? "Automatically dims bright flashes"
                : "Click to enable flash protection"}
            </span>
          </div>
        </div>

        {isEnabled && (
          <div className="controls-section">
            <div className="control-group">
              <label className="control-label">
                <span>
                  Brightness Trigger:{" "}
                  <strong>{getBrightnessLabel(brightnessThreshold)}</strong>
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={brightnessThreshold}
                onChange={handleBrightnessThresholdChange}
                className="control-slider"
              />
              <div className="control-scale">
                <span>Sensitive</span>
                <span>Only Very Bright</span>
              </div>
              <div className="control-description">
                <small>When to start dimming videos</small>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">
                <span>
                  Dim Strength: <strong>{getDimLevelLabel(dimLevel)}</strong>
                </span>
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.1"
                value={dimLevel}
                onChange={handleDimLevelChange}
                className="control-slider"
              />
              <div className="control-scale">
                <span>Light</span>
                <span>Maximum</span>
              </div>
              <div className="control-description">
                <small>How much to dim bright videos</small>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="footer">
        <div className="credits">
          <span>Made with 💖 by </span>
          <a
            href="https://x.com/cwd_harshit"
            target="_blank"
            rel="noopener noreferrer"
            className="author-link"
          >
            Harshit
          </a>
        </div>
        <a
          href="https://github.com/C-W-D-Harshit/flash-guard"
          target="_blank"
          rel="noopener noreferrer"
          className="star-button"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
          Star it
        </a>
      </div>
    </div>
  );
}

export default App;
