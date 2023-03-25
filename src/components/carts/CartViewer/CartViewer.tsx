import React from 'react'
import { CartViewerProps } from './CartViewerBase'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import { DX7Microtuning } from 'core/models/DX7Microtuning'
import CartViewerDX7Voice from './CartViewerDX7Voice'
import CartViewerDX7Performance from './CartViewerDX7Performance'
import CartViewerDX7Microtuning from './CartViewerDX7Microtuning'
import CartViewerUnknown from './CartViewerUnknown'
import CartViewerHelp from './CartViewerHelp'

export type Props = Omit<CartViewerProps<any>, 'cart'>

interface State {
  voiceCart?: DX7VoiceCart
  perfCart?: DX7PerfCart
  mctCart?: DX7Microtuning
}

/**
 * Renders a cart based on the provided SysEx file.
 * Assumes the contents of the file in props never change, as that would discard the edited changes.
 * It is therefore required to use file.id as a fixed key.
 */
export default class CartViewer extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    let voiceCart = DX7VoiceCart.createFromSyx(props.file.buf)
    let perfCart: DX7PerfCart | undefined
    let mctCart: DX7Microtuning | undefined

    if (!voiceCart) perfCart = DX7PerfCart.createFromSyx(props.file.buf)
    if (!perfCart) mctCart = DX7Microtuning.createFromSyx(props.file.buf)

    this.state = {
      voiceCart,
      perfCart,
      mctCart,
    }
  }

  render(): React.ReactElement {
    if (this.state.voiceCart) {
      return <CartViewerDX7Voice {...this.props} cart={this.state.voiceCart} />
    } else if (this.state.perfCart) {
      return <CartViewerDX7Performance {...this.props} cart={this.state.perfCart} />
    }  else if (this.state.mctCart) {
      return <CartViewerDX7Microtuning {...this.props} cart={this.state.mctCart} />
    } else if (this.props.file.id == 'help') {
      return <CartViewerHelp {...this.props} cart={null} />
    } else {
      return <CartViewerUnknown {...this.props} cart={null} />
    }
  }
}
