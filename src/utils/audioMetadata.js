/**
 * Audio Metadata & Cover Art Extractor
 * Reads embedded metadata, pictures, and format specs directly from
 * FLAC, MP3 (ID3v2 & ID3v1), WAV (RIFF/fmt/LIST), OGG/Opus, and M4A/MP4 files.
 */

/**
 * Generate a modern, elegant SVG fallback cover for tracks without embedded artwork.
 * Strictly guarantees that no previous track's artwork is inherited.
 * @param {string} title
 * @param {string} artist
 * @param {string} [format="AUDIO"]
 * @returns {string} Data URI (SVG)
 */
export function createFallbackCover(title = "Soundtrack", artist = "Audio", format = "AUDIO") {
  const cleanTitle = (title || "Soundtrack").slice(0, 22);
  const cleanArtist = (artist || "Local Audio").slice(0, 26);
  const cleanBadge = (format || "AUDIO").split(/[\s-]/)[0].toUpperCase().slice(0, 5);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="500" height="500">
    <defs>
      <linearGradient id="sleeve-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#181422"/>
        <stop offset="50%" stop-color="#231c33"/>
        <stop offset="100%" stop-color="#120f1a"/>
      </linearGradient>
      <radialGradient id="vinyl-center" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#34284b"/>
        <stop offset="60%" stop-color="#201830"/>
        <stop offset="100%" stop-color="#120e1c"/>
      </radialGradient>
      <linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#c5f82a"/>
        <stop offset="50%" stop-color="#9a7bd3"/>
        <stop offset="100%" stop-color="#ff6b4a"/>
      </linearGradient>
    </defs>
    <rect width="500" height="500" fill="url(#sleeve-bg)"/>
    <!-- Outer concentric groove tracks -->
    <circle cx="250" cy="220" r="160" fill="none" stroke="#9a7bd3" stroke-width="1" stroke-opacity="0.18"/>
    <circle cx="250" cy="220" r="130" fill="none" stroke="#9a7bd3" stroke-width="1" stroke-opacity="0.22"/>
    <circle cx="250" cy="220" r="100" fill="none" stroke="#9a7bd3" stroke-width="1" stroke-opacity="0.15"/>
    <circle cx="250" cy="220" r="75" fill="none" stroke="#9a7bd3" stroke-width="1.5" stroke-opacity="0.3"/>
    <!-- Center Label -->
    <circle cx="250" cy="220" r="58" fill="url(#vinyl-center)" stroke="#9a7bd3" stroke-width="2" stroke-opacity="0.4"/>
    <circle cx="250" cy="220" r="16" fill="#120f1a" stroke="#c5f82a" stroke-width="1.5"/>
    <circle cx="250" cy="220" r="6" fill="#c5f82a"/>
    <!-- Decorative format badge -->
    <rect x="40" y="40" width="76" height="22" rx="4" fill="#9a7bd3" fill-opacity="0.2" stroke="#9a7bd3" stroke-width="1"/>
    <text x="78" y="55" font-family="'DM Mono', monospace, sans-serif" font-size="10" font-weight="700" fill="#d9cded" text-anchor="middle" letter-spacing="1.5">${cleanBadge}</text>
    <!-- Song Info on bottom of sleeve -->
    <text x="250" y="420" font-family="'Manrope', system-ui, sans-serif" font-size="22" font-weight="800" fill="#f5f0ff" text-anchor="middle">${cleanTitle}</text>
    <text x="250" y="450" font-family="'DM Mono', monospace, sans-serif" font-size="13" font-weight="600" fill="#9a7bd3" text-anchor="middle" letter-spacing="1">${cleanArtist}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function toArrayBuffer(input) {
  if (!input) return new ArrayBuffer(0);
  if (input instanceof ArrayBuffer) return input;
  if (ArrayBuffer.isView(input)) {
    return input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength);
  }
  return input;
}

/**
 * Detect audio format from file extension or MIME type
 * @param {string} [name=""]
 * @param {string} [mimeType=""]
 * @returns {string}
 */
