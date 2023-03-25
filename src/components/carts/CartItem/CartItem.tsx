import React from 'react'
import clsx from 'clsx'
import DragIndicatorSvg from 'assets/icons/drag_indicator.svg'
import IISvg from 'assets/icons/II.svg'
import { DragNDropData } from 'components/utility/DragNDropProvider/DragNDropProvider'
import './CartItem.scss'

export interface Props<T = any> {
  className?: string
  name: string
  isDX7II?: boolean
  index: number
  number: number
  dataType: string
  data: T
  dragNDropCtx: DragNDropData
  selected?: boolean
  onDrop: (dropData: T, index: number, where: 'before' | 'on') => void
  onEdit: (data: T) => void
}

interface State {
  draggingOverBefore: boolean
  draggingOverItem: boolean
  isDragged: boolean
}

/**
 * Represents a single cart item (voice/performance/etc.) that can be dragged and edited.
 */
export default class CartItem<T = any> extends React.PureComponent<Props<T>, State> {
  constructor(props: Props) {
    super(props)

    this.state = {
      draggingOverBefore: false,
      draggingOverItem: false,
      isDragged: false,
    }
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (
      this.props.dragNDropCtx.type != this.props.dataType &&
      (this.state.draggingOverBefore || this.state.draggingOverItem)
    ) {
      this.setState({
        draggingOverBefore: false,
        draggingOverItem: false,
      })
    }
  }

  render(): React.ReactElement {
    let { dataType, data, dragNDropCtx, onDrop, index, selected } = this.props
    let { draggingOverBefore, draggingOverItem, isDragged } = this.state

    let classNames = clsx(
      'CartItem',
      isDragged && 'CartItem_dragged',
      selected && 'CartItem_selected',
      this.props.className
    )

    return <div
      className={classNames}
      draggable
      onClick={this.handleEditClick}
      onDragStart={() => {
        dragNDropCtx.setData(this.props.dataType, this.props.data)
        setTimeout(() => this.setState({ isDragged: true })) // setTimeout ensures the preview is not greyed out
      }}
      onDragEnd={() => {
        dragNDropCtx.clearData()
        setTimeout(() => this.setState({ isDragged: false }))
      }}
    >
      <div className="CartItem__dragHint">
        <DragIndicatorSvg className="CartItem__dragIndicator" />

        <span className="CartItem__number">{this.props.number}</span>
      </div>

      <div className="CartItem__name">{this.props.name}</div>

      {this.props.isDX7II && <span className="CartItem__dx7ii" title="Uses DX7II features"><IISvg /></span>}

      {dragNDropCtx.type == dataType && dragNDropCtx.data != data && <>
        <div className={clsx('CartItem__dragAreaBefore', draggingOverBefore && 'CartItem__dragAreaBefore_active')}
          onDragEnter={() => this.setState({ draggingOverBefore: true })}
          onDragLeave={() => this.setState({ draggingOverBefore: false })}
          onDrop={() => {
            onDrop(dragNDropCtx.data, index, 'before')
            dragNDropCtx.clearData()
          }}
        />

        <div className={clsx('CartItem__dragAreaItem', draggingOverItem && 'CartItem__dragAreaItem_active')}
          onDragEnter={() => this.setState({ draggingOverItem: true })}
          onDragLeave={() => this.setState({ draggingOverItem: false })}
          onDrop={() => {
            onDrop(dragNDropCtx.data, index, 'on')
            dragNDropCtx.clearData()
          }}
        />
      </>}
    </div>
  }

  private handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.onEdit(this.props.data)
  }
}
