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
  Disc,
  Upload,
  Asterisk,
  Radio,
  Sliders,
  ListMusic
} from "lucide-react";
import { extractAudioMetadata } from "../utils/audioMetadata";

// Default curated tracks with pre-extracted fallback covers from the audio files
const DEFAULT_TRACKS = [
  {
    id: "melomance-love-maybe",
    title: "Love, Maybe",
    artist: "MeloMance",
    album: "A Business Proposal OST Special",
    date: "2022",
    audioSrc: "/music/melomance-love-maybe.flac",
    fallbackCover: "/music/covers/melomance-love-maybe.jpg",
    coverUrl: "/music/covers/melomance-love-maybe.jpg",
    accent: "lime",
  },
  {
    id: "tracy-chapman-fast-car",
    title: "Fast Car (2015 Remaster)",
    artist: "Tracy Chapman",
    album: "Greatest Hits",
    date: "2015",
    audioSrc: "/music/tracy-chapman-fast-car.flac",
    fallbackCover: "/music/covers/tracy-chapman-fast-car.jpg",
    coverUrl: "/music/covers/tracy-chapman-fast-car.jpg",
    accent: "coral",
  },
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
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);

  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const currentTrack = tracks[currentIndex] || tracks[0];

  // Notify parent of playing state (for header widget)
  useEffect(() => {
    onPlayingStateChange?.({
      isPlaying,
      currentTrack,
      togglePlay,
      openDeck: () => setIsDeckOpen(true),
    });
  }, [isPlaying, currentIndex, currentTrack]);

  // Extract embedded cover art directly from the FLAC audio file on mount
  useEffect(() => {
    tracks.forEach((track, idx) => {
      extractAudioMetadata(track.audioSrc, track.fallbackCover).then((meta) => {
        if (meta?.coverUrl && meta.coverUrl !== track.coverUrl) {
          setTracks((prev) =>
            prev.map((t, i) =>
              i === idx
                ? {
                  ...t,
                  coverUrl: meta.coverUrl,
                  title: meta.title || t.title,
                  artist: meta.artist || t.artist,
                  album: meta.album || t.album,
                }
                : t
            )
          );
        }
      });
    });
  }, []);

  // Sync audio element volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Track switching handler
  const playTrack = (index, shouldPlay = true) => {
    const nextTrack = tracks[index];
    setCurrentIndex(index);
    setCurrentTime(0);
    setIsPlaying(shouldPlay);

    if (audioRef.current && nextTrack) {
      // Update audio source directly for instant response
      if (!audioRef.current.src.endsWith(nextTrack.audioSrc)) {
        audioRef.current.src = nextTrack.audioSrc;
      }
      audioRef.current.currentTime = 0;
      if (shouldPlay) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch((err) => {
            console.log("Audio playback:", err);
          });
      }
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Audio playback error:", err);
          setIsPlaying(false);
        });
    }
  };

  const handleNext = () => {
    if (isShuffle && tracks.length > 1) {
      let nextIdx = Math.floor(Math.random() * tracks.length);
      while (nextIdx === currentIndex) {
        nextIdx = Math.floor(Math.random() * tracks.length);
      }
      playTrack(nextIdx, true);
    } else {
      const nextIdx = (currentIndex + 1) % tracks.length;
      playTrack(nextIdx, true);
    }
  };

  const handlePrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.warn);
      return;
    }
    const prevIdx = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(prevIdx, true);
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
        audioRef.current.play();
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

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleRepeat = () => {
    if (repeatMode === "none") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("none");
  };

  // Allow uploading a custom audio file (.flac / .mp3)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const audioUrl = URL.createObjectURL(file);
      const meta = await extractAudioMetadata(file, "");

      const newTrack = {
        id: `custom-${Date.now()}`,
        title: meta.title || file.name.replace(/\.[^/.]+$/, ""),
        artist: meta.artist || "Unknown Artist",
        album: meta.album || "Local File",
        date: "User Upload",
        audioSrc: audioUrl,
        fallbackCover: "",
        coverUrl: meta.coverUrl || currentTrack.coverUrl,
        accent: "lilac",
      };

      setTracks((prev) => [...prev, newTrack]);
      setCurrentIndex(tracks.length);
      setIsPlaying(true);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(console.warn);
        }
      }, 50);
    } catch (err) {
      console.error("Error processing uploaded audio:", err);
    }
  };

  return (
    <>
      {/* Hidden native audio element */}
      <audio
        ref={audioRef}
        src={currentTrack?.audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        preload="metadata"
      />

      {/* FLOATING MUSIC CONTROLLER DOCK (Bottom Right) */}
      <aside
        className={`music-dock ${isDeckOpen ? "dock-expanded" : "dock-collapsed"}`}
        aria-label="Portfolio Soundtrack Player"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* COLLAPSED MINI-PILL */}
        {!isDeckOpen ? (
          <div className="mini-pill" onClick={() => setIsDeckOpen(true)} role="button" tabIndex={0} aria-label="Open Music Player">
            {/* Spinning mini vinyl thumbnail with cover art from audio file */}
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
                  <span className={`live-dot ${isPlaying ? "active" : ""}`} />
                  {isPlaying ? "PLAYING" : "SOUNDTRACK"}
                </span>
                <span className="mini-count">0{currentIndex + 1} / 0{tracks.length}</span>
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

            {/* Expand Deck Button */}
            <button
              type="button"
              className="mini-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeckOpen(true);
              }}
              aria-label="Expand studio deck"
            >
              <ChevronUp size={16} />
            </button>
          </div>
        ) : (
          /* EXPANDED NEO-BRUTALIST STUDIO DECK */
          <div className="deck-card">
            {/* Top Eyebrow Bar */}
            <div className="deck-header">
              <div className="deck-eyebrow">
                <Asterisk size={14} /> RAMAN'S STUDIO DECK · 0{currentIndex + 1} / 0{tracks.length}
              </div>
              <div className="deck-actions">
                <span className="deck-pill-tag">FLAC 24-BIT</span>
                <button
                  type="button"
                  className="deck-close-btn"
                  onClick={() => setIsDeckOpen(false)}
                  aria-label="Collapse music player"
                >
                  <ChevronDown size={17} />
                </button>
              </div>
            </div>

            {/* Center Player Body */}
            <div className="deck-body">
              {/* Left Column: Vinyl & Sleeve Display */}
              <div className="deck-vinyl-stage">
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
                  <div className="deck-sleeve-tag">EMBEDDED COVER ART</div>
                </div>
              </div>

              {/* Right Column: Track Metadata & Audio Telemetry */}
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
                    onClick={() => setIsShuffle(!isShuffle)}
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
                  onClick={() => setShowPlaylist(!showPlaylist)}
                  aria-label="Toggle playlist drawer"
                >
                  <ListMusic size={15} /> Playlist ({tracks.length})
                </button>

                <button
                  type="button"
                  className="deck-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Load your own audio file (.flac / .mp3)"
                  aria-label="Upload custom music file"
                >
                  <Upload size={14} /> Add Song
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/flac,audio/mp3,audio/wav,audio/*"
                  style={{ display: "none" }}
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {/* PLAYLIST DRAWER */}
            {showPlaylist && (
              <div className="deck-playlist">
                <div className="playlist-heading">
                  <span>SELECT TRACK</span>
                  <small>AUTO-EXTRACTS COVER ART & METADATA</small>
                </div>
                <div className="playlist-items">
                  {tracks.map((t, idx) => (
                    <div
                      key={t.id}
                      className={`playlist-item ${idx === currentIndex ? "active" : ""}`}
                      onClick={() => playTrack(idx, true)}
                      role="button"
                      tabIndex={0}
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
                      {idx === currentIndex && isPlaying && (
                        <span className="playlist-active-badge">
                          <Asterisk size={12} className="spin-slow" /> PLAYING
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}

