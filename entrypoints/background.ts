import { browser } from 'wxt/browser';

export default defineBackground(() => {
  // Initialize default settings
  browser.runtime.onInstalled.addListener(() => {
    browser.storage.sync.get([
      'flashGuardEnabled', 
      'flashGuardDimLevel',
      'flashGuardBrightnessThreshold'
    ]).then((result) => {
      // Set defaults if not already set
      const defaults: Record<string, any> = {};
      
      if (result.flashGuardEnabled === undefined) {
        defaults.flashGuardEnabled = true;
      }
      
      if (result.flashGuardDimLevel === undefined) {
        defaults.flashGuardDimLevel = 0.5;
      }
      
      if (result.flashGuardBrightnessThreshold === undefined) {
        defaults.flashGuardBrightnessThreshold = 0.6;
      }
      
      if (Object.keys(defaults).length > 0) {
        browser.storage.sync.set(defaults);
      }
    });
  });

  // Handle messages from content scripts or popup
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getSettings') {
      browser.storage.sync.get([
        'flashGuardEnabled', 
        'flashGuardDimLevel',
        'flashGuardBrightnessThreshold'
      ]).then((result) => {
        sendResponse({
          enabled: result.flashGuardEnabled !== false,
          dimLevel: result.flashGuardDimLevel || 0.5,
          brightnessThreshold: result.flashGuardBrightnessThreshold || 0.6
        });
      });
      return true; // Keep message channel open for async response
    }
    
    if (message.action === 'updateSettings') {
      browser.storage.sync.set(message.settings);
      sendResponse({ success: true });
    }
  });
});
