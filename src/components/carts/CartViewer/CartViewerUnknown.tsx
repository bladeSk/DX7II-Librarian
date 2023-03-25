import React from 'react'
import CartViewerBase, { CartViewerProps } from './CartViewerBase'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import './CartViewer.scss'


const ACTIONS: WindowAction[] = [
  { id: 'rename', label: 'Rename' },
  { id: '---', label: '' },
  { id: 'exportFile', label: 'Export to file...'},
  { id: 'sendSysEx', label: 'Send via MIDI'},
]

const ACTIONS_CHANGED: WindowAction[] = [
  { id: 'save', label: 'Save' },
  { id: 'revert', label: 'Undo all changes' },
  ...ACTIONS,
]

/**
 * Renders a DraggableWindow representing an unknown SysEx.
 */
export default class CartViewerUnknown extends CartViewerBase<null> {
  constructor(props: CartViewerProps<null>) {
    super(props)

    this.state = {
      editedCart: null,
      editedName: this.props.file.fileName,
      changed: false,
    }
  }

  render(): React.ReactElement {
    let file = this.props.file
    let isSysEx = file.buf[0] == 0xf0

    return <DraggableWindow
      className="CartViewer CartViewerUnknown"
      variant='3'
      title={file.fileName}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      actions={isSysEx
        ? (this.state.changed ? ACTIONS_CHANGED : ACTIONS)
        : undefined
      }
      onClose={this.handleClose}
      onMove={this.handleMove}
      onFocus={this.handleFocus}
      onAction={this.handleAction}
    >
      {isSysEx
        ? <>
          <p>Unknown SysEx data ({file.buf.length} B).</p>
          <p>Supported DX7 SysEx file sizes:</p>
          <ul>
            <li>DX7II voices/patches: 21404 B</li>
            <li>DX7 voices/patches: 4104 B</li>
            <li>DX7II performances: 1650 B</li>
            <li>DX7II microtuning data: 274 B</li>
          </ul>
        </>
        : <p>This file does not contain SysEx data.</p>
      }
    </DraggableWindow>
  }

  private handleAction = (actionId: string) => {
    if (actionId == 'exportFile') {
      this.doActionExport(this.props.file.buf)
    } else if (actionId == 'revert') {
      this.setState({
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysEx') {
      if (!confirm(`This will send this unknown SysEx data to your synth. Continue?`)) return

      this.doActionSendSysEx(this.props.file.buf)
    } else if (actionId == 'rename') {
      this.doActionRename()
    } else if (actionId == 'save') {
      this.doActionSave(this.props.file.buf)
    }
  }
}
