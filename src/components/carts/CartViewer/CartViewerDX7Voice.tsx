import React from 'react'
import clsx from 'clsx'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DragNDropContext } from 'components/utility/DragNDropProvider/DragNDropProvider'
import { handleError } from 'core/utils/errorHandling'
import { DX7Voice } from 'core/models/DX7Voice'
import { saveFileAs } from 'core/utils/fileUtils'
import CartItem from '../CartItem/CartItem'
import './CartViewer.scss'

export interface Props extends CartViewerProps {
  cart: DX7VoiceCart
}

interface State {
  editedCart: DX7VoiceCart
  changed: boolean
}

const ACTIONS: WindowAction[] = [
  { id: 'saveAsII', label: 'Save as DX7II voices'},
  { id: 'saveAsI', label: 'Save as DX7 voices'},
  { id: 'sendSysExII', label: 'Send voices SysEx (DX7II)'},
  { id: 'sendSysExI', label: 'Send voices SysEx (DX7)'},
  { id: 'revert', label: 'Revert changes'},
]


/**
 * Renders an editable DX7 voice cart.
 */
export default class CartViewerDX7Voice extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      editedCart: this.props.cart.clone(),
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
      title={<>
        {this.state.changed && <span className="CartViewer__changed">*</span>}
        {file.fileName}
      </>}
      titleExtra={<div className="CartViewer__bankToggle"
        onMouseDown={this.handleBankToggleClick}
        title="Click to toggle DX7II bank"
      >{cart.bank == 0 ? <>1-<br/>32</> : <>33-<br/>64</>}</div>}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      actions={ACTIONS}
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
          dataType="DX7Voice"
          data={voice}
          dragNDropCtx={dragNDropCtx}
          onDrop={this.handleVoiceDrop}
          onEdit={(voice) => this.props.onOpenEditor?.('DX7Voice', voice, this.handleVoiceUpdateFromEditor)}
        />)
      }}</DragNDropContext.Consumer>
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
    if (!this.state.editedCart) return

    if (actionId == 'saveAsI' || actionId == 'saveAsII') {
      let data = actionId == 'saveAsI'
        ? this.state.editedCart.buildCartDX7()
        : this.state.editedCart.buildCartDX7II()

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
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        changed: false,
      })
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
