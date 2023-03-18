import React from 'react'
import clsx from 'clsx'
import XSvg from 'assets/icons/x.svg'
import MenuButton, { MenuButtonAction } from 'components/basic/MenuButton/MenuButton'
import './DraggableWindow.scss'

export interface Props<Taction = any> {
  className?: string
  children?: React.ReactNode
  title?: React.ReactNode
  actions?: MenuButtonAction<Taction>[]
  titleExtra?: React.ReactNode
  xPos?: number
  yPos?: number
  zIndex?: number
  variant?: '1' | '2' | '3' | '4'
  onAction?: (actionId: Taction) => void
  onFocus?: () => void
  onMove?: (xPos: number, yPos: number) => void
  onClose?: () => void
}

export type WindowAction<T = any> = MenuButtonAction<T>

interface State {
}

/**
 * Draggable container.
 */
export default class DraggableWindow<Taction> extends React.PureComponent<Props<Taction>, State> {
  private ref = React.createRef<HTMLDivElement>()
  private dragStartPos?: [number, number]
  private curDragPos?: [number, number]
  private elmPos: [number, number]

  static defaultProps: Partial<Props> = {
    variant: '1',
  }

  constructor(props: Props<Taction>) {
    super(props)

    this.state = {
      actionsOpen: false,
    }

    this.elmPos = [ props.xPos || 0, props.yPos || 0 ]
  }

  componentDidMount(): void {
    this.updatePos()
    document.addEventListener('mousemove', this.handleDocumentMouseMove)
    document.addEventListener('mouseup', this.handleDocumentMouseUp)
  }

  componentDidUpdate(prevProps: Props<Taction>, prevState: State): void {
    if (this.elmPos[0] != this.props.xPos || this.elmPos[1] != this.props.yPos) {
      this.elmPos = [ this.props.xPos || 0, this.props.yPos || 0 ]
      this.updatePos()
    }

    if (this.props.zIndex != prevProps.zIndex) {
      this.updatePos()
    }
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousemove', this.handleDocumentMouseMove)
    document.removeEventListener('mouseup', this.handleDocumentMouseUp)
  }

  render(): React.ReactElement {
    let classNames = clsx(
      'DraggableWindow',
      `DraggableWindow_variant${this.props.variant}`,
      this.props.className
    )

    return <div
      className={classNames}
      ref={this.ref}
      onMouseDownCapture={this.handleWindowMouseDownCapture}
    >
      <div className="DraggableWindow__header" onMouseDown={this.handleHeaderMouseDown}>
        {this.props.actions && <MenuButton className="DraggableWindow__actions"
          hAlign="l"
          variant={this.props.variant}
          actions={this.props.actions}
          onAction={this.props.onAction}
        />}

        <div className="DraggableWindow__title">{this.props.title}</div>
        {this.props.titleExtra && <div className="DraggableWindow__titleExtra">{this.props.titleExtra}</div>}

        <div className="DraggableWindow__close"
          onMouseDown={this.handleCloseClick}
        ><XSvg /></div>
      </div>

      <div className="DraggableWindow__content">
        {this.props.children}
      </div>
    </div>
  }

  private updatePos() {
    if (!this.ref.current) return

    let x = this.elmPos[0]
    let y = this.elmPos[1]

    if (this.dragStartPos && this.curDragPos) {
      x = Math.max(0, this.elmPos[0] + this.curDragPos[0] - this.dragStartPos[0])
      y = Math.max(0, this.elmPos[1] + this.curDragPos[1] - this.dragStartPos[1])
    }

    this.ref.current.style.left = `${x}px`
    this.ref.current.style.top = `${y}px`
    this.ref.current.style.zIndex = `${this.props.zIndex || ''}`
  }

  private handleHeaderMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    this.dragStartPos = [ e.pageX, e.pageY ]
    this.curDragPos = [ e.pageX, e.pageY ]
  }

  private handleWindowMouseDownCapture = (e: React.MouseEvent) => {
    this.props.onFocus?.()
  }

  private handleDocumentMouseMove = (e: MouseEvent) => {
    if (!this.dragStartPos) return

    this.curDragPos = [ e.pageX, e.pageY ]

    this.updatePos()
  }

  private handleDocumentMouseUp = (e: MouseEvent) => {
    if (!this.dragStartPos || !this.curDragPos) return

    this.elmPos[0] += this.curDragPos[0] - this.dragStartPos[0]
    this.elmPos[1] += this.curDragPos[1] - this.dragStartPos[1]

    this.dragStartPos = undefined
    this.curDragPos = undefined

    this.updatePos()
    this.props.onMove?.(Math.max(0, this.elmPos[0]), Math.max(0, this.elmPos[1]))
  }

  private handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.onClose?.()
  }
}
