import React from 'react'
import { CartViewerProps, FileWithMeta } from './cartViewerTypes'
import DraggableWindow, { WindowAction } from '../DraggableWindow/DraggableWindow'
import { handleError } from 'core/utils/errorHandling'
import { saveFileAs } from 'core/utils/fileUtils'
import './CartViewer.scss'

interface State {
}


/**
 * Renders a DraggableWindow representing an unknown SysEx.
 */
export default class CartViewerHelp extends React.PureComponent<CartViewerProps, State> {
  constructor(props: CartViewerProps) {
    super(props)

    this.state = {
    }
  }

  render(): React.ReactElement {
    let file = this.props.file

    return <DraggableWindow
      key={file.id}
      className="CartViewer CartViewerHelp"
      variant="4"
      title={file.fileName}
      xPos={file.xPos}
      yPos={file.yPos}
      zIndex={file.zIndex}
      onFocus={this.handleFocus}
      onMove={this.handleMove}
      onClose={this.handleClose}
    >
      <p><i>DX7II Librarian allows you to manage Yamaha DX7II/DX7 voices and performances right in your browser.</i></p>
      <p>Import voice cartridges by dropping a .syx file anywhere on this page or receive SysExes sent from a DX7 directly via MIDI.</p>
      <p>Currently supported features:</p>
      <ul>
        <li>Move and reorder voices/performances within a cartridge or across cartridges</li>
        <li>Rename voices/performances</li>
        <li>Edit basic performance parameters</li>
        <li>View which DX7II features are in use by a voice</li>
        <li>Send and receive SysEx files via MIDI</li>
      </ul>

      <h2>Receiving voices on a DX7</h2>

      <p>The DX7 won't receive SysEx data by default, you need to enable it first.</p>

      <p><i>DX7II</i>: press EDIT, press CARTRIDGE (15) and set INT (internal) to OFF.</p>
      <p><i>DX7</i>: press FUNCTION, press 8, set MIDI CH to 1.<br/>Press 8 again, set SYS INFO AVAIL to YES.<br/>Press INTERNAL MEMORY PROTECT and set to OFF.</p>

      <h2>Useful links</h2>

      <p>
        <a href="https://github.com/bladeSk/dx7ii-librarian">Github - report issues here</a><br/>
        <a href="dx7ii-factory-rom.zip">Download factory DX7II voices and performances</a><br/>
        <a href="https://yamahablackboxes.com/collection/yamaha-dx7-synthesizer/patches/">Get original DX7 voice carts</a><br/>
        <a href="https://www.thisdx7cartdoesnotexist.com/">Generate a random DX7 cartridge</a><br/>
        <a href="https://github.com/asb2m10/dexed">Dexed - voice editor and synth (DX7 mk.I only)</a>
      </p>

      <h2>Other stuff</h2>
      <p><button className="button_acc4">Reset to demo project</button></p>
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
}
