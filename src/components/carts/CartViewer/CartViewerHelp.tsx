import React from 'react'
import CartViewerBase, { CartViewerProps, CartViewerState } from './CartViewerBase'
import DraggableWindow from '../DraggableWindow/DraggableWindow'
import CollapsibleSection from 'components/basic/CollapsibleSection/CollapsibleSection'
import './CartViewer.scss'

interface State extends CartViewerState<null> {
  expandedSection?: string
}

/**
 * Renders a special DraggableWindow with help.
 */
export default class CartViewerHelp extends CartViewerBase<null, State> {
  constructor(props: CartViewerProps<null>) {
    super(props)

    this.state = {
      editedCart: null,
      editedName: this.props.file.fileName,
      changed: false,
      expandedSection: 'about',
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
      <CollapsibleSection title="About DX7II Librarian"
        sectionId="about" expanded={exp == 'about'} onToggle={this.handleSectionToggle}
      >
        <p><i>DX7II Librarian</i> allows you to manage Yamaha DX7II/DX7 <span className="accent1">voices</span> and <span className="accent2">performances</span> right from your browser. Including the enhanced DX7II voices.</p>
        <p>Things to try:</p>
        <ul>
          <li>drag voices to reorder or replace them</li>
          <li>click voices to rename them and show details</li>
          <li>drop a DX7 .syx file anywhere into this window to load it (<a href="#" onClick={this.handleSectionLinkClick.bind(this, 'links')}>where to get .syx files</a>)</li>
          <li>send your favorite collection of voices to a DX7 via MIDI</li>
        </ul>
        <p><i>DX7II Librarian</i> was created by <a href="https://blade.sk/" target="_blank">blade.sk</a>.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Features"
        sectionId="feat" expanded={exp == 'feat'} onToggle={this.handleSectionToggle}
      >
        <ul>
          <li>Move, copy and reorder <span className="accent1">voices</span> or <span className="accent2">performances</span> within a cartridge or across multiple cartridges</li>
          <li>Rename <span className="accent1">voices</span>/<span className="accent2">performances</span></li>
          <li>Edit basic <span className="accent2">performance</span> parameters</li>
          <li>View which DX7II features are in use by a <span className="accent1">voice</span></li>
          <li>Send and receive SysEx data via MIDI - compatible with DX7II and the original DX7</li>
        </ul>
      </CollapsibleSection>

      <CollapsibleSection title="Importing voices (DX7 patches)"
        sectionId="opening" expanded={exp == 'opening'} onToggle={this.handleSectionToggle}
      >
        <p>
          Import voice cartridges by dropping a DX7 <i>.syx</i> file anywhere on this page. {}
          You can find a lot of these on the internet - {}
          see <a href="#" onClick={this.handleSectionLinkClick.bind(this, 'links')}>Useful links</a>.
        </p>
        <p>
          Voices can be received directly from a DX7 via MIDI {}
          (see <a href="#" onClick={this.handleSectionLinkClick.bind(this, 'receive')}>Exporting voices from a DX7</a>).
        </p>

        <p>You can also import performance cartridges and microtunings in the same way.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Sending voices to a DX7"
        sectionId="send" expanded={exp == 'send'} onToggle={this.handleSectionToggle}
      >
        <p>You need to enable receiving on a DX7 each time you turn it on:</p>

        <p><b className="accent1">DX7II</b></p>
        <ul>
          <li>press EDIT</li>
          <li>press button #14 (UTILITY-TUNE) until you see "Memory protect"</li>
          <li>set INT (internal) to OFF</li>
        </ul>

        <p><b className="accent1">DX7</b></p>
        <ul>
          <li>press FUNCTION, press button #8 until you see MIDI CH, set MIDI CH to 1</li>
          <li>press button #8 again, until you see SYS INFO change SYS INFO UNAVAIL to AVAIL by pressing YES</li>
          <li>press INTERNAL MEMORY PROTECT and set to OFF</li>
        </ul>

        <p>Click a cartridge window's menu button and select <i>Send via MIDI</i>. The synth should display <i>Receiving MIDI data</i>.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Exporting voices from a DX7"
        sectionId="receive" expanded={exp == 'receive'} onToggle={this.handleSectionToggle}
      >
        <p><b className="accent1">DX7II</b></p>
        <ul>
          <li>press EDIT</li>
          <li>press button #32 (MIDI 2) - until you see "Voice Transmit"</li>
          <li>select 1-32 or 33-64, press yes twice</li>
        </ul>

        <p><b className="accent1">DX7</b></p>
        <ul>
          <li>press FUNCTION</li>
          <li>press button #8 until you see SYS INFO, change SYS INFO UNAVAIL to AVAIL by pressing YES</li>
          <li>press button #8 until you see MIDI TRANSMIT, press YES</li>
        </ul>

        <p>The received data should show up automatically as a new window in DX7II Librarian.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Useful links"
        sectionId="links" expanded={exp == 'links'} onToggle={this.handleSectionToggle}
      >
        <p><a target="_blank" href="https://github.com/bladeSk/DX7II-Librarian">Project Github</a> - report issues here</p>
        <p><a target="_blank" href={`${import.meta.env.BASE_URL}/files/DX7II-collection.zip`}>Download a collection of DX7II voices and performances</a></p>
        <p><a target="_blank" href={`${import.meta.env.BASE_URL}/files/DX7II-factory-rom.zip`}>Download DX7II factory cartridge</a></p>
        <p><a target="_blank" href="https://yamahablackboxes.com/collection/yamaha-dx7-synthesizer/patches/">Original DX7 voice cartridges</a></p>
        <p><a target="_blank" href="https://www.thisdx7cartdoesnotexist.com/">Generate random DX7 cartridges</a></p>
        <p><a target="_blank" href="https://asb2m10.github.io/dexed/">Dexed - DX7 virtual synth and voice editor</a> (DX7 mk.1 voices only)</p>
      </CollapsibleSection>

      <CollapsibleSection title="Planned features"
        sectionId="planned" expanded={exp == 'planned'} onToggle={this.handleSectionToggle}
      >
        <ul>
          <li>Undo/redo steps</li>
          <li>Preview voices</li>
          <li>(maybe) Editor for ALL the parameters</li>
        </ul>
      </CollapsibleSection>
    </DraggableWindow>
  }

  private handleSectionLinkClick(sectionId: string, e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()

    this.setState({ expandedSection: sectionId })
  }

  private handleSectionToggle = (sectionId: string, expanded: boolean) => {
    if (!expanded) return

    this.setState({ expandedSection: sectionId })
  }
}