export function detectFormatFromNameOrType(name = "", mimeType = "") {
  const cleanName = (name || "").toLowerCase();
  const cleanMime = (mimeType || "").toLowerCase();

  if (cleanName.endsWith(".flac") || cleanMime.includes("flac")) return "FLAC LOSSLESS";
  if (cleanName.endsWith(".wav") || cleanMime.includes("wav")) return "WAV PCM";
  if (cleanName.endsWith(".mp3") || cleanMime.includes("mpeg") || cleanMime.includes("mp3")) return "MP3 AUDIO";
  if (cleanName.endsWith(".m4a") || cleanMime.includes("m4a")) return "M4A AAC";
  if (cleanName.endsWith(".aac") || cleanMime.includes("aac")) return "AAC AUDIO";
  if (cleanName.endsWith(".ogg") || cleanMime.includes("ogg")) return "OGG VORBIS";
  if (cleanName.endsWith(".opus") || cleanMime.includes("opus")) return "OPUS AUDIO";
  if (cleanName.endsWith(".webm") || cleanMime.includes("webm")) return "WEBM AUDIO";
  if (cleanName.endsWith(".wma") || cleanMime.includes("wma")) return "WMA AUDIO";
  if (cleanName.endsWith(".aiff") || cleanName.endsWith(".aif") || cleanMime.includes("aiff")) return "AIFF LOSSLESS";
  if (cleanName.endsWith(".alac")) return "ALAC LOSSLESS";

  if (cleanName.includes(".")) {
    const ext = cleanName.split(".").pop();
    if (ext && ext.length <= 5) return `${ext.toUpperCase()} AUDIO`;
  }

  return "AUDIO";
}

/**
 * Parse FLAC metadata from an ArrayBuffer
 * Reads STREAMINFO (sample rate, bit depth), Vorbis comments (title, artist, album),
 * and Picture Block 6 (embedded cover art).
 * @param {ArrayBuffer} buffer
 */
export function parseFlacBuffer(buffer) {
  const buf = toArrayBuffer(buffer);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  // Check 'fLaC' magic bytes
  if (
    bytes[0] !== 0x66 ||
    bytes[1] !== 0x4c ||
    bytes[2] !== 0x61 ||
    bytes[3] !== 0x43
  ) {
    throw new Error("Not a valid FLAC file");
  }

  let offset = 4;
  let isLast = false;
  const comments = {};
  let coverUrl = null;
  let mimeType = null;
  let streamInfo = null;

  while (!isLast && offset < bytes.length) {
    if (offset + 4 > bytes.length) break;

    const headerByte = view.getUint8(offset);
    isLast = (headerByte & 0x80) !== 0;
    const blockType = headerByte & 0x7f;
    const blockLength =
      (view.getUint8(offset + 1) << 16) |
      (view.getUint8(offset + 2) << 8) |
      view.getUint8(offset + 3);

    offset += 4;

    if (offset + blockLength > bytes.length) {
      break;
    }

    if (blockType === 0 && blockLength >= 18) {
      // STREAMINFO
      try {
        const sr_ch_bps = (bytes[offset + 10] << 16) | (bytes[offset + 11] << 8) | bytes[offset + 12];
        const sampleRate = sr_ch_bps >> 4;
        const channels = ((sr_ch_bps >> 1) & 0x7) + 1;
        const bitsPerSample = (((sr_ch_bps & 0x1) << 4) | (bytes[offset + 13] >> 4)) + 1;
        streamInfo = {
          sampleRate,
          channels,
          bitsPerSample,
          format: bitsPerSample ? `FLAC ${bitsPerSample}-BIT` : "FLAC LOSSLESS",
        };
      } catch (err) {
        console.warn("Error parsing FLAC STREAMINFO:", err);
      }
    } else if (blockType === 4) {
      // VORBIS_COMMENT
      try {
        let pos = offset;
        const vendorLen = view.getUint32(pos, true);
        pos += 4 + vendorLen;
        const numComments = view.getUint32(pos, true);
        pos += 4;

        for (let i = 0; i < numComments && pos < offset + blockLength; i++) {
          const commentLen = view.getUint32(pos, true);
          pos += 4;
          const commentBytes = bytes.subarray(pos, pos + commentLen);
          pos += commentLen;
          const comment = new TextDecoder("utf-8").decode(commentBytes);
          const eqIdx = comment.indexOf("=");
          if (eqIdx !== -1) {
            const key = comment.slice(0, eqIdx).toUpperCase();
            const val = comment.slice(eqIdx + 1);
            comments[key] = val;
          }
        }
      } catch (err) {
        console.warn("Error parsing Vorbis comments:", err);
      }
    } else if (blockType === 6) {
      // PICTURE (Block 6)
      try {
        let pos = offset;
        const picType = view.getUint32(pos, false); // 3 = front cover
        pos += 4;
        const mimeLen = view.getUint32(pos, false);
        pos += 4;
        const mime = new TextDecoder("ascii").decode(bytes.subarray(pos, pos + mimeLen));
        pos += mimeLen;
        const descLen = view.getUint32(pos, false);
        pos += 4 + descLen;
        pos += 16; // width (4), height (4), depth (4), colors (4)
        const dataLen = view.getUint32(pos, false);
        pos += 4;

        const picData = bytes.subarray(pos, pos + dataLen);
        const blob = new Blob([picData], { type: mime || "image/jpeg" });
        coverUrl = URL.createObjectURL(blob);
        mimeType = mime;
      } catch (err) {
        console.warn("Error parsing FLAC picture block:", err);
      }
    }

    offset += blockLength;
  }

  return {
    title: comments.TITLE || comments.TRACKTITLE,
    artist: comments.ARTIST || comments.ALBUMARTIST || comments.PERFORMER,
    album: comments.ALBUM,
    date: comments.DATE || comments.YEAR,
    coverUrl,
    mime: mimeType,
    sampleRate: streamInfo?.sampleRate,
    bitsPerSample: streamInfo?.bitsPerSample,
    channels: streamInfo?.channels,
    format: streamInfo?.format || "FLAC LOSSLESS",
  };
}

