import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api.js';
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import 'monaco-editor/esm/vs/basic-languages/csharp/csharp.contribution.js';
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution.js';

type MonacoWorkerScope = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: () => Worker;
  };
};

const workerScope = globalThis as MonacoWorkerScope;
workerScope.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

// @monaco-editor/react defaults to jsDelivr. Supplying the bundled module keeps
// the editor and its worker on the application's own origin under the CSP.
loader.config({ monaco: monaco as typeof import('monaco-editor') });
