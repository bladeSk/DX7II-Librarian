import React from 'react'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'
import './CartViewer.scss'

interface State {
}

const ACTIONS: WindowAction[] = [
  { id: 'saveAs', label: 'Save as'},
  { id: 'sendSysEx', label: 'Send performance SysEx'},
]


/**
 * Renders a DraggableWindow representing an unknown SysEx.
 */
export default class CartViewerUnknown extends React.PureComponent<CartViewerProps, State> {
  constructor(props: CartViewerProps) {
    super(props)

    this.state = {
    }
  }

  render(): React.ReactElement {
    let file = this.props.file

    return <DraggableWindow
      className="CartViewer CartViewerUnknown"
      variant='3'
      title={file.fileName}
      xPos={file.xPos}
      yPos={file.yPos}
      actions={ACTIONS}
      onClose={this.handleClose}
      onMove={this.handleMove}
      onFocus={this.handleFocus}
      onAction={this.handleAction}
    >
      <p>Unknown SysEx data ({file.buf.length} B).</p>
      <p>DX7 SysEx lengths:</p>
      <ul>
        <li>DX7II voices/patches: 21404 B</li>
        <li>DX7 voices/patches: 4104 B</li>
        <li>DX7II performances: 1650 B</li>
      </ul>
    </DraggableWindow>
  }

  private handleClose = () => {
    this.props.onClose(this.props.file)
  }

  private handleMove = (xPos: number, yPos: number) => {
    this.props.onPosChanged?.(this.props.file, xPos, yPos)
  }

  private handleFocus = () => {
    this.props.onFocus?.(this.props.file)
  }

  private handleAction = (actionId: string) => {
    if (actionId == 'saveAs') {
      let data = this.props.file.buf

      saveFileAs(data, this.props.file.fileName)
        .then((newFileName) => {
          if (!newFileName) return // aborted

          let newFile: FileWithMeta = {
            ...this.props.file,
            buf: data,
            fileName: newFileName,
            id: `${+new Date()}_0`,
          }

          this.props.onSavedAs?.(this.props.file, newFile)
        })
        .catch(handleError)
    }
  }
}
