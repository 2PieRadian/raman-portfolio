/**
 * Audio Metadata & Cover Art Extractor
 * Reads embedded metadata and picture blocks directly from FLAC and audio files.
 */

/**
 * Parse FLAC metadata from an ArrayBuffer
 * Reads Vorbis comments (title, artist, album) and Picture Block 6 (embedded cover art)
 * @param {ArrayBuffer} buffer
 * @returns {{ title?: string, artist?: string, album?: string, date?: string, coverUrl?: string, mime?: string }}
 */
export function parseFlacBuffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Check 'fLaC' header
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

    // Check if block fits in the provided buffer
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
      // PICTURE
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
    title: comments.TITLE,
    artist: comments.ARTIST || comments.ALBUMARTIST,
    album: comments.ALBUM,
    date: comments.DATE,
    coverUrl,
    mime: mimeType,
  };
}

/**
 * Parse ID3v2 APIC (Attached picture) frame from MP3
 * @param {ArrayBuffer} buffer
 */
export function parseId3Buffer(buffer) {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Check 'ID3' header
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) {
    return null;
  }

  const version = bytes[3];
  if (version < 3) return null; // ID3v2.3 or 2.4 supported

  // Synchsafe integer tag size
  const tagSize =
    ((bytes[6] & 0x7f) << 21) |
    ((bytes[7] & 0x7f) << 14) |
    ((bytes[8] & 0x7f) << 7) |
    (bytes[9] & 0x7f);

  let offset = 10;
  const maxOffset = Math.min(bytes.length, 10 + tagSize);
  const metadata = {};

  while (offset + 10 < maxOffset) {
    const frameId = String.fromCharCode(
      bytes[offset],
      bytes[offset + 1],
      bytes[offset + 2],
      bytes[offset + 3]
    );

    if (bytes[offset] === 0) break; // Padding reached

    const frameSize =
      version === 4
        ? ((bytes[offset + 4] & 0x7f) << 21) |
          ((bytes[offset + 5] & 0x7f) << 14) |
          ((bytes[offset + 6] & 0x7f) << 7) |
          (bytes[offset + 7] & 0x7f)
        : view.getUint32(offset + 4, false);

    offset += 10; // Skip frame header

    if (offset + frameSize > maxOffset) break;

    if (frameId === "TIT2") {
      metadata.title = decodeTextFrame(bytes.subarray(offset, offset + frameSize));
    } else if (frameId === "TPE1") {
      metadata.artist = decodeTextFrame(bytes.subarray(offset, offset + frameSize));
    } else if (frameId === "TALB") {
      metadata.album = decodeTextFrame(bytes.subarray(offset, offset + frameSize));
    } else if (frameId === "APIC") {
      try {
        let p = offset;
        const encoding = bytes[p++];
        // MIME type is null-terminated ASCII
        let mimeEnd = p;
        while (bytes[mimeEnd] !== 0 && mimeEnd < offset + frameSize) mimeEnd++;
        const mime = new TextDecoder("ascii").decode(bytes.subarray(p, mimeEnd));
        p = mimeEnd + 1;
        const picType = bytes[p++]; // 3 = front cover
        // Description is null-terminated
        if (encoding === 0 || encoding === 3) {
          while (bytes[p] !== 0 && p < offset + frameSize) p++;
          p += 1;
        } else {
          while ((bytes[p] !== 0 || bytes[p + 1] !== 0) && p < offset + frameSize) p += 2;
          p += 2;
        }
        const imgData = bytes.subarray(p, offset + frameSize);
        const blob = new Blob([imgData], { type: mime || "image/jpeg" });
        metadata.coverUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.warn("Error parsing APIC frame:", e);
      }
    }

    offset += frameSize;
  }

  return metadata;
}

function decodeTextFrame(bytes) {
  if (bytes.length < 2) return "";
  const encoding = bytes[0];
  const data = bytes.subarray(1);
  if (encoding === 0) return new TextDecoder("iso-8859-1").decode(data);
  if (encoding === 1) return new TextDecoder("utf-16").decode(data);
  if (encoding === 2) return new TextDecoder("utf-16be").decode(data);
  return new TextDecoder("utf-8").decode(data);
}

/**
 * Extract metadata and embedded cover art directly from an audio URL or File/Blob
 * @param {string | File | Blob} source
 * @param {string} [fallbackCover]
 * @returns {Promise<{ title?: string, artist?: string, album?: string, coverUrl: string }>}
 */
export async function extractAudioMetadata(source, fallbackCover = "") {
  try {
    let buffer;
    if (source instanceof Blob || source instanceof File) {
      // Read the first 2.5MB to extract headers and picture
      const slice = source.slice(0, 2.5 * 1024 * 1024);
      buffer = await slice.arrayBuffer();
    } else if (typeof source === "string") {
      // Fetch the first 2.5MB using HTTP Range
      const res = await fetch(source, {
        headers: { Range: "bytes=0-2621439" },
      });
      buffer = await res.arrayBuffer();
    }

    if (buffer) {
      // Check if FLAC
      const magic = String.fromCharCode(...new Uint8Array(buffer.slice(0, 4)));
      if (magic === "fLaC") {
        const meta = parseFlacBuffer(buffer);
        if (meta.coverUrl) {
          return {
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            coverUrl: meta.coverUrl,
          };
        }
      } else if (magic.startsWith("ID3")) {
        const meta = parseId3Buffer(buffer);
        if (meta?.coverUrl) {
          return {
            title: meta.title,
            artist: meta.artist,
            album: meta.album,
            coverUrl: meta.coverUrl,
          };
        }
      }
    }
  } catch (err) {
    console.warn("Could not extract embedded cover art dynamically:", err);
  }

  return {
    coverUrl: fallbackCover,
  };
}

