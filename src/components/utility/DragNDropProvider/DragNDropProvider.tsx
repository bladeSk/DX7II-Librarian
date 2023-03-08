import React from 'react'

export interface Props {
  className?: string
  children?: React.ReactNode
}

interface State {
  data?: any
  type?: string
}

export interface DragNDropData<T = any> {
  data?: T
  type?: string
  setData: (type: string, data: T) => void
  clearData: () => void
}

export const DragNDropContext = React.createContext<DragNDropData>({
  setData: () => {},
  clearData: () => {},
})
DragNDropContext.displayName = 'DragNDropContext'

/**
 * Provides context for globally getting/setting drag & drop data.
 * Does not render anything.
 */
export default class DragNDropProvider extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = {}
  }

  render(): React.ReactElement {
    return <DragNDropContext.Provider value={{
      data: this.state.data,
      type: this.state.type,
      setData: (type?: string, data?: any) => {
        this.setState({ type, data })
      },
      clearData: () => {
        this.setState({ type: undefined, data: undefined })
      }
    }}>
      {this.props.children}
    </DragNDropContext.Provider>
  }
}

// TODO?: this might be a cleaner, but more inefficient implementation

// export interface WithDragNDropProps {
//   dragNDropCtx: DragNDropData
// }

// export function withDragNDrop<T extends {}>(WrappedComponent: React.ComponentType<T>) {
//   return class extends React.Component<T & WithDragNDropProps> {
//     render(): React.ReactElement {
//       return <DragNDropContext.Consumer>{(dragNDropCtx) => <WrappedComponent
//         dragNDropCtx={dragNDropCtx}
//         {...this.props as T}
//       />}</DragNDropContext.Consumer>
//     }
//   }
// }
