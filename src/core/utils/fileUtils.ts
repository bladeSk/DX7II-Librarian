import { saveAs } from 'file-saver'

/**
 * Opens a Save As... dialog for saving a .syx file.
 */
export async function saveFileAs(data: Uint8Array, filename: string): Promise<string> {
  if (!('showSaveFilePicker' in window)) return downloadFile(data, filename)

  let fileHandle = await (window as any).showSaveFilePicker({
    suggestedName: filename,
    types: [{
      description: 'SysEx file',
      accept: { 'application/vnd.sysex': ['.syx' ] },
    }]
  }).catch((err: any) => {
    if (err instanceof DOMException) return undefined // aborted
    throw err
  })

  if (!fileHandle) return '' // aborted

  let writable = await fileHandle.createWritable()
  await writable.write(data.buffer)
  await writable.close()

  let file = await fileHandle.getFile()

  return file.name
}

/**
 * Fallback for older browsers that don't support showSaveFilePicker. Asks for a file name and
 * downloads the file.
 */
function downloadFile(data: Uint8Array, filename: string): string {
  let newFilename = prompt('Modern "Save As" not supported by your browser, the file will be downloaded instead.\nEnter file name:', filename)
  if (!newFilename) return ''
  saveAs(new Blob([data.buffer]), newFilename)

  return newFilename
}
