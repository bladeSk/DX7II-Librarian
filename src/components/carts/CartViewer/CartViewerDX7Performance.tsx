import React from 'react'
import clsx from 'clsx'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DragNDropContext } from 'components/utility/DragNDropProvider/DragNDropProvider'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'
import CartItem from '../CartItem/CartItem'
import './CartViewer.scss'

export interface Props extends CartViewerProps {
  cart: DX7PerfCart
}

interface State {
  editedCart: DX7PerfCart
  changed: boolean
}

const ACTIONS: WindowAction[] = [
  { id: 'saveAs', label: 'Save as'},
  { id: 'sendSysEx', label: 'Send performance SysEx'},
  { id: 'revert', label: 'Revert changes'},
]


/**
 * Renders an editable DX7II performance cart.
 */
export default class CartViewerDX7Performance extends React.PureComponent<Props, State> {
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
      'CartViewerDX7Performance',
      this.props.className,
    )

    return <DraggableWindow
      className={classNames}
      variant="2"
      title={file.fileName}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      actions={ACTIONS}
      onClose={this.handleClose}
      onMove={this.handleMove}
      onFocus={this.handleFocus}
      onAction={this.handleAction}
    >
      {cart.perfs.map((perf, i) => <div key={i}>
        {perf.name}
      </div>)}
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

    if (actionId == 'saveAs') {
      let data = this.state.editedCart.buildCart()

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
        editedCart: this.props.cart,
        changed: false,
      })
    }
  }
}
