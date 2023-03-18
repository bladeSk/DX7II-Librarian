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
  editedName: string
  changed: boolean
}

const ACTIONS: WindowAction[] = [
  { id: 'saveAs', label: <>Save as... <i>DX7II performances</i></> },
  { id: 'sendSysEx', label: <>Send SysEx <i>DX7II performances</i></> },
  { id: 'rename', label: 'Rename' },
]

const ACTIONS_CHANGED: WindowAction[] = [
  ...ACTIONS,
  { id: 'store', label: 'Store changes' },
  { id: 'revert', label: 'Revert changes' },
]


/**
 * Renders an editable DX7II performance cart.
 */
export default class CartViewerDX7Performance extends React.PureComponent<Props, State> {
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
      'CartViewerDX7Performance',
      this.props.className,
    )

    return <DraggableWindow
      className={classNames}
      variant="2"
      title={<>
        {this.state.changed && <span className="CartViewer__changed">*</span>}
        {this.state.editedName.replace(/\.syx$/i, '')}
      </>}
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
    let cart = this.state.editedCart
    if (!cart) return

    if (actionId == 'saveAs') {
      let data = cart.buildCart()

      saveFileAs(data, this.state.editedName)
        .then((newFileName) => {
          if (!newFileName) return // aborted

          let newFile: FileWithMeta = {
            ...this.props.file,
            buf: data,
            fileName: newFileName,
            id: `${+new Date()}_0`,
          }

          this.props.onSave?.(this.props.file, newFile)
        })
        .catch(handleError)
    } else if (actionId == 'revert') {
      this.setState({
        editedCart: this.props.cart.clone(),
        editedName: this.props.file.fileName,
        changed: false,
      })
    } else if (actionId == 'sendSysEx') {
      if (!confirm('This will overwrite all the performances in your DX7II memory.\nSend SysEx data?')) return

      try {
        this.props.onSendSysEx?.(cart.buildCart())
      } catch (err) {
        handleError(err)
      }
    } else if (actionId == 'rename') {
      let name = prompt('Rename to', this.props.file.fileName.replace(/\.syx$/i, ''))

      if (!name) return

      this.setState({ editedName: name, changed: true })
    } else if (actionId == 'store') {
      this.props.onSave?.(this.props.file, {
        ...this.props.file,
        fileName: this.state.editedName,
        id: `${+new Date()}_0`,
      })
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
