import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Volume1,
  Shuffle,
  Repeat,
  Repeat1,
  ChevronDown,
  ChevronUp,
  Upload,
  ListMusic,
  X,
  Asterisk,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { extractAudioMetadata, detectFormatFromNameOrType, createFallbackCover } from "../utils/audioMetadata";
import { sfx } from "../utils/sfx";
import { getLenis } from "./SmoothScroll";
import folderTracks from "virtual:soundtracks";

const EMPTY_TRACK = {
  id: "empty",
  title: "No Tracks Found",
  artist: "Place audio files into public/music/",
  album: "MUSIC LIBRARY",
  date: "2026",
  audioSrc: "",
  fallbackCover: createFallbackCover("No Tracks", "Folder Empty", "AUDIO"),
  coverUrl: createFallbackCover("No Tracks", "Folder Empty", "AUDIO"),
  accent: "lime",
  format: "AUDIO",
};

function normalizeFolderTrack(t, idx) {
  const title = t.title || `Track 0${idx + 1}`;
  const artist = t.artist || "Original Soundtrack";
  const format = t.format || "AUDIO";
  const fallbackCover = t.coverUrl || t.fallbackCover || createFallbackCover(title, artist, format);
  return {
    id: t.id || `track-${idx + 1}`,
    title,
    artist,
    album: t.album || `${title.toUpperCase()} · SOUNDTRACK`,
    date: t.date || "2026",
    audioSrc: t.audioSrc,
    fallbackCover,
    coverUrl: fallbackCover,
    accent: t.accent || "lime",
    format,
  };
}

const DEFAULT_TRACKS = Array.isArray(folderTracks) && folderTracks.length > 0
  ? folderTracks.map(normalizeFolderTrack)
  : [];

const WAVE_BARS = [
  6, 8, 12, 10, 14, 18, 22, 26, 28, 32, 29, 34, 30, 26, 24, 22,
  22, 24, 26, 30, 34, 29, 32, 28, 26, 22, 18, 14, 10, 12, 8, 6,
];

// Precomputed frequency bin ranges for 32 Studio Deck bars (20Hz - 16,000Hz, fftSize = 1024)
// Mapped logarithmically across the 3 core musical bands:
// Bars 0-7: Bass band (20 - 250 Hz)
// Bars 8-23: Midrange band (250 - 4,000 Hz)
// Bars 24-31: Treble band (4,000 - 16,000 Hz)
const STUDIO_BAR_RANGES = [
  // 8 Bass bars (20 - 250 Hz)
  [1, 1], [1, 2], [2, 2], [2, 3], [3, 4], [4, 5], [5, 5], [5, 6],
  // 16 Midrange bars (250 - 4,000 Hz)
  [6, 7], [7, 9], [9, 11], [11, 14], [14, 18], [18, 22], [22, 27], [27, 33],
  [33, 40], [40, 48], [48, 56], [56, 65], [65, 74], [74, 83], [83, 92], [92, 102],
  // 8 Treble bars (4,000 - 16,000 Hz)
  [102, 120], [120, 145], [145, 175], [175, 210], [210, 255], [255, 310], [310, 375], [375, 450],
];

// Precomputed frequency bin ranges for 18 Compact Deck bars (20Hz - 16,000Hz, fftSize = 1024)
const COMPACT_BAR_RANGES = [
  // 4 Bass bars
  [1, 2], [2, 3], [3, 4], [5, 6],
  // 9 Midrange bars
  [7, 9], [9, 13], [13, 18], [18, 26], [26, 36], [36, 49], [49, 65], [65, 83], [83, 102],
  // 5 Treble bars
  [102, 135], [135, 180], [180, 240], [240, 320], [320, 430],
];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

// Find "Velvet Drift.wav" first; fallback to index 0 if not found
function findTargetTrackIndex(list, targetName = "Velvet Drift.wav") {
  if (!Array.isArray(list) || list.length === 0) return 0;
  const foundIdx = list.findIndex((t) => {
    if (!t) return false;
    const fn = (t.fileName || "").toLowerCase();
    const title = (t.title || "").toLowerCase();
    const id = (t.id || "").toLowerCase();
    const src = (t.audioSrc || "").toLowerCase();

    return (
      fn === "velvet drift.wav" ||
      fn.includes("velvet drift") ||
      title === "velvet drift" ||
      id === "velvet-drift" ||
      src.includes("velvet%20drift") ||
      src.includes("velvet drift")
    );
  });

  return foundIdx !== -1 ? foundIdx : 0;
}

