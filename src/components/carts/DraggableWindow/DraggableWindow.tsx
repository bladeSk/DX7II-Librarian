import React from 'react'
import clsx from 'clsx'
import MenuSvg from 'assets/icons/menu.svg'
import XSvg from 'assets/icons/x.svg'
import './DraggableWindow.scss'

export interface Props {
  className?: string
  children?: React.ReactNode
  title?: React.ReactNode
  actions?: WindowAction[]
  titleExtra?: React.ReactNode
  xPos?: number
  yPos?: number
  zIndex?: number
  variant?: '1' | '2' | '3' | '4'
  onAction?: (actionId: string) => void
  onFocus?: () => void
  onMove?: (xPos: number, yPos: number) => void
  onClose?: () => void
}

interface State {
  actionsOpen: boolean
}

export interface WindowAction {
  id: string
  label: React.ReactNode
}

/**
 * Draggable container.
 */
export default class DraggableWindow extends React.PureComponent<Props, State> {
  private ref = React.createRef<HTMLDivElement>()
  private dragStartPos?: [number, number]
  private curDragPos?: [number, number]
  private elmPos: [number, number]

  private static defaultProps: Partial<Props> = {
    variant: '1',
  }

  constructor(props: Props) {
    super(props)

    this.state = {
      actionsOpen: false,
    }

    this.elmPos = [ props.xPos || 0, props.yPos || 0 ]
  }

  componentDidMount(): void {
    this.updatePos()
    document.addEventListener('mousedown', this.handleDocumentMouseDown, true)
    document.addEventListener('mousemove', this.handleDocumentMouseMove)
    document.addEventListener('mouseup', this.handleDocumentMouseUp)
  }

  componentDidUpdate(prevProps: Props, prevState: State): void {
    if (this.elmPos[0] != this.props.xPos || this.elmPos[1] != this.props.yPos) {
      this.elmPos = [ this.props.xPos || 0, this.props.yPos || 0 ]
      this.updatePos()
    }

    if (this.props.zIndex != prevProps.zIndex) {
      this.updatePos()
    }
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown, true)
    document.removeEventListener('mousemove', this.handleDocumentMouseMove)
    document.removeEventListener('mouseup', this.handleDocumentMouseUp)
  }

  render(): React.ReactElement {
    let classNames = clsx(
      'DraggableWindow',
      this.state.actionsOpen && 'DraggableWindow_actionsOpen',
      `DraggableWindow_variant${this.props.variant}`,
      this.props.className
    )

    return <div
      className={classNames}
      ref={this.ref}
      onMouseDownCapture={this.handleWindowMouseDownCapture}
    >
      <div className="DraggableWindow__header" onMouseDown={this.handleHeaderMouseDown}>
        {this.props.actions && <div className="DraggableWindow__actions">
          <MenuSvg
            className="DraggableWindow__actionsIcon"
            onMouseDown={this.handleMenuClick}
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />

          <div className="DraggableWindow__actionsDropdown">
            {this.props.actions.map((action, i) => <div
              className="DraggableWindow__action"
              key={i}
              onMouseDown={e => this.handleActionClick(e, action.id)}
            >{action.label}</div>)}
          </div>
        </div>}

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

  private handleDocumentMouseDown = (e: MouseEvent) => {
    if (!this.state.actionsOpen || !this.ref.current) return

    if (this.ref.current.querySelector('.DraggableWindow__actions')?.contains(e.target as any)) return

    this.setState({ actionsOpen: false })
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

  private handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let actionsOpen = !this.state.actionsOpen
    this.setState({ actionsOpen })
  }

  private handleCloseClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    this.props.onClose?.()
  }

  private handleActionClick(e: React.MouseEvent, actionId: string) {
    e.preventDefault()
    e.stopPropagation()
    this.props.onAction?.(actionId)
    this.setState({ actionsOpen: false })
  }
}
