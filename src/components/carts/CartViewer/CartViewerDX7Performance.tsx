import React from 'react'
import clsx from 'clsx'
import CartViewerBase, { CartViewerProps } from './CartViewerBase'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { DragNDropContext } from 'components/utility/DragNDropProvider/DragNDropProvider'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import CartItem from '../CartItem/CartItem'
import { DX7Performance } from 'core/models/DX7Performance'
import './CartViewer.scss'


const ACTIONS: WindowAction[] = [
  { id: 'rename', label: 'Rename' },
  { id: '---', label: '' },
  { id: 'exportFile', label: <>Export to file... <i>DX7II performances</i></> },
  { id: 'sendSysEx', label: <>Send via MIDI <i>DX7II performances</i></> },
]

const ACTIONS_CHANGED: WindowAction[] = [
  { id: 'save', label: 'Save' },
  { id: 'revert', label: 'Undo all changes' },
  ...ACTIONS,
]

/**
 * Renders a window with an editable DX7II performance cart.
 */
export default class CartViewerDX7Performance extends CartViewerBase<DX7PerfCart> {
  constructor(props: CartViewerProps<DX7PerfCart>) {
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
      'CartViewerDX7Performance',
      this.props.className,
    )

    return <DraggableWindow
      className={classNames}
      variant="2"
      title={this.getTitle()}
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
        return cart.perfs.map((perf, i) => <CartItem
          key={i}
          index={i}
          number={i + 1}
          name={perf.name}
          dataType="DX7Perf"
          data={perf}
          dragNDropCtx={dragNDropCtx}
          selected={perf == this.props.currentSelection}
          onDrop={this.handlePerfDrop}
          onEdit={(perf) => this.props.onOpenEditor?.('DX7Perf', perf, this.handlePerfUpdateFromEditor)}
        />)
      }}</DragNDropContext.Consumer>
    </DraggableWindow>
  }

  private handleAction = (actionId: string) => {
    let cart = this.state.editedCart
    if (!cart) return

    if (actionId == 'exportFile') {
      this.doActionExport(cart.buildCart())
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysEx') {
      if (!confirm('This will overwrite all the performances in your DX7II memory.\nSend SysEx data?')) return

      this.doActionSendSysEx(cart.buildCart())
    } else if (actionId == 'rename') {
      this.doActionRename()
    } else if (actionId == 'save') {
      this.doActionSave(cart.buildCart())
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
