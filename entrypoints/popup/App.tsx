import { useState, useEffect } from 'react';
import { browser } from 'wxt/browser';
import './App.css';

function App() {
  const [isEnabled, setIsEnabled] = useState(true);
  const [dimLevel, setDimLevel] = useState(0.5);
  const [brightnessThreshold, setBrightnessThreshold] = useState(0.6);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load settings from storage
    browser.storage.sync.get([
      'flashGuardEnabled', 
      'flashGuardDimLevel',
      'flashGuardBrightnessThreshold'
    ]).then((result) => {
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

  const handleBrightnessThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newThreshold = parseFloat(e.target.value);
    setBrightnessThreshold(newThreshold);
    browser.storage.sync.set({ flashGuardBrightnessThreshold: newThreshold });
  };

  const getDimLevelLabel = (value: number) => {
    if (value <= 0.2) return 'Light';
    if (value <= 0.4) return 'Moderate';
    if (value <= 0.6) return 'Strong';
    if (value <= 0.8) return 'Very Strong';
    return 'Maximum';
  };

  const getBrightnessLabel = (value: number) => {
    if (value <= 0.3) return 'Very Low';
    if (value <= 0.5) return 'Low';
    if (value <= 0.7) return 'Medium';
    if (value <= 0.9) return 'High';
    return 'Very High';
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
        <div className="logo">
          <div className="shield-icon">🛡️</div>
          <h1>FlashGuard</h1>
        </div>
        <div className="status">
          <span className={`status-indicator ${isEnabled ? 'active' : 'inactive'}`}>
            {isEnabled ? 'Active' : 'Disabled'}
          </span>
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
            <span className="main-text">Protection {isEnabled ? 'Enabled' : 'Disabled'}</span>
            <span className="sub-text">
              {isEnabled ? 'Automatically dims bright flashes' : 'Click to enable flash protection'}
            </span>
          </div>
        </div>

        {isEnabled && (
          <div className="controls-section">
            <div className="control-group">
              <label className="control-label">
                <span>Brightness Trigger: <strong>{getBrightnessLabel(brightnessThreshold)}</strong></span>
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
                <span>Dim Strength: <strong>{getDimLevelLabel(dimLevel)}</strong></span>
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

      <div className="info">
        <div className="info-item">
          <span className="info-icon">👁️</span>
          <span>Protects against eye strain and bright flashes</span>
        </div>
        <div className="info-item">
          <span className="info-icon">⚡</span>
          <span>Works on YouTube, Twitch, Vimeo, and more</span>
        </div>
      </div>
    </div>
  );
}

export default App;
