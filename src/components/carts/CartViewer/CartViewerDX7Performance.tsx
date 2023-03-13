import React from 'react'
import clsx from 'clsx'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DragNDropContext } from 'components/utility/DragNDropProvider/DragNDropProvider'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'
import CartItem from '../CartItem/CartItem'
import { DX7Performance } from 'core/models/DX7Performance'
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
      title={<>
        {this.state.changed && <span className="CartViewer__changed">*</span>}
        {file.fileName.replace(/\.syx$/, '')}
      </>}
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
        return cart.perfs.map((perf, i) => <CartItem
          key={i}
          index={i}
          number={i + 1}
          name={perf.name}
          dataType="DX7Perf"
          data={perf}
          dragNDropCtx={dragNDropCtx}
          onDrop={this.handlePerfDrop}
          onEdit={(perf) => this.props.onOpenEditor?.('DX7Perf', perf, this.handlePerfUpdateFromEditor)}
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
    } else if (actionId == 'sendSysEx') {
      let data = this.state.editedCart.buildCart()

      try {
        this.props.onSendSysEx?.(data)
      } catch (err) {
        handleError(err)
      }
    }
  }

  private handlePerfDrop = (perf: DX7Performance, index: number, where: 'before' | 'on') => {
    if (where == 'before') {
      this.setState({
        editedCart: this.state.editedCart!.clone().insertPerfAt(perf, index),
        changed: true,
      })
    } else if (where == 'on') {
      this.setState({
        editedCart: this.state.editedCart!.clone().replacePerfAt(perf, index),
        changed: true,
      })
    }
  }

  private handlePerfUpdateFromEditor = (oldPerf: DX7Performance, newPerf: DX7Performance) => {
    if (!this.state.editedCart?.perfs.includes(oldPerf)) return

    this.setState({
      editedCart: this.state.editedCart!.clone().replacePerf(oldPerf, newPerf),
      changed: true,
    })
  }
}
