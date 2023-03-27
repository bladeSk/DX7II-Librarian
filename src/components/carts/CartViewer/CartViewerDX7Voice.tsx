import React from 'react'
import clsx from 'clsx'
import CartViewerBase, { CartViewerProps } from './CartViewerBase'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DragNDropContext } from 'components/utility/DragNDropProvider/DragNDropProvider'
import { DX7Voice } from 'core/models/DX7Voice'
import CartItem from '../CartItem/CartItem'
import './CartViewer.scss'

const ACTIONS: WindowAction[] = [
  { id: 'rename', label: 'Rename' },
  { id: '---', label: '' },
  { id: 'exportFileII', label: <>Export to file... <i>DX7II</i></> },
  { id: 'exportFileI', label: <>Export to file... <i>DX7</i></> },
  { id: 'sendSysExII', label: <>Send via MIDI <i>DX7II voices</i></> },
  { id: 'sendSysExI', label: <>Send via MIDI <i>DX7 voices</i></> },
]

const ACTIONS_CHANGED: WindowAction[] = [
  { id: 'save', label: 'Save' },
  { id: 'revert', label: 'Undo all changes' },
  ...ACTIONS,
]

/**
 * Renders a window with an editable DX7 voice cart.
 */
export default class CartViewerDX7Voice extends CartViewerBase<DX7VoiceCart> {
  constructor(props: CartViewerProps<DX7VoiceCart>) {
    super(props)

    this.state = {
      editedCart: this.props.cart.clone(),
      editedName: this.props.file.fileName,
      changed: false,
    }
  }

  render(): React.ReactElement {
    let file = this.props.file
    let cart = this.state.editedCart
    let classNames = clsx(
      'CartViewer',
      'CartViewerDX7Voice',
      this.props.className,
    )

    return <DraggableWindow
      className={classNames}
      title={this.getTitle()}
      titleExtra={<div className="CartViewer__bankToggle"
        onMouseDown={this.handleBankToggleClick}
        title="Click to toggle DX7II bank"
      >{cart.bank == 0 ? <>1-<br/>32</> : <>33-<br/>64</>}</div>}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      actions={this.state.changed ? ACTIONS_CHANGED : ACTIONS}
      onClose={this.handleClose}
      onMove={this.handleMove}
      onFocus={this.handleFocus}
      onAction={this.handleAction}
    >
      <DragNDropContext.Consumer>{(dragNDropCtx) => {
        return cart.voices.map((voice, i) => <CartItem
          key={i}
          index={i}
          number={cart.bank * 32 + i + 1}
          name={voice.name}
          isDX7II={voice.version == 2}
          isEmpty={voice.name == 'INIT VOICE'}
          dataType="DX7Voice"
          data={voice}
          dragNDropCtx={dragNDropCtx}
          selected={voice == this.props.currentSelection}
          onDrop={this.handleVoiceDrop}
          onEdit={(voice) => this.props.onOpenEditor?.('DX7Voice', voice, this.handleVoiceUpdateFromEditor)}
        />)
      }}</DragNDropContext.Consumer>
    </DraggableWindow>
  }

  private handleAction = (actionId: string) => {
    let cart = this.state.editedCart
    if (!cart) return

    if (actionId == 'exportFileI' || actionId == 'exportFileII') {
      let data = actionId == 'exportFileI' ? cart.buildCartDX7() : cart.buildCartDX7II()

      this.doActionExport(data)
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysExI') {
      if (!confirm('This will overwrite all the voices in your DX7 memory.\nSend SysEx data?')) return

      this.doActionSendSysEx(cart.buildCartDX7())
    } else if (actionId == 'sendSysExII') {
      if (!confirm(`This will overwrite voices in the ${cart.bank == 0 ? '1-32' : '33-64'} block of your DX7II memory.\nSend SysEx data?`)) return

      this.doActionSendSysEx(cart.buildCartDX7II())
    } else if (actionId == 'rename') {
      this.doActionRename()
    } else if (actionId == 'save') {
      this.doActionSave(cart.buildCartDX7II())
    }
  }

  private handleVoiceDrop = (voice: DX7Voice, index: number, where: 'before' | 'on') => {
    if (where == 'before') {
      this.setState({
        editedCart: this.state.editedCart!.clone().insertVoiceAt(voice, index),
        changed: true,
      })
    } else if (where == 'on') {
      this.setState({
        editedCart: this.state.editedCart!.clone().replaceVoiceAt(voice, index),
        changed: true,
      })
    }
  }

  private handleBankToggleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!this.state.editedCart) return

    this.setState({
      editedCart: this.state.editedCart.clone().setBank(this.state.editedCart.bank ? 0 : 1),
      changed: true,
    })
  }

  private handleVoiceUpdateFromEditor = (oldVoice: DX7Voice, newVoice: DX7Voice) => {
    if (!this.state.editedCart?.voices.includes(oldVoice)) return

    this.setState({
      editedCart: this.state.editedCart!.clone().replaceVoice(oldVoice, newVoice),
      changed: true,
    })
  }
}
