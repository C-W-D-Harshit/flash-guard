import { browser } from "wxt/browser";

export default defineContentScript({
  matches: [
    "*://www.youtube.com/*",
    "*://youtube.com/*",
    "*://www.twitch.tv/*",
    "*://twitch.tv/*",
    "*://vimeo.com/*",
    "*://www.vimeo.com/*",
    "*://*/*",
  ],
  main() {
    let isEnabled = true;
    let dimLevel = 0.5; // How much to dim (0.1 = light, 0.9 = maximum)
    let brightnessThreshold = 0.6; // When to trigger dimming (0.1 = sensitive, 1.0 = only very bright)
    let currentVideo: HTMLVideoElement | null = null;
    let monitoringInterval: number | null = null;
    let currentDimLevel = 0;
    let lastBrightness = 0;

    // Canvas for analyzing video frames
    let analysisCanvas: HTMLCanvasElement | null = null;
    let analysisContext: CanvasRenderingContext2D | null = null;

    function initializeYtDimmer() {
      // Load settings from storage
      browser.storage.sync
        .get([
          "ytDimmerEnabled",
          "ytDimmerDimLevel",
          "ytDimmerBrightnessThreshold",
        ])
        .then((result) => {
          isEnabled = result.ytDimmerEnabled !== false; // Default to true
          dimLevel = result.ytDimmerDimLevel || 0.5;
          brightnessThreshold = result.ytDimmerBrightnessThreshold || 0.6;

          // Always start monitoring so we can remove dimming when disabled
          startMonitoring();
        })
        .catch((err) => {
          // Use defaults on storage error
          isEnabled = true;
          dimLevel = 0.5;
          brightnessThreshold = 0.6;
          // Always start monitoring so we can remove dimming when disabled
          startMonitoring();
        });

      // Listen for settings changes
      browser.storage.onChanged.addListener((changes) => {
        if (changes.ytDimmerEnabled) {
          isEnabled = changes.ytDimmerEnabled.newValue;
          // If disabled, immediately remove any dimming
          if (!isEnabled) {
            removeDimming();
          }
        }
        if (changes.ytDimmerDimLevel) {
          dimLevel = changes.ytDimmerDimLevel.newValue;
        }
        if (changes.ytDimmerBrightnessThreshold) {
          brightnessThreshold = changes.ytDimmerBrightnessThreshold.newValue;
        }
      });
    }

    function createAnalysisCanvas(): void {
      if (!analysisCanvas) {
        analysisCanvas = document.createElement("canvas");
        analysisCanvas.width = 64; // Small size for performance
        analysisCanvas.height = 36;
        // Use willReadFrequently for faster repeated getImageData reads
        analysisContext = analysisCanvas.getContext("2d", {
          willReadFrequently: true,
        });
      }
    }

    function calculateBrightness(video: HTMLVideoElement): number {
      if (!analysisContext || !analysisCanvas) return 0;

      try {
        // Draw video frame to small canvas for analysis
        analysisContext.drawImage(
          video,
          0,
          0,
          analysisCanvas.width,
          analysisCanvas.height
        );
        const imageData = analysisContext.getImageData(
          0,
          0,
          analysisCanvas.width,
          analysisCanvas.height
        );
        const data = imageData.data;

        let totalBrightness = 0;
        let pixelCount = 0;

        // Sample every 4th pixel for performance
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Calculate luminance using standard formula
          const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
          totalBrightness += brightness;
          pixelCount++;
        }

        return pixelCount > 0 ? totalBrightness / pixelCount : 0;
      } catch (error) {
        // Handle CORS issues or other errors silently
        return lastBrightness;
      }
    }

    function applyDimming(video: HTMLVideoElement): void {
      if (currentVideo !== video) {
        // Remove dimming from previous video
        removeDimming();
        currentVideo = video;
      }
    }

    function updateDimLevel(targetDimLevel: number): void {
      if (!currentVideo) return;

      currentDimLevel = targetDimLevel;

      // Apply brightness filter directly to video with smoother gradual dimming
      const brightness = Math.max(0.1, 1 - currentDimLevel * 0.9); // Allow darker dimming, min 10% brightness
      const filters = `brightness(${brightness})`;

      currentVideo.style.filter = filters;
      // Use longer transition for smoother gradual changes
      currentVideo.style.transition = "filter 0.3s ease-out";
    }

    function removeDimming(): void {
      if (currentVideo) {
        currentVideo.style.filter = "";
        currentVideo.style.transition = "";
      }
      currentVideo = null;
      currentDimLevel = 0;
    }

    function monitorVideos(): void {
      // First check if extension is enabled
      if (!isEnabled) {
        // If disabled, make sure to remove any existing dimming
        if (currentDimLevel > 0) {
          updateDimLevel(0);
        }
        return;
      }

      const videos = document.querySelectorAll(
        "video"
      ) as NodeListOf<HTMLVideoElement>;

      if (videos.length === 0) return;

      videos.forEach((video) => {
        if (video.readyState >= 2 && !video.paused && video.currentTime > 0) {
          // Ensure we're tracking this video
          applyDimming(video);

          const brightness = calculateBrightness(video);

          if (brightness > 0) {
            lastBrightness = brightness;

            // Calculate gradual dimming based on brightness
            let targetDimLevel = 0;
            
            // Start dimming at a lower threshold for gradual effect
            const gradualStartThreshold = Math.max(0.3, brightnessThreshold - 0.3);
            
            if (brightness > gradualStartThreshold) {
              // Calculate dimming intensity based on how bright the scene is
              const brightnessRange = 1.0 - gradualStartThreshold;
              const brightnessFactor = Math.min(1.0, (brightness - gradualStartThreshold) / brightnessRange);
              
              // Apply gradual dimming that increases with brightness
              if (brightness > brightnessThreshold) {
                // Above user threshold: apply full user-defined dimming (bright/white scenes)
                targetDimLevel = dimLevel;
              } else {
                // Below user threshold but above gradual start: apply much lighter dimming for normal scenes
                // Use brightness level to determine dimming intensity - higher brightness = more dimming
                const normalSceneDimming = brightness > 0.7 ? 0.3 : 0.15; // Very light dimming for non-white backgrounds
                targetDimLevel = dimLevel * brightnessFactor * normalSceneDimming;
              }
            }

            // Smooth transition to target dim level
            const dimDifference = Math.abs(targetDimLevel - currentDimLevel);
            if (dimDifference > 0.05) {
              // Only update if the change is significant enough
              updateDimLevel(targetDimLevel);
            }
          }
        }
      });
    }

    function startMonitoring(): void {
      if (monitoringInterval) return;

      createAnalysisCanvas();

      // Monitor at 30 FPS for smooth response - always monitor so we can remove dimming when disabled
      monitoringInterval = window.setInterval(monitorVideos, 33);
    }

    function stopMonitoring(): void {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
      }
    }

    // Initialize when page loads
    function init() {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initializeYtDimmer);
      } else {
        initializeYtDimmer();
      }

      // Also try after a short delay to catch dynamically loaded videos
      setTimeout(initializeYtDimmer, 1000);
      setTimeout(initializeYtDimmer, 3000);
    }

    init();

    // Handle dynamic video loading (SPA navigation)
    const observer = new MutationObserver(() => {
      if (isEnabled && document.querySelectorAll("video").length > 0) {
        if (!monitoringInterval) {
          startMonitoring();
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup on page unload
    window.addEventListener("beforeunload", () => {
      stopMonitoring();
      removeDimming();
      observer.disconnect();
    });
  },
});