export default function MusicPlayer({ isDeckOpen, setIsDeckOpen, onPlayingStateChange }) {
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(() => findTargetTrackIndex(DEFAULT_TRACKS));
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all"); // 'none' | 'all' | 'one'
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isStudioPlaylistOpen, setIsStudioPlaylistOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 990;
    }
    return true;
  });
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const compactFileInputRef = useRef(null);
  const dockRef = useRef(null);
  const isTransitioningRef = useRef(false);
  const currentTrack = tracks[currentIndex] || tracks[0] || EMPTY_TRACK;

  // Web Audio API live reactive music analyser refs
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const freqDataRef = useRef(null);
  const mediaSourceConnectedRef = useRef(false);

  // Visualizer bar element & reactive container refs
  const studioBarsRef = useRef([]);
  const compactBarsRef = useRef([]);
  const miniBarsRef = useRef([]);
  const playlistWaveBarsRef = useRef([]);
  const studioWaveContainerRef = useRef(null);
  const studioVinylDiscRef = useRef(null);
  const compactWaveContainerRef = useRef(null);

  // Exponentially smoothed amplitude levels for organic wave physics
  const studioLevelsRef = useRef(new Float32Array(32));
  const compactLevelsRef = useRef(new Float32Array(18));
  const miniLevelsRef = useRef(new Float32Array(4));
  const playlistLevelsRef = useRef(new Float32Array(3));

  // Adaptive normalization floor & ceiling trackers (prevents saturation during dense music)
  const adaptiveFloorsRef = useRef(new Float32Array(32).fill(15));
  const adaptiveCeilingsRef = useRef(new Float32Array(32).fill(160));
  const compactFloorsRef = useRef(new Float32Array(18).fill(15));
  const compactCeilingsRef = useRef(new Float32Array(18).fill(160));

  // 3-Band frequency energy trackers: Bass (20-250 Hz), Midrange (250-4000 Hz), Treble (4000-20000 Hz)
  const bassFloorRef = useRef(15);
  const bassCeilRef = useRef(160);
  const midFloorRef = useRef(15);
  const midCeilRef = useRef(160);
  const trebleFloorRef = useRef(10);
  const trebleCeilRef = useRef(120);

  const bassLevelRef = useRef(0);
  const midLevelRef = useRef(0);
  const trebleLevelRef = useRef(0);

  const animFrameRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const peakTrackerRef = useRef(180);

  // Tonearm state & drag interaction (Mode 3: Expanded Studio Deck only)
  const [isDraggingTonearm, setIsDraggingTonearm] = useState(false);
  const [tonearmDragAngle, setTonearmDragAngle] = useState(null);
  const tonearmPivotRef = useRef(null);
  const tonearmDragStartRef = useRef({ pivotCenterX: 0, pivotCenterY: 0, startPointerAngle: 0, startArmAngle: 0, moved: false });

  const TONEARM_REST_ANGLE = 0;   // resting off the disc
  const TONEARM_PLAY_ANGLE = 32;  // resting on the revolving vinyl disc

  const currentTonearmAngle = isDraggingTonearm && tonearmDragAngle !== null
    ? tonearmDragAngle
    : isPlaying
      ? TONEARM_PLAY_ANGLE
      : TONEARM_REST_ANGLE;

  const handleTonearmPointerDown = (e) => {
    if (!isFullScreen) return;
    e.preventDefault();
    e.stopPropagation();

    const pivotEl = tonearmPivotRef.current;
    if (!pivotEl) return;

    const pivotRect = pivotEl.getBoundingClientRect();
    const pivotCenterX = pivotRect.left + pivotRect.width / 2;
    const pivotCenterY = pivotRect.top + pivotRect.height / 2;

    const pointerAngle = Math.atan2(e.clientY - pivotCenterY, e.clientX - pivotCenterX) * (180 / Math.PI);

    tonearmDragStartRef.current = {
      pivotCenterX,
      pivotCenterY,
      startPointerAngle: pointerAngle,
      startArmAngle: isPlaying ? TONEARM_PLAY_ANGLE : TONEARM_REST_ANGLE,
      moved: false,
    };

    setIsDraggingTonearm(true);
    setTonearmDragAngle(isPlaying ? TONEARM_PLAY_ANGLE : TONEARM_REST_ANGLE);
  };

  useEffect(() => {
    if (!isDraggingTonearm) return;

    const onPointerMove = (e) => {
      const { pivotCenterX, pivotCenterY, startPointerAngle, startArmAngle } = tonearmDragStartRef.current;
      tonearmDragStartRef.current.moved = true;

      const currentPointerAngle = Math.atan2(e.clientY - pivotCenterY, e.clientX - pivotCenterX) * (180 / Math.PI);
      const angleDelta = currentPointerAngle - startPointerAngle;

      let newAngle = startArmAngle + angleDelta;
      newAngle = Math.max(-10, Math.min(48, newAngle));

      setTonearmDragAngle(newAngle);
    };

    const onPointerUp = () => {
      const { moved } = tonearmDragStartRef.current;
      setIsDraggingTonearm(false);

      if (!moved) {
        togglePlay();
        setTonearmDragAngle(null);
        return;
      }

      const midPoint = (TONEARM_REST_ANGLE + TONEARM_PLAY_ANGLE) / 2;
      const finalAngle = tonearmDragAngle ?? (isPlaying ? TONEARM_PLAY_ANGLE : TONEARM_REST_ANGLE);

      if (finalAngle >= midPoint) {
        if (!isPlaying) {
          sfx.playPop();
          togglePlay();
        }
      } else {
        if (isPlaying) {
          sfx.playSnap();
          togglePlay();
        }
      }

      setTonearmDragAngle(null);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDraggingTonearm, tonearmDragAngle, isPlaying, isFullScreen]);

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    sfx.playSnap();
  };

  // Lock background scroll and pause Lenis so touch scrolling is native and unblocked
  useEffect(() => {
    if (!isFullScreen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const lenis = getLenis();
    if (lenis) {
      lenis.stop();
    }

    return () => {
      document.body.style.overflow = originalOverflow;
      if (lenis) {
        lenis.start();
      }
    };
  }, [isFullScreen]);

  // When expanding to full Studio Deck (Mode 3), open playlist by default on desktop
  useEffect(() => {
    if (isFullScreen && typeof window !== "undefined") {
      setIsStudioPlaylistOpen(window.innerWidth > 990);
    }
  }, [isFullScreen]);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.key === "Escape") {
        if (showPlaylist) {
          setShowPlaylist(false);
          return;
        }
        if (isStudioPlaylistOpen && typeof window !== "undefined" && window.innerWidth <= 900) {
          setIsStudioPlaylistOpen(false);
          return;
        }
        if (isFullScreen) {
          setIsFullScreen(false);
        } else if (isDeckOpen) {
          setIsDeckOpen(false);
        }
      } else if (e.key === " ") {
        if (isFullScreen || isDeckOpen) {
          e.preventDefault();
          togglePlay();
        }
      } else if (e.key === "ArrowRight") {
        if (isFullScreen || isDeckOpen) {
          e.preventDefault();
          handleNext();
        }
      } else if (e.key === "ArrowLeft") {
        if (isFullScreen || isDeckOpen) {
          e.preventDefault();
          handlePrev();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen, isDeckOpen, isPlaying, currentIndex, tracks, isShuffle, showPlaylist, isStudioPlaylistOpen]);

  // Notify parent of playing state (for header widget & command palette)
  useEffect(() => {
    onPlayingStateChange?.({
      isPlaying,
      currentTrack,
      togglePlay,
      openDeck: () => {
        setIsDeckOpen(true);
        setIsFullScreen(false);
      },
      openFullScreen: () => {
        setIsDeckOpen(true);
        setIsFullScreen(true);
      },
    });
  }, [isPlaying, currentIndex, currentTrack]);

  // Initialize Web Audio API Analyser for live frequency reactivity
  const initAudioAnalyser = () => {
    if (mediaSourceConnectedRef.current || !audioRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = audioContextRef.current || new AudioContextClass();
      audioContextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.82;
      analyser.minDecibels = -90;
      analyser.maxDecibels = -5;
      analyserRef.current = analyser;

      const gain = ctx.createGain();
      gain.gain.value = isMuted ? 0 : volume;
      gainNodeRef.current = gain;

      // Connect: <audio> element -> analyser -> gain -> audioContext.destination
      const source = ctx.createMediaElementSource(audioRef.current);
      sourceNodeRef.current = source;
      source.connect(analyser);
      analyser.connect(gain);
      gain.connect(ctx.destination);

      mediaSourceConnectedRef.current = true;
      if (audioRef.current) {
        audioRef.current.volume = 1;
      }
      freqDataRef.current = new Uint8Array(analyser.frequencyBinCount);

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => { });
      }
    } catch (err) {
      console.warn("Web Audio live analyser setup:", err);
    }
  };

  // High-performance direct DOM visualizer updater driving waves live to audio frequencies & amplitude
  const updateVisualizers = () => {
    const currentlyPlaying = isPlayingRef.current;
    const analyser = analyserRef.current;
    const data = freqDataRef.current;

    if (analyser && data) {
      analyser.getByteFrequencyData(data);
    }

    // 1. Live 3-Band Frequency Analysis:
    // Bass: 20–250 Hz (bins 1..5 at fftSize 1024)
    // Midrange: 250–4,000 Hz (bins 6..85)
    // Treble: 4,000–20,000 Hz (bins 86..400)
    let rawBassSum = 0, rawBassPeak = 0;
    if (data && currentlyPlaying) {
      for (let b = 1; b <= 5; b++) {
        const v = data[b] || 0;
        if (v > rawBassPeak) rawBassPeak = v;
        rawBassSum += v;
      }
    }
    const rawBass = rawBassPeak * 0.55 + (rawBassSum / 5) * 0.45;

    let rawMidSum = 0, rawMidPeak = 0, midCount = 0;
    if (data && currentlyPlaying) {
      for (let b = 6; b <= 85; b += 2) {
        const v = data[b] || 0;
        if (v > rawMidPeak) rawMidPeak = v;
        rawMidSum += v;
        midCount++;
      }
    }
    const rawMid = midCount > 0 ? rawMidPeak * 0.55 + (rawMidSum / midCount) * 0.45 : 0;

    let rawTrebleSum = 0, rawTreblePeak = 0, trebleCount = 0;
    if (data && currentlyPlaying) {
      for (let b = 86; b <= 400; b += 4) {
        const v = data[b] || 0;
        if (v > rawTreblePeak) rawTreblePeak = v;
        rawTrebleSum += v;
        trebleCount++;
      }
    }
    const rawTreble = trebleCount > 0 ? rawTreblePeak * 0.55 + (rawTrebleSum / trebleCount) * 0.45 : 0;

    // 2. Dynamic Normalization for 3 core musical bands:
    // Stable Automatic Gain Control (AGC) - envelopes move smoothly over ~2 seconds
    // Completely eliminates gain-pumping and flickering
    if (rawBass > bassCeilRef.current) {
      bassCeilRef.current = bassCeilRef.current * 0.98 + rawBass * 0.02;
    } else {
      bassCeilRef.current = Math.max(50, bassCeilRef.current * 0.998);
    }
    bassFloorRef.current = bassFloorRef.current * 0.998 + rawBass * 0.002;
    const bassHeadroom = Math.max(30, bassCeilRef.current - bassFloorRef.current);
    const normBass = currentlyPlaying ? Math.max(0, Math.min(1.0, (rawBass - bassFloorRef.current) / bassHeadroom)) : 0;

    if (rawMid > midCeilRef.current) {
      midCeilRef.current = midCeilRef.current * 0.98 + rawMid * 0.02;
    } else {
      midCeilRef.current = Math.max(45, midCeilRef.current * 0.998);
    }
    midFloorRef.current = midFloorRef.current * 0.998 + rawMid * 0.002;
    const midHeadroom = Math.max(26, midCeilRef.current - midFloorRef.current);
    const normMid = currentlyPlaying ? Math.max(0, Math.min(1.0, (rawMid - midFloorRef.current) / midHeadroom)) : 0;

    if (rawTreble > trebleCeilRef.current) {
      trebleCeilRef.current = trebleCeilRef.current * 0.98 + rawTreble * 0.02;
    } else {
      trebleCeilRef.current = Math.max(35, trebleCeilRef.current * 0.998);
    }
    trebleFloorRef.current = trebleFloorRef.current * 0.998 + rawTreble * 0.002;
    const trebleHeadroom = Math.max(20, trebleCeilRef.current - trebleFloorRef.current);
    const normTreble = currentlyPlaying ? Math.max(0, Math.min(1.0, (rawTreble - trebleFloorRef.current) / trebleHeadroom)) : 0;

    // Smooth temporal smoothing for overall bands (attack 0.35, decay 0.14)
    const smoothBand = (curr, prev, attack = 0.35, decay = 0.14) => {
      return prev + (curr - prev) * (curr > prev ? attack : decay);
    };
    bassLevelRef.current = smoothBand(normBass, bassLevelRef.current, 0.35, 0.14);
    midLevelRef.current = smoothBand(normMid, midLevelRef.current, 0.30, 0.12);
    trebleLevelRef.current = smoothBand(normTreble, trebleLevelRef.current, 0.32, 0.12);

    // 3. Mode 3: Studio Waveform (32 bars - real audio reactivity across frequency & amplitude)
    const studioBars = studioBarsRef.current;
    const studioFloors = adaptiveFloorsRef.current;
    const studioCeils = adaptiveCeilingsRef.current;

    if (studioBars && studioBars.length > 0) {
      for (let i = 0; i < 32; i++) {
        const bar = studioBars[i];
        if (!bar) continue;

        const [startBin, endBin] = STUDIO_BAR_RANGES[i] || [i + 1, i + 1];
        let barPeak = 0;
        let barSum = 0;
        if (data && currentlyPlaying) {
          for (let b = startBin; b <= endBin; b++) {
            const val = data[b] || 0;
            if (val > barPeak) barPeak = val;
            barSum += val;
          }
        }
        const binCount = endBin - startBin + 1;
        const rawBar = binCount > 1 ? barPeak * 0.55 + (barSum / binCount) * 0.45 : barPeak;

        // Stable AGC tracking per bar (slow envelope avoids frame-to-frame pumping)
        if (rawBar > studioCeils[i]) {
          studioCeils[i] = studioCeils[i] * 0.98 + rawBar * 0.02;
        } else {
          studioCeils[i] = Math.max(50, studioCeils[i] * 0.998);
        }
        studioFloors[i] = studioFloors[i] * 0.998 + rawBar * 0.002;

        const barHeadroom = Math.max(35, studioCeils[i] - studioFloors[i]);
        let barNorm = currentlyPlaying
          ? Math.max(0, Math.min(1.0, (rawBar - studioFloors[i]) / barHeadroom))
          : 0;

        // Acoustic equal-loudness tilt across musical registers
        const acousticWeight = 1.0 + Math.pow(i / 31, 0.6) * 0.45;
        barNorm = Math.min(1.0, barNorm * acousticWeight);

        // Perceptual gamma curve
        const perceptualVal = Math.pow(barNorm, 1.25);

        // Silky smooth temporal interpolation:
        // Attack (0.32) responds punchily to musical transients, decay (0.12) glides smoothly down
        const prev = studioLevelsRef.current[i] || 0;
        const smoothed = prev + (perceptualVal - prev) * (perceptualVal > prev ? 0.32 : 0.12);
        studioLevelsRef.current[i] = smoothed;

        // Dynamic scaling without artificial clamping
        const minScale = 0.22;
        const scale = currentlyPlaying
          ? minScale + smoothed * 1.85
          : minScale;
        bar.style.transform = `scaleY(${scale.toFixed(3)})`;
        bar.style.opacity = currentlyPlaying ? "1" : "0.5";
      }
    }

    // 4. Mode 2: Compact Deck Bars (18 bars - small & contained height, dynamic live response)
    const compactBars = compactBarsRef.current;
    const cFloors = compactFloorsRef.current;
    const cCeils = compactCeilingsRef.current;

    if (compactBars && compactBars.length > 0) {
      for (let i = 0; i < 18; i++) {
        const bar = compactBars[i];
        if (!bar) continue;

        const [startBin, endBin] = COMPACT_BAR_RANGES[i] || [i + 1, i + 1];
        let barPeak = 0;
        let barSum = 0;
        if (data && currentlyPlaying) {
          for (let b = startBin; b <= endBin; b++) {
            const val = data[b] || 0;
            if (val > barPeak) barPeak = val;
            barSum += val;
          }
        }
        const binCount = endBin - startBin + 1;
        const rawBar = binCount > 1 ? barPeak * 0.55 + (barSum / binCount) * 0.45 : barPeak;

        if (rawBar > cCeils[i]) {
          cCeils[i] = cCeils[i] * 0.98 + rawBar * 0.02;
        } else {
          cCeils[i] = Math.max(50, cCeils[i] * 0.998);
        }
        cFloors[i] = cFloors[i] * 0.998 + rawBar * 0.002;

        const barHeadroom = Math.max(35, cCeils[i] - cFloors[i]);
        let barNorm = currentlyPlaying
          ? Math.max(0, Math.min(1.0, (rawBar - cFloors[i]) / barHeadroom))
          : 0;

        const acousticWeight = 1.0 + Math.pow(i / 17, 0.6) * 0.40;
        barNorm = Math.min(1.0, barNorm * acousticWeight);

        const perceptualVal = Math.pow(barNorm, 1.25);

        const prev = compactLevelsRef.current[i] || 0;
        const smoothed = prev + (perceptualVal - prev) * (perceptualVal > prev ? 0.32 : 0.12);
        compactLevelsRef.current[i] = smoothed;

        // In compact mode: base height is 8px. Contained within 10px container
        const minScale = 0.22;
        const scale = currentlyPlaying ? minScale + smoothed * 0.48 : minScale;
        bar.style.transform = `scaleY(${scale.toFixed(3)})`;
      }
    }

    // 5. Multiple Reactive Properties:
    // Studio Wave Container width breathing (Bass)
    const studioWaveContainer = studioWaveContainerRef.current;
    if (studioWaveContainer) {
      if (currentlyPlaying) {
        const widthScale = (1.0 + bassLevelRef.current * 0.03).toFixed(3);
        studioWaveContainer.style.transform = `scaleX(${widthScale})`;
      } else {
        studioWaveContainer.style.transform = "none";
      }
    }

    // Studio Vinyl Disc Resonance (Sub-bass physical resonance pulse)
    const vinylDisc = studioVinylDiscRef.current;
    if (vinylDisc) {
      if (currentlyPlaying) {
        const vinylScale = (1.0 + bassLevelRef.current * 0.018).toFixed(3);
        vinylDisc.style.transform = `scale(${vinylScale})`;
      } else {
        vinylDisc.style.transform = "none";
      }
    }

    // 6. Mode 1: Mini Equalizer (4 bars)
    const miniBars = miniBarsRef.current;
    if (miniBars && miniBars.length >= 4) {
      const bands = [
        normBass,
        Math.max(normBass * 0.4, normMid * 0.9),
        normMid,
        normTreble,
      ];

      for (let i = 0; i < 4; i++) {
        const bar = miniBars[i];
        if (!bar) continue;
        const target = bands[i];
        const prev = miniLevelsRef.current[i] || 0;
        const smoothed = prev + (target - prev) * (target > prev ? 0.32 : 0.12);
        miniLevelsRef.current[i] = smoothed;

        const h = currentlyPlaying ? Math.max(3, Math.min(16, Math.round(3 + smoothed * 13))) : 3;
        bar.style.height = `${h}px`;
      }
    }

    // 7. Playlist active track wave icon (3 bars)
    const playlistWaveBars = playlistWaveBarsRef.current;
    if (playlistWaveBars && playlistWaveBars.length >= 3) {
      const pwBands = [normBass, normMid, normTreble];

      for (let i = 0; i < 3; i++) {
        const bar = playlistWaveBars[i];
        if (!bar) continue;
        const target = pwBands[i];
        const prev = playlistLevelsRef.current[i] || 0;
        const smoothed = prev + (target - prev) * (target > prev ? 0.32 : 0.12);
        playlistLevelsRef.current[i] = smoothed;

        const h = currentlyPlaying ? Math.max(3, Math.min(14, Math.round(3 + smoothed * 11))) : 4;
        bar.style.height = `${h}px`;
      }
    }

    if (currentlyPlaying) {
      animFrameRef.current = requestAnimationFrame(updateVisualizers);
    } else {
      let stillSettling = false;
      for (let i = 0; i < 32; i++) {
        if ((studioLevelsRef.current[i] || 0) > 0.005) {
          stillSettling = true;
          break;
        }
      }
      if (bassLevelRef.current > 0.005 || trebleLevelRef.current > 0.005) {
        stillSettling = true;
      }
      if (stillSettling) {
        animFrameRef.current = requestAnimationFrame(updateVisualizers);
      } else {
        animFrameRef.current = null;
      }
    }
  };

  // Autoplay the first music track by default when website loads
  useEffect(() => {
    let unmounted = false;
    let cleanupListeners = null;

    const tryStartPlayback = () => {
      const audio = audioRef.current;
      if (!audio) return;

      const targetTrack = tracks[currentIndex] || tracks[0];
      if (targetTrack && targetTrack.audioSrc) {
        if (!audio.src || !audio.src.includes(encodeURI(targetTrack.fileName || ""))) {
          audio.src = targetTrack.audioSrc;
        }
      }

      const triggerPlay = () => {
        initAudioAnalyser();
        if (audioContextRef.current && audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume().catch(() => { });
        }

        const p = audio.play();
        if (p !== undefined) {
          p.then(() => {
            if (!unmounted) {
              setIsPlaying(true);
            }
          }).catch((err) => {
            console.log("Unmuted autoplay restricted by browser policy; awaiting user activation:", err?.name);

            // On the first interaction anywhere on the document (that is not clicking a player button directly),
            // start playback automatically!
            const handleFirstGesture = (e) => {
              if (unmounted) return;
              // If user clicked inside player controls, let the button's own click handler run
              if (e.target && e.target.closest && e.target.closest(".music-dock, .studio-deck-overlay, .deck-play-btn, .studio-play-btn")) {
                removeListeners();
                return;
              }

              initAudioAnalyser();
              if (audioContextRef.current && audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume().catch(() => { });
              }

              const resumePromise = audio.play();
              if (resumePromise !== undefined) {
                resumePromise.then(() => {
                  if (!unmounted) setIsPlaying(true);
                }).catch(() => { });
              }
              removeListeners();
            };

            const removeListeners = () => {
              document.removeEventListener("click", handleFirstGesture, true);
              document.removeEventListener("pointerdown", handleFirstGesture, true);
              document.removeEventListener("touchstart", handleFirstGesture, true);
              document.removeEventListener("keydown", handleFirstGesture, true);
            };

            cleanupListeners = removeListeners;

            document.addEventListener("click", handleFirstGesture, { capture: true, once: true });
            document.addEventListener("pointerdown", handleFirstGesture, { capture: true, once: true });
            document.addEventListener("touchstart", handleFirstGesture, { capture: true, once: true });
            document.addEventListener("keydown", handleFirstGesture, { capture: true, once: true });
          });
        }
      };

      if (audio.readyState >= 2) {
        triggerPlay();
      } else {
        const onCanPlay = () => {
          audio.removeEventListener("canplay", onCanPlay);
          triggerPlay();
        };
        audio.addEventListener("canplay", onCanPlay, { once: true });
        audio.load();
      }
    };

    const timer = setTimeout(tryStartPlayback, 80);

    return () => {
      unmounted = true;
      clearTimeout(timer);
      if (cleanupListeners) cleanupListeners();
    };
  }, []);

  // Start or resume visualizer frame loop whenever isPlaying changes
  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      initAudioAnalyser();
      if (audioContextRef.current && audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume().catch(() => { });
      }
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(updateVisualizers);
      }
    } else {
      if (!animFrameRef.current) {
        animFrameRef.current = requestAnimationFrame(updateVisualizers);
      }
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying]);

  // Update HTML audio volume and Web Audio gain node
  useEffect(() => {
    volumeRef.current = volume;
    isMutedRef.current = isMuted;
    const targetVol = isMuted ? 0 : volume;
    if (mediaSourceConnectedRef.current) {
      if (audioRef.current) {
        audioRef.current.volume = 1;
      }
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.value = targetVol;
      }
    } else {
      if (audioRef.current) {
        audioRef.current.volume = targetVol;
      }
    }
  }, [volume, isMuted]);

  // Read tracks from public/music folder dynamically and extract embedded audio tags & artwork
  useEffect(() => {
    let isMounted = true;

    const syncTracksAndMetadata = async () => {
      let activeList = tracks.length > 0 ? tracks : DEFAULT_TRACKS;

      try {
        const res = await fetch("/music/tracks.json", { cache: "no-store" });
        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json) && json.length > 0) {
            activeList = json.map(normalizeFolderTrack);
            if (isMounted) {
              setTracks(activeList);
              setCurrentIndex(findTargetTrackIndex(activeList));
            }
          }
        }
      } catch (e) {
        // Fallback to bundled virtual:soundtracks
      }

      if (!isMounted) return;

      activeList.forEach(async (track, idx) => {
        if (!track?.audioSrc) return;
        try {
          const meta = await extractAudioMetadata(track.audioSrc, track.fallbackCover);
          if (meta && isMounted) {
            setTracks((prev) =>
              prev.map((t, i) =>
                i === idx
                  ? {
                    ...t,
                    coverUrl: meta.coverUrl || t.coverUrl,
                    title: meta.title?.trim() || t.title,
                    artist: meta.artist?.trim() || t.artist,
                    album: meta.album?.trim() || t.album,
                    date: meta.date?.trim() || t.date,
                    format: meta.format || t.format,
                  }
                  : t
              )
            );
          }
        } catch (err) {
          console.warn("Could not extract embedded metadata for:", track.audioSrc, err);
        }
      });
    };

    syncTracksAndMetadata();

    return () => {
      isMounted = false;
    };
  }, []);

  const playTrackWithList = (index, trackList = tracks, shouldPlay = true) => {
    const nextTrack = trackList[index];
    if (!nextTrack || !nextTrack.audioSrc || !audioRef.current) return;

    initAudioAnalyser();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => { });
    }

    // Reset adaptive normalization dynamic ranges for incoming track
    adaptiveFloorsRef.current.fill(15);
    adaptiveCeilingsRef.current.fill(160);
    compactFloorsRef.current.fill(15);
    compactCeilingsRef.current.fill(160);
    bassFloorRef.current = 15;
    bassCeilRef.current = 160;
    midFloorRef.current = 15;
    midCeilRef.current = 160;
    trebleFloorRef.current = 10;
    trebleCeilRef.current = 120;

    setCurrentIndex(index);
    setCurrentTime(0);

    const audio = audioRef.current;
    isTransitioningRef.current = true;

    audio.pause();
    audio.src = nextTrack.audioSrc;
    audio.currentTime = 0;
    audio.load();

    if (shouldPlay) {
      setIsPlaying(true);
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            isTransitioningRef.current = false;
            setIsPlaying(true);
          })
          .catch((err) => {
            console.log("Audio buffering for immediate playback:", err?.name);
            const onCanPlay = () => {
              audio.removeEventListener("canplay", onCanPlay);
              audio
                .play()
                .then(() => {
                  isTransitioningRef.current = false;
                  setIsPlaying(true);
                })
                .catch((e) => {
                  console.warn("Playback error on canplay:", e);
                  isTransitioningRef.current = false;
                });
            };
            audio.addEventListener("canplay", onCanPlay, { once: true });
          });
      } else {
        isTransitioningRef.current = false;
      }
    } else {
      setIsPlaying(false);
      isTransitioningRef.current = false;
    }
  };

  const playTrack = (index, shouldPlay = true) => {
    sfx.playSnap();
    playTrackWithList(index, tracks, shouldPlay);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack || !currentTrack.audioSrc) return;

    sfx.playSnap();
    initAudioAnalyser();
    if (audioContextRef.current && audioContextRef.current.state === "suspended") {
      audioContextRef.current.resume().catch(() => { });
    }

    if (!audio.src && currentTrack) {
      audio.src = currentTrack.audioSrc;
      audio.load();
    }

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    if (tracks.length === 0) return;
    sfx.playSnap();
    let nextIdx = (currentIndex + 1) % tracks.length;
    if (isShuffle && tracks.length > 1) {
      let randIdx = Math.floor(Math.random() * tracks.length);
      while (randIdx === currentIndex) {
        randIdx = Math.floor(Math.random() * tracks.length);
      }
      nextIdx = randIdx;
    }
    playTrackWithList(nextIdx, tracks, true);
  };

  const handlePrev = () => {
    sfx.playSnap();
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      return;
    }
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrackWithList(prevIdx, tracks, true);
  };

  const handleTimeUpdate = () => {
    if (!isDraggingSeek && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.warn);
      }
    } else if (repeatMode === "all" || isShuffle) {
      handleNext();
    } else {
      setIsPlaying(false);
    }
  };

  const handleSeekChange = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
  };

  const handleSeekCommit = (e) => {
    const val = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
    setIsDraggingSeek(false);
  };

  const handleScrubberClick = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (clickX / rect.width) * duration;
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
    sfx.playSnap();
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    sfx.playSnap();
  };

  const toggleRepeat = () => {
    sfx.playSnap();
    if (repeatMode === "none") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("none");
  };

  // Upload custom audio files (.mp3, .wav, .flac, .ogg, .m4a, etc.)
  const handleFileUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const files = Array.from(fileList);
      const newTracks = [];

      for (const file of files) {
        const audioUrl = URL.createObjectURL(file);
        const cleanFileName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
        const meta = await extractAudioMetadata(file, "");

        const songFormat = meta.format || detectFormatFromNameOrType(file.name, file.type);
        const songTitle = meta.title?.trim() || cleanFileName;
        const songArtist = meta.artist?.trim() || "Uploaded Artist";
        const songAlbum = meta.album?.trim() || "Local Sound Library";
        const songCover = meta.coverUrl || createFallbackCover(songTitle, songArtist);

        newTracks.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          title: songTitle,
          artist: songArtist,
          album: songAlbum,
          date: meta.date || new Date().getFullYear().toString(),
          audioSrc: audioUrl,
          coverUrl: songCover,
          fallbackCover: songCover,
          accent: "lime",
          format: songFormat,
        });
      }

      const updated = [...tracks, ...newTracks];
      setTracks(updated);
      sfx.playChime();
      playTrackWithList(tracks.length, updated, true);
    } catch (err) {
      console.error("Failed to parse custom audio files:", err);
    }

    if (e.target) e.target.value = "";
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        src={currentTrack.audioSrc}
        preload="auto"
        autoPlay
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          initAudioAnalyser();
          if (audioContextRef.current && audioContextRef.current.state === "suspended") {
            audioContextRef.current.resume().catch(() => { });
          }
        }}
        onPause={() => {
          if (!isTransitioningRef.current) {
            setIsPlaying(false);
          }
        }}
      />

      {/* =========================================================================
          MODE 1 & MODE 2: DOCKED MUSIC PLAYER (Bottom Corner)
          - Mode 1: Collapsed mini-pill (when !isDeckOpen)
          - Mode 2: Compact floating deck-card modal (when isDeckOpen && !isFullScreen)
          ========================================================================= */}
      {!isFullScreen && (
        <aside
          ref={dockRef}
          className={`music-dock ${isDeckOpen ? "dock-expanded" : "dock-collapsed"}`}
          aria-label="Portfolio Soundtrack Player"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* -------------------------------------------------------------------
              MODE 1: COLLAPSED MINI-PILL
              ------------------------------------------------------------------- */}
          {!isDeckOpen ? (
            <div
              className="mini-pill"
              onClick={() => {
                sfx.playPop();
                setIsDeckOpen(true);
              }}
              role="button"
              tabIndex={0}
              aria-label="Open Studio Music Player"
            >
              {/* Spinning mini vinyl thumbnail with cover art */}
              <div className={`mini-disc-wrap ${isPlaying ? "spinning" : ""}`}>
                <div className="mini-disc-grooves">
                  <img
                    src={currentTrack.coverUrl}
                    alt={currentTrack.title}
                    draggable={false}
                    className="mini-disc-art"
                  />
                  <div className="mini-disc-center" />
                </div>
              </div>

              {/* Track Info & Visualizer */}
              <div className="mini-info">
                <div className="mini-title-row">
                  <span className="mini-live-badge">
                    {isPlaying ? "PLAYING" : "SOUNDTRACK"}
                  </span>
                  <span className="mini-count">
                    0{currentIndex + 1} / 0{tracks.length}
                  </span>
                </div>
                <div className="mini-track-text">
                  <strong className="mini-track-title">{currentTrack.title}</strong>
                  <span className="mini-track-sep">·</span>
                  <span className="mini-track-artist">{currentTrack.artist}</span>
                </div>
              </div>

              {/* EQ Animated Bars - Web Audio reactive */}
              <div className={`mini-eq ${isPlaying ? "eq-active" : ""}`} aria-hidden="true">
                <span ref={(el) => (miniBarsRef.current[0] = el)} className="eq-bar b1" />
                <span ref={(el) => (miniBarsRef.current[1] = el)} className="eq-bar b2" />
                <span ref={(el) => (miniBarsRef.current[2] = el)} className="eq-bar b3" />
                <span ref={(el) => (miniBarsRef.current[3] = el)} className="eq-bar b4" />
              </div>

              {/* Quick Play/Pause button */}
              <button
                type="button"
                className="mini-play-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                aria-label={isPlaying ? "Pause music" : "Play music"}
              >
                {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              </button>

              {/* Expand Deck Button (Opens Compact Deck Mode 2) */}
              <button
                type="button"
                className="mini-expand-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.playPop();
                  setIsDeckOpen(true);
                }}
                aria-label="Expand studio deck"
              >
                <ChevronUp size={16} />
              </button>
            </div>
          ) : (
            /* -------------------------------------------------------------------
               MODE 2: COMPACT FLOATING DECK CARD MODAL (The exact previous modal)
               ------------------------------------------------------------------- */
            <div className="deck-card" data-lenis-prevent="true">
              {/* Top Header Bar */}
              <div className="deck-header">
                <div className="deck-eyebrow">
                  <Asterisk size={14} /> NOW PLAYING · 0{currentIndex + 1} / 0{tracks.length}
                </div>
                <div className="deck-actions">
                  <span className="deck-pill-tag">
                    {currentTrack.format || "FLAC 24-BIT"}
                  </span>

                  {/* Expand button to transition to Mode 3 (Fullscreen Studio Deck) */}
                  <button
                    type="button"
                    className="deck-expand-btn"
                    onClick={() => {
                      sfx.playPop();
                      setIsFullScreen(true);
                    }}
                    title="Expand to Full Studio Deck"
                    aria-label="Expand to full studio deck"
                  >
                    <Maximize2 size={12} />
                    <span className="deck-expand-text">Expand</span>
                  </button>

                  {/* Collapse button to transition down to Mode 1 (Mini-Pill) */}
                  <button
                    type="button"
                    className="deck-close-btn"
                    onClick={() => {
                      sfx.playSnap();
                      setIsDeckOpen(false);
                    }}
                    title="Collapse to mini pill"
                    aria-label="Collapse music player"
                  >
                    <ChevronDown size={17} />
                  </button>
                </div>
              </div>

              {/* Center Player Body */}
              <div className="deck-body">
                {/* Left Column: Vinyl & Sleeve Display (Clicking sleeve also expands to Mode 3) */}
                <div
                  className="deck-vinyl-stage"
                  onClick={() => {
                    sfx.playPop();
                    setIsFullScreen(true);
                  }}
                  title="Click to expand to full studio deck"
                  style={{ cursor: "pointer" }}
                >
                  {/* Vinyl Record that slides out and spins */}
                  <div className={`deck-vinyl ${isPlaying ? "spinning" : ""}`}>
                    <div className="deck-vinyl-grooves">
                      <div className="deck-vinyl-sheen" />
                      <div className="deck-vinyl-label">
                        <img
                          src={currentTrack.coverUrl}
                          alt={currentTrack.title}
                          draggable={false}
                          className="deck-vinyl-img"
                        />
                        <div className="deck-vinyl-hub" />
                      </div>
                    </div>
                  </div>

                  {/* Album Cover Sleeve (Direct from FLAC) */}
                  <div className="deck-sleeve">
                    <img
                      src={currentTrack.coverUrl}
                      alt={currentTrack.title}
                      draggable={false}
                      className="deck-sleeve-img"
                    />
                  </div>
                </div>

                {/* Right Column: Track Metadata & Audio Controls */}
                <div className="deck-meta">
                  <div className="deck-meta-top">
                    <span className="deck-album-title">{currentTrack.album}</span>
                    <span className="deck-release-year">{currentTrack.date}</span>
                  </div>
                  <h3 className="deck-song-name">{currentTrack.title}</h3>
                  <h4 className="deck-artist-name">{currentTrack.artist}</h4>

                  {/* Visualizer graphic bars - Web Audio reactive */}
                  <div ref={compactWaveContainerRef} className="deck-waveform" aria-hidden="true">
                    <div className={`deck-eq-bars ${isPlaying ? "active" : ""}`}>
                      {[...Array(18)].map((_, i) => (
                        <span
                          key={i}
                          ref={(el) => (compactBarsRef.current[i] = el)}
                          className="deck-eq-bar"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="deck-timeline">
                    <input
                      type="range"
                      min={0}
                      max={duration || 100}
                      value={currentTime}
                      onChange={handleSeekChange}
                      onMouseDown={() => setIsDraggingSeek(true)}
                      onTouchStart={() => setIsDraggingSeek(true)}
                      onMouseUp={handleSeekCommit}
                      onTouchEnd={handleSeekCommit}
                      className="deck-slider"
                      aria-label="Track progress scrubber"
                    />
                    <div className="deck-timestamps">
                      <span>{formatTime(currentTime)}</span>
                      <span className="deck-time-dur">{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Transport Controls */}
                  <div className="deck-controls">
                    <button
                      type="button"
                      className={`deck-sub-btn ${isShuffle ? "active" : ""}`}
                      onClick={toggleShuffle}
                      title={isShuffle ? "Shuffle On" : "Shuffle Off"}
                      aria-label="Toggle shuffle"
                    >
                      <Shuffle size={16} />
                    </button>

                    <button
                      type="button"
                      className="deck-ctrl-btn"
                      onClick={handlePrev}
                      aria-label="Previous track"
                    >
                      <SkipBack size={18} />
                    </button>

                    <button
                      type="button"
                      className="deck-play-btn"
                      onClick={togglePlay}
                      aria-label={isPlaying ? "Pause track" : "Play track"}
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} style={{ marginLeft: 3 }} />}
                    </button>

                    <button
                      type="button"
                      className="deck-ctrl-btn"
                      onClick={handleNext}
                      aria-label="Next track"
                    >
                      <SkipForward size={18} />
                    </button>

                    <button
                      type="button"
                      className={`deck-sub-btn ${repeatMode !== "none" ? "active" : ""}`}
                      onClick={toggleRepeat}
                      title={`Repeat: ${repeatMode}`}
                      aria-label={`Toggle repeat: currently ${repeatMode}`}
                    >
                      {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Tools: Volume & Playlist Drawer Toggle (Full Width) */}
              <div className="deck-foot">
                <div className="deck-volume-wrap">
                  <button
                    type="button"
                    className="deck-vol-btn"
                    onClick={toggleMute}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={16} />
                    ) : volume < 0.5 ? (
                      <Volume1 size={16} />
                    ) : (
                      <Volume2 size={16} />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={isMuted ? 0 : volume}
                    onChange={(e) => {
                      setVolume(parseFloat(e.target.value));
                      if (isMuted) setIsMuted(false);
                    }}
                    className="deck-vol-slider"
                    aria-label="Volume slider"
                  />
                </div>

                <div className="deck-meta-btns">
                  <button
                    type="button"
                    className={`deck-playlist-toggle ${showPlaylist ? "active" : ""}`}
                    onClick={() => {
                      sfx.playSnap();
                      setShowPlaylist((prev) => !prev);
                    }}
                    aria-label="Toggle playlist modal"
                  >
                    <ListMusic size={15} /> Playlist ({tracks.length})
                  </button>

                  <button
                    type="button"
                    className="deck-upload-btn"
                    onClick={() => compactFileInputRef.current?.click()}
                    title="Load your own audio file (.flac / .mp3 / .wav)"
                    aria-label="Upload custom music file"
                  >
                    <Upload size={14} /> Add Song
                  </button>
                  <input
                    ref={compactFileInputRef}
                    type="file"
                    multiple
                    accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.opus,.webm,.wma"
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                  />
                </div>
              </div>

              {/* PLAYLIST BOTTOM MODAL (Slides up from the bottom with animation without expanding card height) */}
              <div
                className={`deck-playlist-modal ${showPlaylist ? "open" : ""}`}
                aria-hidden={!showPlaylist}
              >
                <div className="deck-playlist-modal-header">
                  <div className="deck-playlist-modal-title">
                    <ListMusic size={14} />
                    <span>PLAYLIST ({tracks.length})</span>
                  </div>
                  <div className="deck-playlist-modal-actions">
                    <button
                      type="button"
                      className="deck-playlist-modal-upload"
                      onClick={() => compactFileInputRef.current?.click()}
                      title="Add custom audio file"
                      aria-label="Upload custom music file"
                    >
                      <Upload size={12} />
                      <span>Add Song</span>
                    </button>
                    <button
                      type="button"
                      className="deck-playlist-modal-close"
                      onClick={() => {
                        sfx.playSnap();
                        setShowPlaylist(false);
                      }}
                      title="Close playlist"
                      aria-label="Close playlist"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                <div className="deck-playlist-modal-items">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      className={`playlist-item ${idx === currentIndex ? "active" : ""}`}
                      onClick={() => playTrack(idx, true)}
                      role="button"
                      tabIndex={showPlaylist ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          playTrack(idx, true);
                        }
                      }}
                    >
                      <span className="playlist-num">0{idx + 1}</span>
                      <img
                        src={t.coverUrl}
                        alt={t.title}
                        draggable={false}
                        className="playlist-thumb"
                      />
                      <div className="playlist-info">
                        <strong>{t.title}</strong>
                        <span>{t.artist}</span>
                      </div>
                      {t.audioFormat && (
                        <span className="playlist-format-pill">{t.audioFormat}</span>
                      )}
                      {idx === currentIndex && isPlaying && (
                        <span className="playlist-active-badge">
                          <Asterisk size={12} className="spin-slow" /> PLAYING
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="deck-playlist-modal-footer">
                  <span className="deck-playlist-modal-status">
                    0{currentIndex + 1} / 0{tracks.length} · {tracks[currentIndex]?.title}
                  </span>
                  <button
                    type="button"
                    className="deck-playlist-modal-back"
                    onClick={() => {
                      sfx.playSnap();
                      setShowPlaylist(false);
                    }}
                    title="Close playlist and return to player"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* =========================================================================
          MODE 3: FULL EXPANDED STUDIO DECK (Exact neo-brutalist UI from reference image)
          (Rendered when isFullScreen is true)
          ========================================================================= */}
      {isFullScreen && (
        <div
          className="studio-deck-backdrop"
          onClick={() => {
            sfx.playSnap();
            setIsFullScreen(false);
          }}
          data-lenis-prevent="true"
          role="dialog"
          aria-modal="true"
          aria-label="Now Playing - Studio Deck"
        >
          <div
            className="studio-deck-card"
            onClick={(e) => e.stopPropagation()}
            data-lenis-prevent="true"
          >
            {/* Decorative background crosshairs */}
            <span className="studio-crosshair ch-top-left" aria-hidden="true">+</span>
            <span className="studio-crosshair ch-mid-left" aria-hidden="true">+</span>
            <span className="studio-crosshair ch-bot-left" aria-hidden="true">+</span>
            <span className="studio-crosshair ch-top-mid" aria-hidden="true">+</span>
            <span className="studio-crosshair ch-bot-mid" aria-hidden="true">+</span>
            <span className="studio-crosshair ch-bot-right" aria-hidden="true">+</span>

            {/* Top Navigation Bar */}
            <header className="studio-top-bar">
              <div className="studio-top-logo">
                <span className="logo-star">✱</span>
                <span>ramanbhardwaj.</span>
              </div>

              <div className="studio-top-right">
                <div className="studio-top-title-badge">
                  <span className="deck-star">✱</span>
                  <span>
                    NOW PLAYING · 0{currentIndex + 1} / 0{tracks.length}
                  </span>
                </div>

                <div className="studio-top-actions">
                  {/* Minimize button: minimizes back to Mode 2 compact deck */}
                  <button
                    type="button"
                    className="studio-minimize-circle-btn"
                    onClick={() => {
                      sfx.playSnap();
                      setIsFullScreen(false);
                    }}
                    title="Minimize to compact deck"
                    aria-label="Minimize to compact deck"
                  >
                    <Minimize2 size={16} />
                  </button>

                  {/* Close button: closes deck */}
                  <button
                    type="button"
                    className="studio-close-circle-btn"
                    onClick={() => {
                      sfx.playSnap();
                      setIsFullScreen(false);
                      setIsDeckOpen(false);
                    }}
                    title="Close Studio Deck (Esc)"
                    aria-label="Close Studio Deck"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </header>

            {/* Main Stage Body: Left/Center Stage + Right Playlist Sidebar */}
            <div className="studio-stage-body">
              {/* Left & Center Main Area */}
              <div className="studio-stage-left-center" data-lenis-prevent="true">
                {/* Upper Hero Row: Vinyl + Track Info */}
                <div className="studio-hero-row">
                  {/* Vinyl Assembly + Track Details Group */}
                  <div className="studio-hero-track-group">
                    {/* Vinyl Sleeve & Sliding Record */}
                    <div className="studio-vinyl-assembly">
                      <div className="studio-sleeve">
                        <img
                          src={currentTrack.coverUrl}
                          alt={currentTrack.title}
                          draggable={false}
                          className="studio-sleeve-img"
                        />
                      </div>

                      <div ref={studioVinylDiscRef} className={`studio-vinyl-disc ${isPlaying ? "spinning" : ""}`}>
                        <div className="studio-vinyl-grooves">
                          <div className="studio-vinyl-sheen" />
                          <div className="studio-vinyl-label">
                            <img
                              src={currentTrack.coverUrl}
                              alt={currentTrack.title}
                              draggable={false}
                              className="studio-vinyl-img"
                            />
                            <div className="studio-vinyl-hub" />
                          </div>
                        </div>
                      </div>

                      {/* TONEARM ASSEMBLY (Only in Mode 3 Expanded Studio Deck) */}
                      <div className="studio-tonearm-assembly" data-lenis-prevent="true">
                        {/* Resting post cradle */}
                        <div className="studio-tonearm-cradle">
                          <div className="cradle-post" />
                          <div className="cradle-clip" />
                        </div>

                        {/* Pivot gimbal */}
                        <div ref={tonearmPivotRef} className="studio-tonearm-pivot">
                          <div className="pivot-base-outer" />
                          <div className="pivot-base-ring" />
                          <div className="pivot-gimbal" />
                          <div className="pivot-screw" />
                        </div>

                        {/* Rotating Tonearm Wand + Headshell + Needle Tip */}
                        <div
                          className={`studio-tonearm-wand-wrap ${isPlaying ? "on-disc" : "at-rest"} ${isDraggingTonearm ? "dragging" : ""}`}
                          style={{
                            transform: `rotate(${currentTonearmAngle}deg)`,
                            transition: isDraggingTonearm ? "none" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                          }}
                          onPointerDown={handleTonearmPointerDown}
                          role="button"
                          tabIndex={0}
                          title={isPlaying ? "Tonearm plugged in (Playing) - Drag or click to unplug and pause" : "Tonearm unplugged (Paused) - Drag or click to plug into disc and play"}
                          aria-label={isPlaying ? "Tonearm on vinyl (Playing). Drag or tap to unplug and pause." : "Tonearm off vinyl (Paused). Drag or tap to place on disc and play."}
                        >
                          {/* Counterweight */}
                          <div className="tonearm-counterweight" />

                          {/* Slender Rod / Stick */}
                          <div className="tonearm-rod">
                            <div className="tonearm-rod-highlight" />
                          </div>

                          {/* Headshell / Stylus Cartridge */}
                          <div className="tonearm-headshell">
                            {/* Finger lift hook handle */}
                            <div className="tonearm-finger-lift" />
                            <div className="tonearm-cartridge">
                              <span className="cartridge-badge" />
                            </div>
                            {/* Needle / Stylus tip touching grooves */}
                            <div className="tonearm-needle-tip" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Track Info */}
                    <div className="studio-track-info-col">
                      <span className="studio-album-eyebrow">
                        {currentTrack.album || `${currentTrack.title.toUpperCase()} · 2026`}
                      </span>
                      <h2 className="studio-song-name">{currentTrack.title}</h2>
                      <span className="studio-artist-name">{currentTrack.artist}</span>

                      <div className="studio-tag-pills-row">
                        <span className="studio-format-chip">
                          {currentTrack.format || "FLAC 24-BIT"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coral Soundwave Visualizer - Web Audio reactive */}
                <div
                  ref={studioWaveContainerRef}
                  className={`studio-wave-container ${isPlaying ? "playing" : ""}`}
                  aria-hidden="true"
                >
                  {WAVE_BARS.map((h, i) => (
                    <span
                      key={i}
                      ref={(el) => (studioBarsRef.current[i] = el)}
                      className="studio-wave-bar"
                      style={{
                        "--bar-h": `${h}px`,
                      }}
                    />
                  ))}
                </div>

                {/* Timeline Scrubber */}
                <div className="studio-scrubber-row">
                  <span className="studio-time-text">{formatTime(currentTime)}</span>
                  <div
                    className="studio-timeline-rail"
                    onClick={handleScrubberClick}
                    role="slider"
                    aria-valuenow={currentTime}
                    aria-valuemin={0}
                    aria-valuemax={duration || 1}
                    tabIndex={0}
                  >
                    <div
                      className="studio-timeline-progress"
                      style={{ width: `${progressPct}%` }}
                    />
                    <div
                      className="studio-timeline-thumb"
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                  <span className="studio-time-text">{formatTime(duration)}</span>
                </div>

                {/* Controls Row: Shuffle, Prev, Main Play, Next, Repeat */}
                <div className="studio-controls-center">
                  <button
                    type="button"
                    className={`studio-ctrl-circle ${isShuffle ? "active" : ""}`}
                    onClick={toggleShuffle}
                    title="Shuffle Playback"
                    aria-label="Toggle Shuffle"
                  >
                    <Shuffle size={18} />
                  </button>

                  <button
                    type="button"
                    className="studio-ctrl-step"
                    onClick={handlePrev}
                    title="Previous Track"
                    aria-label="Previous Track"
                  >
                    <SkipBack size={21} />
                  </button>

                  <button
                    type="button"
                    className="studio-main-play-btn"
                    onClick={togglePlay}
                    title={isPlaying ? "Pause" : "Play"}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? (
                      <Pause size={30} fill="var(--ink)" />
                    ) : (
                      <Play size={30} fill="var(--ink)" style={{ marginLeft: 3 }} />
                    )}
                  </button>

                  <button
                    type="button"
                    className="studio-ctrl-step"
                    onClick={handleNext}
                    title="Next Track"
                    aria-label="Next Track"
                  >
                    <SkipForward size={21} />
                  </button>

                  <button
                    type="button"
                    className="studio-ctrl-circle studio-ctrl-repeat"
                    onClick={toggleRepeat}
                    title={`Repeat: ${repeatMode}`}
                    aria-label={`Toggle Repeat Mode: ${repeatMode}`}
                  >
                    {repeatMode === "one" ? <Repeat1 size={18} /> : <Repeat size={18} />}
                  </button>
                </div>

                {/* Bottom Utility Row: Volume & Actions */}
                <div className="studio-bottom-bar">
                  <div className="studio-volume-wrap">
                    <button
                      type="button"
                      className="studio-vol-icon-btn"
                      onClick={toggleMute}
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={18} />
                      ) : volume < 0.5 ? (
                        <Volume1 size={18} />
                      ) : (
                        <Volume2 size={18} />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="studio-vol-input"
                      aria-label="Volume slider"
                    />
                  </div>

                  <div className="studio-action-pills">
                    <button
                      type="button"
                      className={`studio-pill-action ${isStudioPlaylistOpen ? "playlist-active-pill" : ""}`}
                      onClick={() => {
                        sfx.playSnap();
                        setIsStudioPlaylistOpen((prev) => !prev);
                      }}
                      title={isStudioPlaylistOpen ? "Hide playlist" : "Show playlist"}
                      aria-label={isStudioPlaylistOpen ? "Hide playlist" : "Show playlist"}
                    >
                      <ListMusic size={15} />
                      <span>Playlist ({tracks.length})</span>
                    </button>

                    <button
                      type="button"
                      className="studio-pill-action"
                      onClick={() => fileInputRef.current?.click()}
                      title="Upload custom audio file (.flac, .mp3, .wav, etc.)"
                    >
                      <Upload size={14} />
                      <span>Add Song</span>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.opus,.webm,.wma"
                      style={{ display: "none" }}
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Playlist (Desktop side panel / Mobile bottom-sheet modal) */}
              {isStudioPlaylistOpen && (
                <>
                  {/* Mobile backdrop to dim stage and close on tap */}
                  <div
                    className="studio-playlist-mobile-backdrop"
                    onClick={() => {
                      sfx.playSnap();
                      setIsStudioPlaylistOpen(false);
                    }}
                    aria-hidden="true"
                  />

                  <aside className="studio-stage-right-sidebar" data-lenis-prevent="true">
                    {/* Mobile drag handle */}
                    <div
                      className="studio-sheet-drag-handle"
                      onClick={() => {
                        sfx.playSnap();
                        setIsStudioPlaylistOpen(false);
                      }}
                      title="Tap to close"
                      aria-label="Close playlist"
                    />

                    <div className="sidebar-top-section">
                      <div className="sidebar-header-row">
                        <div className="sidebar-header-left">
                          <h3 className="sidebar-heading">Playlist</h3>
                          <span className="sidebar-tracks-badge">
                            {tracks.length < 10 ? `0${tracks.length}` : tracks.length} TRACKS
                          </span>
                        </div>
                        <button
                          type="button"
                          className="sidebar-close-btn"
                          onClick={() => {
                            sfx.playSnap();
                            setIsStudioPlaylistOpen(false);
                          }}
                          title="Close Playlist"
                          aria-label="Close Playlist"
                        >
                          <X size={15} />
                        </button>
                      </div>

                      <div className="sidebar-items-list" data-lenis-prevent="true">
                        {tracks.map((t, idx) => {
                          const isActive = idx === currentIndex;
                          return (
                            <div
                              key={t.id}
                              className={`sidebar-track-item ${isActive ? "active" : ""}`}
                              onClick={() => playTrack(idx, true)}
                              role="button"
                              tabIndex={0}
                            >
                              {isActive ? (
                                <div className="sidebar-item-wave-icon playing" aria-hidden="true">
                                  <span ref={(el) => (playlistWaveBarsRef.current[0] = el)} className="si-bar" />
                                  <span ref={(el) => (playlistWaveBarsRef.current[1] = el)} className="si-bar" />
                                  <span ref={(el) => (playlistWaveBarsRef.current[2] = el)} className="si-bar" />
                                </div>
                              ) : (
                                <span className="sidebar-track-num">
                                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                                </span>
                              )}

                              <img
                                src={t.coverUrl}
                                alt={t.title}
                                draggable={false}
                                className="sidebar-track-thumb-img"
                              />

                              <div className="sidebar-track-text">
                                <strong>
                                  0{idx + 1} {t.title}
                                </strong>
                                <span>{t.artist}</span>
                              </div>

                              {isActive ? (
                                <span className="sidebar-track-status-pill">PLAYING</span>
                              ) : (
                                <button
                                  type="button"
                                  className="sidebar-more-dots"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    playTrack(idx, true);
                                  }}
                                  aria-label="Play track"
                                >
                                  ···
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </aside>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
