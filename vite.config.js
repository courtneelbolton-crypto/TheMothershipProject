import { cpSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function copyClassicRuntime() {
  return {
    name: 'copy-classic-runtime',
    closeBundle() {
      const outDir = resolve('dist');
      for (const directory of ['js', 'venue']) {
        const source = resolve(directory);
        const destination = resolve(outDir, directory);
        if (existsSync(source)) cpSync(source, destination, { recursive: true });
      }
    },
  };
}

export default defineConfig({
  plugins: [copyClassicRuntime()],
});
