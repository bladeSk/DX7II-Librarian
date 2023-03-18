import React from 'react'
import { CartViewerProps } from './cartViewerTypes'
import DraggableWindow from '../DraggableWindow/DraggableWindow'
import CollapsibleSection from 'components/basic/CollapsibleSection/CollapsibleSection'
import './CartViewer.scss'

interface State {
  expandedSection?: string
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
    let exp = this.state.expandedSection

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
      <p>DX7II Librarian allows you to manage Yamaha DX7II/DX7 voices and performances right from your browser.</p>

      <CollapsibleSection title="Features"
        sectionId="feat" expanded={exp == 'feat'} onToggle={this.handleSectionToggle}
      >
        <ul>
          <li>Move and reorder voices or performances within a cartridge or across multiple cartridges</li>
          <li>Rename voices/performances</li>
          <li>Edit basic performance parameters</li>
          <li>View which DX7II features are in use by a voice</li>
          <li>Send and receive SysEx files via MIDI</li>
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Opening patches/voices"
        sectionId="opening" expanded={exp == 'opening'} onToggle={this.handleSectionToggle}
      >
        <p>
          Import voice cartridges by dropping a DX7 .syx file anywhere on this page. {}
          You can find a lot of these on the internet - {}
          see <a href="" onClick={this.handleSectionLinkClick.bind(this, 'links')}>Useful links</a>.
        </p>
        <p>
          Voices can be received directly from a DX7 via MIDI {}
          (see <a href="" onClick={this.handleSectionLinkClick.bind(this, 'receive')}>Exporting voices from a DX7</a>).
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="Sending voices to a DX7"
        sectionId="send" expanded={exp == 'send'} onToggle={this.handleSectionToggle}
      >
        <p>You need to enable receiving on a DX7 each time you turn it on:</p>

        <p><i>DX7II</i></p>
        <ul>
          <li>press EDIT</li>
          <li>press CARTRIDGE (15)</li>
          <li>set INT (internal memory protection) to OFF</li>
        </ul>

        <p><i>DX7</i></p>
        <ul>
          <li>press FUNCTION, press 8, set MIDI CH to 1</li>
          <li>press 8 again, change SYS INFO UNAVAIL to SYS INFO UNAVAIL by pressing YES</li>
          <li>press INTERNAL MEMORY PROTECT (X) and set to OFF</li>
        </ul>

        <p>Click on a window's menu and select <i>Send SysEx</i>. The synth should display <i>Receiving MIDI data</i>.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Exporting voices from a DX7"
        sectionId="receive" expanded={exp == 'receive'} onToggle={this.handleSectionToggle}
      >
        <p><i>DX7II</i></p>
        <ul>
          <li>press EDIT</li>
          <li>press MIDI 2 (32) twice - until you see "Voice Transmit"</li>
          <li>select 1-32 or 33-64, press yes twice</li>
        </ul>

        <p><i>DX7</i></p>
        <ul>
          <li>press FUNCTION</li>
          <li>press 8 until you see SYS INFO UNAVAIL, change to SYS INFO AVAIL by pressing YES</li>
          <li>press 8 until you see MIDI TRANSMIT, press YES</li>
        </ul>

        <p>The received data should show up automatically as a new window in DX7II Librarian.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Useful links"
        sectionId="links" expanded={exp == 'links'} onToggle={this.handleSectionToggle}
      >
        <p><a target="_blank" href="https://github.com/bladeSk/dx7ii-librarian">Github - report issues here</a></p>
        <p><a target="_blank" href="dx7ii-factory-rom.zip">Download factory DX7II voices and performances</a></p>
        <p><a target="_blank" href="https://yamahablackboxes.com/collection/yamaha-dx7-synthesizer/patches/">Original DX7 voice cartridges</a></p>
        <p><a target="_blank" href="https://www.thisdx7cartdoesnotexist.com/">Generate random DX7 cartridges</a></p>
        <p><a target="_blank" href="https://asb2m10.github.io/dexed/">Dexed - DX7 mk.I virtual synth and voice editor</a></p>
      </CollapsibleSection>
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

  private handleSectionLinkClick(sectionId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    this.setState({ expandedSection: sectionId })
  }

  private handleSectionToggle = (sectionId: string, expanded: boolean) => {
    this.setState({
      expandedSection: expanded ? sectionId : undefined,
    })
  }
}
