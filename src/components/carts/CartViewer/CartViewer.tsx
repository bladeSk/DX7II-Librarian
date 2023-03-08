import React from 'react'
import { CartViewerProps } from './cartViewerTypes'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import CartViewerDX7Voice from './CartViewerDX7Voice'
import CartViewerDX7Performance from './CartViewerDX7Performance'
import CartViewerUnknown from './CartViewerUnknown'

interface State {
  voiceCart?: DX7VoiceCart
  perfCart?: DX7PerfCart
}

/**
 * Renders a cart based on the provided SysEx file.
 * Assumes the contents of the file in props never change, as that would discard the edited changes.
 * It is therefore required to use file.id as a fixed key.
 */
export default class CartViewer extends React.PureComponent<CartViewerProps, State> {
  constructor(props: CartViewerProps) {
    super(props)

    let voiceCart = DX7VoiceCart.createFromSyx(props.file.buf)
    let perfCart: DX7PerfCart | undefined

    if (!voiceCart) perfCart = DX7PerfCart.createFromSyx(props.file.buf)

    this.state = {
      voiceCart,
      perfCart,
    }
  }

  render(): React.ReactElement {
    if (this.state.voiceCart) {
      return <CartViewerDX7Voice {...this.props} cart={this.state.voiceCart} />
    } else if (this.state.perfCart) {
      return <CartViewerDX7Performance {...this.props} cart={this.state.perfCart} />
    } else {
      return <CartViewerUnknown {...this.props} />
    }
  }
}
