import React from 'react'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DX7Microtuning } from 'core/models/DX7Microtuning'
import CartViewerBase, { CartViewerProps } from './CartViewerBase'
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
 * Renders a window for DX7II microtuning.
 */
export default class CartViewerDX7Microtuning extends CartViewerBase<DX7Microtuning> {
  constructor(props: CartViewerProps<DX7Microtuning>) {
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
      title={this.getTitle()}
      titleExtra={<div className="CartViewer__bankToggle"
        onMouseDown={this.handleSlotToggleClick}
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

  private handleSlotToggleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!this.state.editedCart) return

    this.setState({
      editedCart: this.state.editedCart.clone().setSlot(this.state.editedCart.slot ? 0 : 1),
      changed: true,
    })
  }

  private handleAction = (actionId: string) => {
    let mct = this.state.editedCart
    if (!mct) return

    if (actionId == 'exportFile') {
      this.doActionExport(mct.buildSysex())
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysEx') {
      if (!confirm(`This will overwrite user microtuning slot ${mct.slot + 1} in your DX7II memory.\nSend SysEx data?`)) return

      this.doActionSendSysEx(mct.buildSysex())
    } else if (actionId == 'rename') {
      this.doActionRename()
    } else if (actionId == 'save') {
      this.doActionSave(mct.buildSysex())
    }
  }
}
