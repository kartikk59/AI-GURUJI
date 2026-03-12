/**
 * gestureWorker.js
 * Runs in a Web Worker. Receives video frames as ImageBitmap,
 * processes hand landmarks via MediaPipe Hands (loaded via CDN),
 * and posts gesture state events back to the main thread.
 *
 * FSM States: RELEASE → GRAB → DRAG → RELEASE
 */

let hands = null;
let currentState = "RELEASE";
let lastCentroid = { x: 0, y: 0 };
let pendingState = null;
let pendingTimer = null;
const DEBOUNCE_MS = 140;

// ── Helpers ──────────────────────────────────────────────────────────────────

function euclidean(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function calculateCentroid(lm) {
    // Midpoint of Wrist (0) and Middle-finger MCP (9)
    return {
        x: (lm[0].x + lm[9].x) / 2,
        y: (lm[0].y + lm[9].y) / 2,
    };
}

function classifyGesture(lm) {
    const fingerTips = [8, 12, 16, 20];
    const handScale = euclidean(lm[0], lm[9]) || 0.001;
    const avgTipDist =
        fingerTips.reduce((s, t) => s + euclidean(lm[t], lm[0]), 0) /
        fingerTips.length;
    // Ratio < 0.9 → fingers curled → FIST
    return avgTipDist / handScale < 0.9 ? "FIST" : "OPEN";
}

function tryTransition(newState, centroid) {
    if (newState === currentState) {
        // Stay in same state, keep posting DRAG updates immediately
        if (currentState === "DRAG") {
            self.postMessage({ state: "DRAG", centroid });
        }
        return;
    }
    clearTimeout(pendingTimer);
    pendingState = newState;
    pendingTimer = setTimeout(() => {
        if (pendingState === newState) {
            currentState = newState;
            self.postMessage({ state: newState, centroid });
        }
    }, DEBOUNCE_MS);
}

// ── FSM ───────────────────────────────────────────────────────────────────────

function runFSM(gesture, centroid) {
    switch (currentState) {
        case "RELEASE":
            if (gesture === "FIST") tryTransition("GRAB", centroid);
            break;
        case "GRAB": {
            if (gesture === "OPEN") {
                tryTransition("RELEASE", centroid);
            } else {
                const moved =
                    Math.abs(centroid.x - lastCentroid.x) > 0.01 ||
                    Math.abs(centroid.y - lastCentroid.y) > 0.01;
                if (moved) tryTransition("DRAG", centroid);
            }
            break;
        }
        case "DRAG":
            if (gesture === "OPEN") {
                tryTransition("RELEASE", centroid);
            } else {
                // Continuously emit DRAG with updated centroid
                self.postMessage({ state: "DRAG", centroid });
            }
            break;
        default:
            break;
    }
    lastCentroid = centroid;
}

// ── MediaPipe Setup ──────────────────────────────────────────────────────────

async function initMediaPipe() {
    // Import MediaPipe from CDN inside worker context
    importScripts(
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js",
        "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
    );

    hands = new Hands({
        locateFile: (file) =>
            `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 0,       // 0 = lite (fast), 1 = full
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.6,
    });

    hands.onResults((results) => {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            // No hand → force RELEASE
            if (currentState !== "RELEASE") {
                clearTimeout(pendingTimer);
                currentState = "RELEASE";
                self.postMessage({ state: "RELEASE", centroid: lastCentroid });
            }
            return;
        }
        const lm = results.multiHandLandmarks[0];
        const gesture = classifyGesture(lm);
        const centroid = calculateCentroid(lm);
        runFSM(gesture, centroid);
    });
}

// ── Message Handler ──────────────────────────────────────────────────────────

self.onmessage = async (event) => {
    const { type, frame } = event.data;

    if (type === "INIT") {
        await initMediaPipe();
        self.postMessage({ state: "WORKER_READY" });
        return;
    }

    if (type === "FRAME" && hands) {
        // frame is an ImageBitmap transferred from main thread (zero-copy)
        await hands.send({ image: frame });
        frame.close(); // Free memory immediately
    }
};
