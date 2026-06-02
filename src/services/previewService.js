import { getFile } from './fileService.js';

const previewModes = {
  pdf: 'native-pdf-preview',
  docx: 'document-conversion-preview',
  xlsx: 'spreadsheet-preview',
  markdown: 'text-preview',
  image: 'image-preview',
  video: 'streaming-preview'
};

export function getPreview(state, fileId) {
  const file = getFile(state, fileId);
  if (!file) return null;
  const mode = previewModes[file.type] ?? 'download-only';
  return {
    fileId,
    fileName: file.name,
    mode,
    supported: mode !== 'download-only',
    message: mode === 'download-only' ? 'Preview is not supported for this file type yet.' : `Ready with ${mode}.`
  };
}
