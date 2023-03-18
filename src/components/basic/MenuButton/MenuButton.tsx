import React from 'react'
import clsx from 'clsx'
import MenuSvg from 'assets/icons/menu.svg'
import './MenuButton.scss'

export interface Props<T = any> {
  className?: string
  children?: React.ReactNode
  actions: MenuButtonAction<T>[]
  hAlign?: 'l' | 'r'
  variant?: 'normal' | '1' | '2' | '3' | '4'
  onAction: (id: T) => void
}

interface State {
  open?: boolean
}

export interface MenuButtonAction<T = any> {
  id: T
  label: React.ReactNode
}

/**
 * Button that spawns a menu dropdown with actions.
 */
export default class MenuButton<T> extends React.PureComponent<Props<T>, State> {
  private ref = React.createRef<HTMLDivElement>()
  static defaultProps: Partial<Props> = {
    hAlign: 'l',
    variant: 'normal',
    children: <MenuSvg />,
  }

  constructor(props: Props<T>) {
    super(props)

    this.state = {}
  }

  componentDidMount(): void {
    document.addEventListener('mousedown', this.handleDocumentMouseDown, true)
  }

  componentWillUnmount(): void {
    document.removeEventListener('mousedown', this.handleDocumentMouseDown, true)
  }

  render(): React.ReactElement {
    let classNames = clsx(
      'MenuButton',
      `MenuButton_hAlign${this.props.hAlign}`,
      `MenuButton_variant${this.props.variant}`,
      this.state.open && 'MenuButton_open',
      this.props.className,
    )

    return <div className={classNames} onClick={this.handleMenuClick} ref={this.ref}>
      <div className="MenuButton__label">
        {this.props.children}
      </div>

      <div className="MenuButton__dropdown">
        {this.props.actions.map((action, i) => <div
          className="MenuButton__dropdownItem"
          key={i}
          onClick={this.handleItemClick.bind(this, action.id)}
        >{action.label}</div>)}
      </div>
    </div>
  }

  private handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    this.setState({ open: !this.state.open })
  }

  private handleItemClick = (actionId: T, e: React.MouseEvent<HTMLDivElement>) => {
    this.props.onAction(actionId)
  }

  private handleDocumentMouseDown = (e: MouseEvent) => {
    if (!this.state.open || !this.ref.current) return

    if (this.ref.current?.contains(e.target as any)) return

    this.setState({ open: false })
  }
}
