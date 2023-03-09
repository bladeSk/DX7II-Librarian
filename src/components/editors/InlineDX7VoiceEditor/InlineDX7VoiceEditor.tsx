import React from 'react'
import clsx from 'clsx'
import { DX7Voice } from 'core/models/DX7Voice'
import '../InlineEditors.scss'

export interface Props {
  className?: string
  voice: DX7Voice
  onUpdate: (oldVoice: DX7Voice, newVoice: DX7Voice) => void
  onClose: () => void
}

interface State {
  nameInput: string
  changed: boolean
}

/**
 * Editor for a DX7 voice - allows only renaming at the moment.
 */
export default class InlineDX7VoiceEditor extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = InlineDX7VoiceEditor.getInitialState(props)
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (this.props.voice != prevProps.voice) {
      this.setState(InlineDX7VoiceEditor.getInitialState(this.props))
    }
  }

  private static getInitialState(props: Props): State {
    return {
      nameInput: props.voice.name,
      changed: false,
    }
  }

  render(): React.ReactElement {
    let dx7iiFeatures = this.props.voice.dx7iiFeatures

    return <form
      className={clsx('InlineEditor', 'InlineDX7VoiceEditor', this.props.className)}
      onSubmit={this.handleFormSubmit}
    >
      <div className="InlineEditor__title">
        Edit voice <i>{this.props.voice.name}</i>
      </div>

      <div className="InlineEditor__content">
        <div className="InlineEditor__field">
          <label>Voice name</label>
          <input
            className="InlineDX7VoiceEditor__voiceName"
            type="text"
            maxLength={10}
            autoFocus
            value={this.state.nameInput}
            onChange={this.handleNameInputChange}
          />
        </div>

        <div className="InlineDX7VoiceEditor__dx7iiFeatures">
          {dx7iiFeatures.length > 0
            ? <><label>DX7II features in use</label> {dx7iiFeatures.join(', ')}</>
            : <label>DX7 mk I. voice</label>
          }
        </div>

        <div className="InlineEditor__actions">
          {this.state.changed && <button type="button" onClick={this.handleSaveClick}>✔</button>}

          <button type="button" className="button_acc4" onClick={this.handleCancelClick}>✖</button>
        </div>
      </div>
    </form>
  }

  private handleNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ nameInput: e.currentTarget.value, changed: true })
  }

  private handleSaveClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    let newVoice = this.props.voice.clone()
    newVoice.name = this.state.nameInput

    this.props.onUpdate(this.props.voice, newVoice)
    this.props.onClose()
  }

  private handleCancelClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    this.props.onClose()
  }

  private handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    this.handleSaveClick()
  }
}