/**
 * Parse WAV metadata and format telemetry from an ArrayBuffer
 * Reads RIFF/WAVE header, 'fmt ' chunk (bit depth, sample rate, channels),
 * and LIST INFO chunks (INAM, IART, IPRD, ICRD) or embedded ID3 chunk.
 * @param {ArrayBuffer} buffer
 */
export function parseWavBuffer(buffer) {
  const buf = toArrayBuffer(buffer);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  if (bytes.length < 12) return null;
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  const wave = String.fromCharCode(...bytes.subarray(8, 12));
  if (magic !== "RIFF" || wave !== "WAVE") return null;

  let offset = 12;
  let audioFormat = 1;
  let channels = 2;
  let sampleRate = 44100;
  let bitsPerSample = 16;
  const info = {};

  while (offset + 8 <= bytes.length) {
    const chunkId = String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const chunkSize = view.getUint32(offset + 4, true);
    offset += 8;

    if (chunkId === "fmt " && chunkSize >= 16 && offset + 16 <= bytes.length) {
      audioFormat = view.getUint16(offset, true);
      channels = view.getUint16(offset + 2, true);
      sampleRate = view.getUint32(offset + 4, true);
      bitsPerSample = view.getUint16(offset + 14, true);
    } else if (chunkId === "LIST" && offset + chunkSize <= bytes.length) {
      const listType = String.fromCharCode(...bytes.subarray(offset, offset + 4));
      if (listType === "INFO") {
        let sub = offset + 4;
        while (sub + 8 < offset + chunkSize) {
          const subId = String.fromCharCode(...bytes.subarray(sub, sub + 4));
          const subSize = view.getUint32(sub + 4, true);
          sub += 8;
          if (sub + subSize <= offset + chunkSize) {
            const val = new TextDecoder("utf-8").decode(bytes.subarray(sub, sub + subSize)).replace(/\0/g, "").trim();
            if (subId === "INAM") info.title = val;
            else if (subId === "IART") info.artist = val;
            else if (subId === "IPRD") info.album = val;
            else if (subId === "ICRD") info.date = val;
          }
          sub += subSize + (subSize % 2);
        }
      }
    } else if (chunkId === "id3 " || chunkId === "ID3 ") {
      try {
        const id3Meta = parseId3Buffer(buffer.slice(offset, offset + chunkSize));
        if (id3Meta) {
          if (id3Meta.title) info.title = id3Meta.title;
          if (id3Meta.artist) info.artist = id3Meta.artist;
          if (id3Meta.album) info.album = id3Meta.album;
          if (id3Meta.date) info.date = id3Meta.date;
          if (id3Meta.coverUrl) info.coverUrl = id3Meta.coverUrl;
        }
      } catch (e) {}
    }

    offset += chunkSize + (chunkSize % 2);
  }

  let formatStr = "WAV PCM";
  if (audioFormat === 3) {
    formatStr = bitsPerSample ? `WAV ${bitsPerSample}-BIT FLOAT` : "WAV FLOAT";
  } else if (bitsPerSample) {
    formatStr = `WAV ${bitsPerSample}-BIT`;
  }

  return {
    ...info,
    channels,
    sampleRate,
    bitsPerSample,
    format: formatStr,
  };
}

