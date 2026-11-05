import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const AUDIO_EXTENSIONS = new Set([
  '.mp3',
  '.wav',
  '.flac',
  '.ogg',
  '.m4a',
  '.aac',
  '.opus',
  '.webm',
  '.wma',
  '.aiff',
  '.aif',
  '.alac',
]);

const ACCENTS = ['lime', 'coral', 'lilac'];

function parseTrackFromFile(fileName, index) {
  const ext = path.extname(fileName);
  const base = path.basename(fileName, ext);
  let title = base;
  let artist = 'Original Soundtrack';

  // Check if "Artist - Title" format
  if (base.includes(' - ')) {
    const parts = base.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  const id =
    base
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || `track-${index + 1}`;

  let format = ext.slice(1).toUpperCase();
  if (format === 'WAV') format = 'WAV 16-BIT';
  else if (format === 'FLAC') format = 'FLAC LOSSLESS';
  else if (format === 'MP3') format = 'MP3 AUDIO';

  return {
    id,
    fileName,
    title,
    artist,
    album: `${title.toUpperCase()} · SOUNDTRACK`,
    date: '2026',
    audioSrc: `/music/${encodeURI(fileName)}`,
    accent: ACCENTS[index % ACCENTS.length],
    format,
  };
}

function scanMusicFolder(musicDir) {
  if (!fs.existsSync(musicDir)) {
    return [];
  }
  const entries = fs.readdirSync(musicDir, { withFileTypes: true });
  const audioFiles = entries
    .filter((e) => e.isFile() && AUDIO_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => e.name);

  return audioFiles.map((fileName, idx) => parseTrackFromFile(fileName, idx));
}

function soundtracksPlugin() {
  const virtualModuleId = 'virtual:soundtracks';
  const resolvedVirtualId = '\0' + virtualModuleId;
  let musicDir = '';

  const getTracks = () => {
    const tracks = scanMusicFolder(musicDir);
    try {
      const manifestPath = path.join(musicDir, 'tracks.json');
      fs.writeFileSync(manifestPath, JSON.stringify(tracks, null, 2), 'utf-8');
    } catch (e) {
      // ignore write error if dir is read-only
    }
    return tracks;
  };

  return {
    name: 'vite-plugin-soundtracks',
    configResolved(config) {
      musicDir = path.resolve(config.root, 'public/music');
      if (!fs.existsSync(musicDir)) {
        fs.mkdirSync(musicDir, { recursive: true });
      }
      getTracks();
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualId;
      }
    },
    load(id) {
      if (id === resolvedVirtualId) {
        const tracks = getTracks();
        return `export default ${JSON.stringify(tracks)};`;
      }
    },
    configureServer(server) {
      const onMusicFolderChange = (file) => {
        if (file && file.includes(path.join('public', 'music')) && !file.endsWith('tracks.json')) {
          const mod = server.moduleGraph.getModuleById(resolvedVirtualId);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
            server.ws.send({ type: 'full-reload' });
          }
        }
      };
      server.watcher.on('add', onMusicFolderChange);
      server.watcher.on('unlink', onMusicFolderChange);
      server.watcher.on('change', onMusicFolderChange);

      server.middlewares.use('/api/soundtracks', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(getTracks()));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), soundtracksPlugin()],
});

