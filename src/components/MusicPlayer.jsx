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
  Music,
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

// Default curated tracks with pre-extracted fallback covers from the audio files
const DEFAULT_TRACKS = [
  {
    id: "melomance-love-maybe",
    title: "Love, Maybe",
    artist: "MeloMance",
    album: "LOVE, MAYBE (A BUSINESS PROPOSAL OST SP.. 2022",
    date: "2022",
    audioSrc: "/music/melomance-love-maybe.flac",
    fallbackCover: "/music/covers/melomance-love-maybe.jpg",
    coverUrl: "/music/covers/melomance-love-maybe.jpg",
    accent: "lime",
    format: "FLAC 24-BIT",
  },
  {
    id: "tracy-chapman-fast-car",
    title: "Fast Car (2015 Remaster)",
    artist: "Tracy Chapman",
    album: "TRACY CHAPMAN (ELEKTRA RECORDS) · 1988",
    date: "2015",
    audioSrc: "/music/tracy-chapman-fast-car.flac",
    fallbackCover: "/music/covers/tracy-chapman-fast-car.jpg",
    coverUrl: "/music/covers/tracy-chapman-fast-car.jpg",
    accent: "coral",
    format: "FLAC 16-BIT",
  },
];

const WAVE_BARS = [
  6, 8, 12, 10, 14, 18, 22, 26, 28, 32, 29, 34, 30, 26, 24, 22,
  22, 24, 26, 30, 34, 29, 32, 28, 26, 22, 18, 14, 10, 12, 8, 6,
];

function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
}

export default function MusicPlayer({ isDeckOpen, setIsDeckOpen, onPlayingStateChange }) {
  const [tracks, setTracks] = useState(DEFAULT_TRACKS);
  const [currentIndex, setCurrentIndex] = useState(0);
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
  const currentTrack = tracks[currentIndex] || tracks[0];

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
  }, [isFullScreen, isDeckOpen, isPlaying, currentIndex, tracks, isShuffle]);

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

  // Update HTML audio volume when state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Extract embedded cover art and metadata directly from the audio files on mount
  useEffect(() => {
    tracks.forEach((track, idx) => {
      extractAudioMetadata(track.audioSrc, track.fallbackCover).then((meta) => {
        if (meta) {
          setTracks((prev) =>
            prev.map((t, i) =>
              i === idx
                ? {
                  ...t,
                  coverUrl: meta.coverUrl || t.coverUrl,
                  title: meta.title?.trim() || t.title,
                  artist: meta.artist?.trim() || t.artist,
                  album: meta.album?.trim() || t.album,
                  format: meta.format || t.format,
                }
                : t
            )
          );
        }
      });
    });
  }, []);

  const playTrackWithList = (index, trackList = tracks, shouldPlay = true) => {
    const nextTrack = trackList[index];
    if (!nextTrack || !audioRef.current) return;

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

    sfx.playSnap();

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
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
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

              {/* EQ Animated Bars */}
              <div className={`mini-eq ${isPlaying ? "eq-active" : ""}`} aria-hidden="true">
                <span className="eq-bar b1" />
                <span className="eq-bar b2" />
                <span className="eq-bar b3" />
                <span className="eq-bar b4" />
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
                  <Asterisk size={14} /> RAMAN'S STUDIO DECK · 0{currentIndex + 1} / 0{tracks.length}
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

                  {/* Visualizer graphic bars */}
                  <div className="deck-waveform" aria-hidden="true">
                    <div className={`deck-eq-bars ${isPlaying ? "active" : ""}`}>
                      {[...Array(18)].map((_, i) => (
                        <span
                          key={i}
                          className="deck-eq-bar"
                          style={{
                            animationDelay: `${(i % 6) * 0.12}s`,
                            height: isPlaying ? undefined : "4px",
                          }}
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
          aria-label="Raman's Studio Deck"
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
                    RAMAN'S STUDIO DECK · 0{currentIndex + 1} / 0{tracks.length}
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

                      <div className={`studio-vinyl-disc ${isPlaying ? "spinning" : ""}`}>
                        <div className="studio-vinyl-center-hole" />
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

                {/* Coral Soundwave Visualizer */}
                <div
                  className={`studio-wave-container ${isPlaying ? "playing" : ""}`}
                  aria-hidden="true"
                >
                  {WAVE_BARS.map((h, i) => (
                    <span
                      key={i}
                      className="studio-wave-bar"
                      style={{
                        "--bar-h": `${h}px`,
                        animationDelay: `${(i % 7) * 0.1}s`,
                        animationDuration: `${0.75 + (i % 4) * 0.15}s`,
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

                    <button
                      type="button"
                      className="studio-pill-action"
                      onClick={() => sfx.playChime()}
                    >
                      <Music size={14} />
                      <span>Library</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Sidebar: Playlist (Hideable, closed by default) */}
              {isStudioPlaylistOpen && (
                <aside className="studio-stage-right-sidebar" data-lenis-prevent="true">
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
                                <span className="si-bar" />
                                <span className="si-bar" style={{ animationDelay: "0.2s" }} />
                                <span className="si-bar" style={{ animationDelay: "0.4s" }} />
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