/**
 * Detect MP3 bitrate and channel structure from MPEG frame headers
 * @param {Uint8Array} bytes
 * @param {number} [startOffset=0]
 * @returns {string} e.g. "MP3 320KBPS", "MP3 256KBPS", "MP3 AUDIO"
 */
export function detectMp3Format(bytes, startOffset = 0) {
  const bitratesV1L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
  const maxScan = Math.min(bytes.length - 4, Math.max(0, startOffset) + 8192);

  for (let i = Math.max(0, startOffset); i <= maxScan; i++) {
    if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
      const version = (bytes[i + 1] >> 3) & 0x03; // 3 = MPEG 1, 2 = MPEG 2, 0 = MPEG 2.5
      const layer = (bytes[i + 1] >> 1) & 0x03;   // 1 = Layer III
      if (layer === 1) {
        const brIdx = (bytes[i + 2] >> 4) & 0x0f;
        if (version === 3 && brIdx > 0 && brIdx < 15) {
          const br = bitratesV1L3[brIdx];
          return `MP3 ${br}KBPS`;
        }
        return "MP3 AUDIO";
      }
    }
  }

  return "MP3 AUDIO";
}

/**
 * Parse ID3v1 tag from the last 128 bytes of an audio buffer
 * @param {Uint8Array} bytes
 */
export function parseId3v1(bytes) {
  if (bytes.length < 128) return null;
  const start = bytes.length - 128;
  if (
    bytes[start] !== 0x54 || // 'T'
    bytes[start + 1] !== 0x41 || // 'A'
    bytes[start + 2] !== 0x47    // 'G'
  ) {
    return null;
  }

  const decode = (offset, len) => {
    return new TextDecoder("iso-8859-1")
      .decode(bytes.subarray(offset, offset + len))
      .replace(/\0/g, "")
      .trim();
  };

  const title = decode(start + 3, 30);
  const artist = decode(start + 33, 30);
  const album = decode(start + 63, 30);
  const date = decode(start + 93, 4);

  return { title, artist, album, date };
}

/**
 * Parse ID3v2 metadata & APIC picture frame from MP3 buffer
 * @param {ArrayBuffer} buffer
 */
export function parseId3Buffer(buffer) {
  const buf = toArrayBuffer(buffer);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);

  // Search for 'ID3' marker in the first 2048 bytes
  let id3Offset = -1;
  for (let i = 0; i < Math.min(bytes.length - 10, 2048); i++) {
    if (bytes[i] === 0x49 && bytes[i + 1] === 0x44 && bytes[i + 2] === 0x33) {
      id3Offset = i;
      break;
    }
  }

  if (id3Offset === -1) return null;

  const version = bytes[id3Offset + 3];
  if (version < 2 || version > 4) return null;

  // Synchsafe integer tag size
  const tagSize =
    ((bytes[id3Offset + 6] & 0x7f) << 21) |
    ((bytes[id3Offset + 7] & 0x7f) << 14) |
    ((bytes[id3Offset + 8] & 0x7f) << 7) |
    (bytes[id3Offset + 9] & 0x7f);

  let offset = id3Offset + 10;
  const maxOffset = Math.min(bytes.length, id3Offset + 10 + tagSize);
  const metadata = {};

  if (version === 2) {
    // ID3v2.2 (3-char frame IDs, 3-byte lengths)
    while (offset + 6 < maxOffset) {
      const frameId = String.fromCharCode(bytes[offset], bytes[offset + 1], bytes[offset + 2]);
      if (bytes[offset] === 0) break;
      const frameSize =
        (bytes[offset + 3] << 16) | (bytes[offset + 4] << 8) | bytes[offset + 5];
      offset += 6;
      if (offset + frameSize > maxOffset) break;

      const frameData = bytes.subarray(offset, offset + frameSize);
      if (frameId === "TT2") metadata.title = decodeTextFrame(frameData);
      else if (frameId === "TP1") metadata.artist = decodeTextFrame(frameData);
      else if (frameId === "TAL") metadata.album = decodeTextFrame(frameData);
      else if (frameId === "TYE") metadata.date = decodeTextFrame(frameData);
      else if (frameId === "PIC") {
        extractImageFromFrameData(frameData, metadata);
      }
      offset += frameSize;
    }
  } else {
    // ID3v2.3 and ID3v2.4 (4-char frame IDs, 4-byte lengths)
    while (offset + 10 < maxOffset) {
      const frameId = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3]
      );
      if (bytes[offset] === 0) break;

      const frameSize =
        version === 4
          ? ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f)
          : view.getUint32(offset + 4, false);

      offset += 10; // Skip frame header
      if (offset + frameSize > maxOffset) break;

      const frameData = bytes.subarray(offset, offset + frameSize);
      if (frameId === "TIT2") metadata.title = decodeTextFrame(frameData);
      else if (frameId === "TPE1" || (!metadata.artist && frameId === "TPE2")) metadata.artist = decodeTextFrame(frameData);
      else if (frameId === "TALB") metadata.album = decodeTextFrame(frameData);
      else if (frameId === "TYER" || frameId === "TDRC") metadata.date = decodeTextFrame(frameData);
      else if (frameId === "APIC") {
        extractImageFromFrameData(frameData, metadata);
      }

      offset += frameSize;
    }
  }

  // Detect bitrate right after ID3 header
  metadata.format = detectMp3Format(bytes, id3Offset + 10 + tagSize);

  return metadata;
}

