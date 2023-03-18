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
  editedName: string
  changed: boolean
}

const ACTIONS: WindowAction[] = [
  { id: 'rename', label: 'Rename' },
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
 * Renders an editable DX7 voice cart.
 */
export default class CartViewerDX7Voice extends React.PureComponent<Props, State> {
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
        {this.state.editedName.replace(/\.syx$/i, '')}
      </>}
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
    if (this.state.changed) {
      if (!confirm('Close cartridge and discard all changes?')) return
    } else if (this.props.file.origin == 'midi' || this.props.file.origin == 'user') {
      if (!confirm('Close cartridge?')) return
    }

    this.props.onClose(this.props.file)
  }

  private handleMove = (xPos: number, yPos: number) => {
    this.props.onPosChanged?.(this.props.file, xPos, yPos)
  }

  private handleFocus = () => {
    this.props.onFocus?.(this.props.file)
  }

  private handleAction = (actionId: string) => {
    let cart = this.state.editedCart
    if (!cart) return

    if (actionId == 'exportFileI' || actionId == 'exportFileII') {
      let data = actionId == 'exportFileI' ? cart.buildCartDX7() : cart.buildCartDX7II()

      saveFileAs(data, this.state.editedName)
        .then((newFileName) => {
          if (!newFileName) return // aborted

          if (!this.state.changed) { // change the cart origin to "file" - the user has the exact copy on disk
            this.props.onSave?.(this.props.file, {
              ...this.props.file,
              origin: 'file',
              id: `${+new Date()}_0`,
            })
          }

          // old "save as" logic - replaces the open cart with saved file - might use this in Electron app
          // let newFile: FileWithMeta = {
          //   ...this.props.file,
          //   buf: data,
          //   fileName: newFileName,
          //   id: `${+new Date()}_0`,
          // }

          // this.props.onSave?.(this.props.file, newFile)
        })
        .catch(handleError)
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysExI') {
      if (!confirm('This will overwrite all the voices in your DX7 memory.\nSend SysEx data?')) return

      try {
        this.props.onSendSysEx?.(cart.buildCartDX7())
      } catch (err) {
        handleError(err)
      }
    } else if (actionId == 'sendSysExII') {
      if (!confirm(`This will overwrite voices in the ${cart.bank == 0 ? '1-32' : '33-64'} block of your DX7II memory.\nSend SysEx data?`)) return

      try {
        this.props.onSendSysEx?.(cart.buildCartDX7II())
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
        buf: cart.buildCartDX7II(),
        origin: 'user',
        id: `${+new Date()}_0`,
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
