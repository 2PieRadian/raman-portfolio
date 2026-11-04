/**
 * Audio Metadata & Cover Art Extractor
 * Reads embedded metadata and picture blocks directly from FLAC, MP3 (ID3v2), and M4A/MP4 files.
 */

/**
 * Generate a modern, elegant SVG fallback cover for tracks without embedded artwork.
 * Strictly guarantees that no previous track's artwork is inherited.
 * @param {string} title
 * @param {string} artist
 * @returns {string} Data URI (SVG)
 */
export function createFallbackCover(title = "Soundtrack", artist = "Audio") {
  const cleanTitle = (title || "Soundtrack").slice(0, 22);
  const cleanArtist = (artist || "Local Audio").slice(0, 26);
  const initial = (cleanTitle.charAt(0) || "♪").toUpperCase();

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
    <!-- Decorative badge -->
    <rect x="40" y="40" width="76" height="22" rx="4" fill="#9a7bd3" fill-opacity="0.2" stroke="#9a7bd3" stroke-width="1"/>
    <text x="78" y="55" font-family="'DM Mono', monospace, sans-serif" font-size="10" font-weight="700" fill="#d9cded" text-anchor="middle" letter-spacing="1.5">AUDIO</text>
    <!-- Song Info on bottom of sleeve -->
    <text x="250" y="420" font-family="'Manrope', system-ui, sans-serif" font-size="22" font-weight="800" fill="#f5f0ff" text-anchor="middle">${cleanTitle}</text>
    <text x="250" y="450" font-family="'DM Mono', monospace, sans-serif" font-size="13" font-weight="600" fill="#9a7bd3" text-anchor="middle" letter-spacing="1">${cleanArtist}</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Parse FLAC metadata from an ArrayBuffer
 * Reads Vorbis comments (title, artist, album) and Picture Block 6 (embedded cover art)
 * @param {ArrayBuffer} buffer
 */
export function parseFlacBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

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

    if (blockType === 4) {
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
  };
}

/**
 * Parse ID3v2 metadata & APIC picture frame from MP3 buffer
 * @param {ArrayBuffer} buffer
 */
export function parseId3Buffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

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
 * Parse MP4 / M4A metadata atoms (moov -> udta -> meta -> ilst)
 * @param {ArrayBuffer} buffer
 */
export function parseMp4Buffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);
  const metadata = {};

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
 * Extract metadata and embedded cover art directly from an audio URL or File/Blob
 * @param {string | File | Blob} source
 * @param {string} [fallbackCover]
 * @returns {Promise<{ title?: string, artist?: string, album?: string, date?: string, coverUrl: string | null }>}
 */
export async function extractAudioMetadata(source, fallbackCover = "") {
  try {
    let buffer;
    if (source instanceof Blob || source instanceof File) {
      // Read up to 24MB to ensure high-resolution embedded album arts fit completely
      const slice = source.slice(0, Math.min(source.size, 24 * 1024 * 1024));
      buffer = await slice.arrayBuffer();
    } else if (typeof source === "string") {
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
        };
      }

      // 2. MP3 with ID3v2
      if (magic4.startsWith("ID3") || bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
        const meta = parseId3Buffer(buffer);
        if (meta) {
          return {
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            date: meta.date,
            coverUrl: meta.coverUrl || (fallbackCover || null),
          };
        }
      }

      // Check if ID3 exists at small offset in MP3
      const id3Meta = parseId3Buffer(buffer);
      if (id3Meta && (id3Meta.title || id3Meta.coverUrl)) {
        return {
          title: id3Meta.title,
          artist: id3Meta.artist,
          album: id3Meta.album,
          date: id3Meta.date,
          coverUrl: id3Meta.coverUrl || (fallbackCover || null),
        };
      }

      // 3. M4A / MP4
      const mp4Meta = parseMp4Buffer(buffer);
      if (mp4Meta && mp4Meta.coverUrl) {
        return {
          title: mp4Meta.title,
          artist: mp4Meta.artist,
          album: mp4Meta.album,
          date: mp4Meta.date,
          coverUrl: mp4Meta.coverUrl,
        };
      }
    }
  } catch (err) {
    console.warn("Could not extract embedded cover art dynamically:", err);
  }

  return {
    coverUrl: fallbackCover || null,
  };
}
