import React from 'react'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'
import { DX7Microtuning } from 'core/models/DX7Microtuning'
import './CartViewer.scss'

export interface Props extends CartViewerProps {
  cart: DX7Microtuning
}


interface State {
  editedCart: DX7Microtuning
  editedName: string
  changed: boolean
}

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
export default class CartViewerDX7Microtuning extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      editedCart: this.props.cart.clone(),
      editedName: this.props.file.fileName,
      changed: false,
    }
  }

  render(): React.ReactElement {
    let file = this.props.file
    let mct = this.state.editedCart

    return <DraggableWindow
      className="CartViewer CartViewerMicrotuning"
      variant='4'
      title={<>
        {this.state.changed && <span className="CartViewer__changed" title="Unsaved changes">●</span>}
        {this.state.editedName.replace(/\.syx$/i, '')}
      </>}
      titleExtra={<div className="CartViewer__bankToggle"
        onMouseDown={this.handleBankToggleClick}
        title="Click to toggle slot"
      >{mct.slot == 0 ? <>Slot<br/>1</> : <>Slot<br/>2</>}</div>}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      actions={this.state.changed ? ACTIONS_CHANGED : ACTIONS}
      onClose={this.handleClose}
      onMove={this.handleMove}
      onFocus={this.handleFocus}
      onAction={this.handleAction}
    >
      DX7II Microtuning Data
    </DraggableWindow>
  }

  private handleBankToggleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!this.state.editedCart) return

    this.setState({
      editedCart: this.state.editedCart.clone().setSlot(this.state.editedCart.slot ? 0 : 1),
      changed: true,
    })
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
    let mct = this.state.editedCart
    if (!mct) return

    if (actionId == 'exportFile') {
      let data = mct.buildSysex()

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
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysEx') {
      try {
        this.props.onSendSysEx?.(this.props.file.buf)
      } catch (err) {
        handleError(err)
      }
    } else if (actionId == 'rename') {
      let name = prompt('Rename to', this.props.file.fileName.replace(/\.syx$/i, ''))

      if (!name) return

      this.setState({ editedName: name, changed: true })
    } else if (actionId == 'save') {
      this.props.onSave?.(this.props.file, {
        ...this.props.file,
        fileName: this.state.editedName,
        buf: mct.buildSysex(),
        origin: 'user',
        id: `${+new Date()}_0`,
      })
    }
  }
}
