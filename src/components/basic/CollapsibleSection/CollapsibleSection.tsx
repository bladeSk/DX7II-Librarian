import React from 'react'
import clsx from 'clsx'
import ChevronSvg from 'assets/icons/chevron-down.svg'
import './CollapsibleSection.scss'

export interface Props {
  className?: string
  title: React.ReactNode
  children?: React.ReactNode
  expanded?: boolean
  sectionId?: string
  onToggle?: (sectionId: string, expanded: boolean) => void
}

interface State {
  expanded?: boolean
}

/**
 * Clickable title, which expands the content - intended for FAQs and such.
 */
export default class CollapsibleSection extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  render(): React.ReactElement {
    let expanded = this.props.expanded ?? this.state.expanded

    let classNames = clsx(
      'CollapsibleSection',
      expanded && 'CollapsibleSection_expanded',
      this.props.className,
    )

    return <div className={classNames}>
      <h3 className="CollapsibleSection__title" onMouseDown={this.onTitleClick}>{this.props.title}</h3>
      <ChevronSvg className="CollapsibleSection__chevron" />

      <div className="CollapsibleSection__content">
        {this.props.children}
      </div>
    </div>
  }

  private onTitleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let expanded = this.props.expanded ?? this.state.expanded

    this.setState({ expanded: !expanded })
    this.props.onToggle?.(this.props.sectionId || '', !expanded)
  }
}