/**
 * Scan binary frame data for standard image magic headers (JPEG, PNG, WebP)
 * and create an ObjectURL Blob.
 */
function extractImageFromFrameData(frameData, metadata) {
  try {
    let imgStart = -1;
    let mime = "image/jpeg";

    for (let i = 1; i < frameData.length - 4; i++) {
      // JPEG: FF D8 FF
      if (frameData[i] === 0xff && frameData[i + 1] === 0xd8 && frameData[i + 2] === 0xff) {
        imgStart = i;
        mime = "image/jpeg";
        break;
      }
      // PNG: 89 50 4E 47
      if (
        frameData[i] === 0x89 &&
        frameData[i + 1] === 0x50 &&
        frameData[i + 2] === 0x4e &&
        frameData[i + 3] === 0x47
      ) {
        imgStart = i;
        mime = "image/png";
        break;
      }
      // WebP: RIFF .... WEBP
      if (
        frameData[i] === 0x52 &&
        frameData[i + 1] === 0x49 &&
        frameData[i + 2] === 0x46 &&
        frameData[i + 3] === 0x46 &&
        frameData[i + 8] === 0x57 &&
        frameData[i + 9] === 0x45 &&
        frameData[i + 10] === 0x42 &&
        frameData[i + 11] === 0x50
      ) {
        imgStart = i;
        mime = "image/webp";
        break;
      }
    }

    if (imgStart !== -1) {
      const picData = frameData.subarray(imgStart);
      const blob = new Blob([picData], { type: mime });
      metadata.coverUrl = URL.createObjectURL(blob);
    }
  } catch (e) {
    console.warn("Could not extract image from APIC:", e);
  }
}

/**
 * Parse Ogg Vorbis and Opus container metadata
 * @param {ArrayBuffer} buffer
 */
export function parseOggBuffer(buffer) {
  const buf = toArrayBuffer(buffer);
  const bytes = new Uint8Array(buf);
  if (bytes.length < 16) return null;
  const magic = String.fromCharCode(...bytes.subarray(0, 4));
  if (magic !== "OggS") return null;

  let format = "OGG AUDIO";
  const str = new TextDecoder("ascii").decode(bytes.subarray(0, Math.min(bytes.length, 4096)));
  if (str.includes("OpusHead")) format = "OPUS AUDIO";
  else if (str.includes("vorbis")) format = "OGG VORBIS";

  const comments = {};

  try {
    for (let i = 0; i < Math.min(bytes.length - 8, 65536); i++) {
      if (
        (bytes[i] === 0x03 && bytes[i + 1] === 0x76 && bytes[i + 2] === 0x6f && bytes[i + 3] === 0x72 && bytes[i + 4] === 0x62 && bytes[i + 5] === 0x69 && bytes[i + 6] === 0x73) ||
        (bytes[i] === 0x4f && bytes[i + 1] === 0x70 && bytes[i + 2] === 0x75 && bytes[i + 3] === 0x73 && bytes[i + 4] === 0x54 && bytes[i + 5] === 0x61 && bytes[i + 6] === 0x67 && bytes[i + 7] === 0x73)
      ) {
        let pos = i + (bytes[i] === 0x03 ? 7 : 8);
        const view = new DataView(buffer, pos);
        const vendorLen = view.getUint32(0, true);
        pos += 4 + vendorLen;
        const numComments = new DataView(buffer, pos).getUint32(0, true);
        pos += 4;

        for (let c = 0; c < numComments && pos + 4 < bytes.length; c++) {
          const commentLen = new DataView(buffer, pos).getUint32(0, true);
          pos += 4;
          if (pos + commentLen > bytes.length) break;
          const comment = new TextDecoder("utf-8").decode(bytes.subarray(pos, pos + commentLen));
          pos += commentLen;
          const eqIdx = comment.indexOf("=");
          if (eqIdx !== -1) {
            const k = comment.slice(0, eqIdx).toUpperCase();
            const v = comment.slice(eqIdx + 1);
            comments[k] = v;
          }
        }
        break;
      }
    }
  } catch (e) {}

  return {
    title: comments.TITLE || comments.TRACKTITLE,
    artist: comments.ARTIST || comments.ALBUMARTIST,
    album: comments.ALBUM,
    date: comments.DATE || comments.YEAR,
    coverUrl: null,
    format,
  };
}

