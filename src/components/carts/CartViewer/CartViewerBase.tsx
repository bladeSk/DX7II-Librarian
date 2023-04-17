import React from 'react'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'


export interface CartViewerProps<T> {
  cart: T
  className?: string
  file: FileWithMeta
  currentSelection?: any //same as onOpenEditor['data']
  onSave?: (oldFile: FileWithMeta, newFile: FileWithMeta) => void
  onClose: (file: FileWithMeta) => void
  onFocus?: (file: FileWithMeta) => void
  onPosChanged?: (file: FileWithMeta, xPos: number, yPos: number) => void
  onOpenEditor?: (
    type: string,
    data: any,
    onDataChange: (oldData: any, newData: any) => void,
  ) => void
  onSendSysEx?: (data: Uint8Array) => Promise<void>,
}

export interface CartViewerState<T> {
  editedCart: T
  editedName: string
  changed: boolean
}

export interface FileWithMeta {
  fileName: string
  buf: Uint8Array
  xPos: number
  yPos: number
  id: string
  zIndex: number
  origin?: 'file' | 'midi' | 'user'
}

/**
 * Common base for all the CartViewers. Defines common props, state and provides shared handlers
 * and methods.
 */
export default abstract class CartViewerBase<
  T = null, State extends CartViewerState<T> = CartViewerState<T>
> extends React.PureComponent<
  CartViewerProps<T>, State
> {
  protected handleClose = () => {
    if (this.state.changed) {
      if (!confirm('Close cartridge and discard all changes?')) return
    } else if (this.props.file.origin == 'midi' || this.props.file.origin == 'user') {
      if (!confirm('Close cartridge?')) return
    }

    this.props.onClose(this.props.file)
  }

  protected handleMove = (xPos: number, yPos: number) => {
    this.props.onPosChanged?.(this.props.file, xPos, yPos)
  }

  protected handleFocus = () => {
    this.props.onFocus?.(this.props.file)
  }

  protected getTitle(): React.ReactNode {
    return <>
      {this.state.changed && <span className="CartViewer__changed" title="Unsaved changes">●</span>}
      {this.state.editedName.replace(/\.syx$/i, '')}
    </>
  }

  protected doActionExport(data: Uint8Array) {
    saveFileAs(data, this.props.file.fileName)
      .then((newFileName) => {
        if (!newFileName) return // aborted

        if (!this.state.changed) { // change the cart origin to "file" - the user has the exact copy on disk
          this.props.onSave?.(this.props.file, {
            ...this.props.file,
            origin: 'file',
            id: `${+new Date()}_0`,
          })
        }

        if (confirm('Replace cart with exported file?')) {
          let newFile: FileWithMeta = {
            ...this.props.file,
            buf: data,
            fileName: newFileName,
            origin: 'file',
            id: `${+new Date()}_0`,
          }

          this.props.onSave?.(this.props.file, newFile)
        }
      })
      .catch(handleError)
  }

  protected doActionSendSysEx(data: Uint8Array) {
    this.props.onSendSysEx?.(data).catch(handleError)
  }

  protected doActionSave(data: Uint8Array) {
    this.props.onSave?.(this.props.file, {
      ...this.props.file,
      fileName: this.state.editedName,
      buf: data,
      origin: 'user',
      id: `${+new Date()}_0`,
    })
  }

  protected doActionRename() {
    let name = prompt('Rename to', this.state.editedName.replace(/\.syx$/i, ''))

    if (!name) return

    this.setState({ editedName: name, changed: true })
  }
}