/**
 * Parse MP4 / M4A metadata atoms (moov -> udta -> meta -> ilst)
 * @param {ArrayBuffer} buffer
 */
export function parseMp4Buffer(buffer) {
  const buf = toArrayBuffer(buffer);
  const bytes = new Uint8Array(buf);
  const view = new DataView(buf);
  const metadata = { format: "M4A AAC" };

  try {
    // Scan for covr atom
    for (let i = 0; i < bytes.length - 16; i++) {
      if (
        bytes[i] === 0x63 && // 'c'
        bytes[i + 1] === 0x6f && // 'o'
        bytes[i + 2] === 0x76 && // 'v'
        bytes[i + 3] === 0x72    // 'r'
      ) {
        // Find 'data' box inside covr
        const maxSearch = Math.min(bytes.length - 8, i + 500);
        for (let j = i + 4; j < maxSearch; j++) {
          if (
            bytes[j] === 0x64 && // 'd'
            bytes[j + 1] === 0x61 && // 'a'
            bytes[j + 2] === 0x74 && // 't'
            bytes[j + 3] === 0x61    // 'a'
          ) {
            const dataBoxSize = view.getUint32(j - 4, false);
            const imageType = view.getUint32(j + 4, false); // 13 = JPEG, 14 = PNG
            const mime = imageType === 14 ? "image/png" : "image/jpeg";
            const imgData = bytes.subarray(j + 12, j - 4 + dataBoxSize);
            if (imgData.length > 0) {
              const blob = new Blob([imgData], { type: mime });
              metadata.coverUrl = URL.createObjectURL(blob);
            }
            break;
          }
        }
        break;
      }
    }
  } catch (err) {
    console.warn("Error parsing MP4 covr atom:", err);
  }

  return metadata;
}

function decodeTextFrame(bytes) {
  if (bytes.length < 2) return "";
  const encoding = bytes[0];
  const data = bytes.subarray(1);
  try {
    if (encoding === 0) return new TextDecoder("iso-8859-1").decode(data).replace(/\0/g, "").trim();
    if (encoding === 1) return new TextDecoder("utf-16").decode(data).replace(/\0/g, "").trim();
    if (encoding === 2) return new TextDecoder("utf-16be").decode(data).replace(/\0/g, "").trim();
    return new TextDecoder("utf-8").decode(data).replace(/\0/g, "").trim();
  } catch (e) {
    return "";
  }
}

/**
 * Extract metadata, cover art, and audio format directly from an audio URL or File/Blob
 * @param {string | File | Blob} source
 * @param {string} [fallbackCover]
 * @returns {Promise<{ title?: string, artist?: string, album?: string, date?: string, coverUrl: string | null, format?: string }>}
 */
export async function extractAudioMetadata(source, fallbackCover = "") {
  try {
    let buffer;
    let fileName = "";
    let mimeType = "";

    if (source instanceof Blob || source instanceof File) {
      if (source instanceof File) {
        fileName = source.name;
        mimeType = source.type;
      }
      // Read up to 24MB to ensure high-resolution embedded album arts fit completely
      const slice = source.slice(0, Math.min(source.size, 24 * 1024 * 1024));
      buffer = await slice.arrayBuffer();
    } else if (typeof source === "string") {
      fileName = source;
      // Fetch up to 4MB using HTTP Range for remote tracks
      const res = await fetch(source, {
        headers: { Range: "bytes=0-4194303" },
      });
      buffer = await res.arrayBuffer();
    }

    if (buffer && buffer.byteLength > 8) {
      const bytes = new Uint8Array(buffer);
      const magic4 = String.fromCharCode(...bytes.subarray(0, 4));

      // 1. FLAC
      if (magic4 === "fLaC") {
        const meta = parseFlacBuffer(buffer);
        return {
          title: meta.title,
          artist: meta.artist,
          album: meta.album,
          date: meta.date,
          coverUrl: meta.coverUrl || (fallbackCover || null),
          format: meta.format || "FLAC LOSSLESS",
        };
      }

      // 2. WAV (RIFF .... WAVE)
      if (magic4 === "RIFF" && bytes.length >= 12) {
        const wave = String.fromCharCode(...bytes.subarray(8, 12));
        if (wave === "WAVE") {
          const wavMeta = parseWavBuffer(buffer);
          if (wavMeta) {
            return {
              title: wavMeta.title,
              artist: wavMeta.artist,
              album: wavMeta.album,
              date: wavMeta.date,
              coverUrl: wavMeta.coverUrl || (fallbackCover || null),
              format: wavMeta.format || "WAV PCM",
            };
          }
        }
      }

      // 3. MP3 with ID3v2
      if (magic4.startsWith("ID3") || (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)) {
        const meta = parseId3Buffer(buffer);
        if (meta) {
          const mp3Format = meta.format || detectMp3Format(bytes, 0);
          return {
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            date: meta.date,
            coverUrl: meta.coverUrl || (fallbackCover || null),
            format: mp3Format || "MP3 AUDIO",
          };
        }
      }

      // 4. Raw MP3 / MP3 with ID3 at offset
      const id3Meta = parseId3Buffer(buffer);
      if (id3Meta && (id3Meta.title || id3Meta.coverUrl)) {
        return {
          title: id3Meta.title,
          artist: id3Meta.artist,
          album: id3Meta.album,
          date: id3Meta.date,
          coverUrl: id3Meta.coverUrl || (fallbackCover || null),
          format: id3Meta.format || detectMp3Format(bytes, 0) || "MP3 AUDIO",
        };
      }

      // Check if raw MP3 audio frames start near the beginning
      for (let i = 0; i < Math.min(bytes.length - 4, 2048); i++) {
        if (bytes[i] === 0xff && (bytes[i + 1] & 0xe0) === 0xe0) {
          const id3v1 = parseId3v1(bytes);
          return {
            title: id3v1?.title,
            artist: id3v1?.artist,
            album: id3v1?.album,
            date: id3v1?.date,
            coverUrl: fallbackCover || null,
            format: detectMp3Format(bytes, i) || "MP3 AUDIO",
          };
        }
      }

      // 5. OGG / Vorbis / Opus
      if (magic4 === "OggS") {
        const oggMeta = parseOggBuffer(buffer);
        if (oggMeta) {
          return {
            title: oggMeta.title,
            artist: oggMeta.artist,
            album: oggMeta.album,
            date: oggMeta.date,
            coverUrl: oggMeta.coverUrl || (fallbackCover || null),
            format: oggMeta.format || "OGG AUDIO",
          };
        }
      }

      // 6. M4A / MP4
      const mp4Meta = parseMp4Buffer(buffer);
      if (
        mp4Meta &&
        (mp4Meta.coverUrl ||
          (bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70))
      ) {
        return {
          title: mp4Meta.title,
          artist: mp4Meta.artist,
          album: mp4Meta.album,
          date: mp4Meta.date,
          coverUrl: mp4Meta.coverUrl || (fallbackCover || null),
          format: mp4Meta.format || "M4A AAC",
        };
      }
    }

    // Fallback format detection based on file name or MIME type
    const fallbackFormat = detectFormatFromNameOrType(fileName, mimeType);
    return {
      coverUrl: fallbackCover || null,
      format: fallbackFormat,
    };
  } catch (err) {
    console.warn("Could not extract embedded audio metadata:", err);
  }

  const fallbackFormat = detectFormatFromNameOrType(
    typeof source === "string" ? source : source?.name,
    source?.type
  );
  return {
    coverUrl: fallbackCover || null,
    format: fallbackFormat || "AUDIO",
  };
}
