import React from 'react'
import clsx from 'clsx'
import { DX7Performance, perfMode, voiceLocation } from 'core/models/DX7Performance'
import '../InlineEditors.scss'

export interface Props {
  className?: string
  perf: DX7Performance
  onUpdate: (oldVoice: DX7Performance, newVoice: DX7Performance) => void
  onClose: () => void
}

interface State {
  inputs: {
    name: string,
    mode: perfMode,
    voiceA: string,
    voiceALoc: voiceLocation,
    voiceB: string,
    voiceBLoc: voiceLocation,
    splitPoint: string,
  },
  changed: boolean
}

/**
 * Editor for a DX7 performance.
 */
export default class InlineDX7PerfEditor extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = InlineDX7PerfEditor.getInitialState(props)
  }

  componentDidUpdate(prevProps: Readonly<Props>): void {
    if (this.props.perf != prevProps.perf) {
      this.setState(InlineDX7PerfEditor.getInitialState(this.props))
    }
  }

  private static getInitialState(props: Props): State {
    let perf = props.perf

    return {
      changed: false,
      inputs: {
        name: perf.name,
        mode: perf.mode,
        voiceA: perf.voiceA[1].toString(),
        voiceALoc: perf.voiceA[0],
        voiceB: perf.voiceB[1].toString(),
        voiceBLoc: perf.voiceB[0],
        splitPoint: perf.splitPoint.toString(),
      },
    }
  }

  render(): React.ReactElement {
    let inputs = this.state.inputs

    return <form
      className={clsx('InlineEditor', 'InlineDX7PerfEditor', this.props.className)}
      onSubmit={this.handleFormSubmit}
    >
      <div className="InlineEditor__title">
        Edit performance <i>{this.props.perf.name}</i>
      </div>

      <div className="InlineEditor__content">
        <div className="InlineEditor__field">
          <label>Performance name</label>

          <input
            className="InlineDX7PerfEditor__perfName"
            type="text"
            maxLength={20}
            autoFocus
            value={inputs.name}
            onChange={this.handleInputChange.bind(this, 'name')}
          />
        </div>

        <div className="InlineEditor__field">
          <label>Mode</label>
            <select
              value={inputs.mode}
              onChange={this.handleSelectChange.bind(this, 'mode')}
            >
            <option value="single">Single</option>
            <option value="dual">Dual</option>
            <option value="split">Split</option>
          </select>
        </div>

        <div className="InlineEditor__field">
          <label>Voice A</label>
          <div>
            <select
              value={inputs.voiceALoc}
              onChange={this.handleSelectChange.bind(this, 'voiceALoc')}
            >
              <option value="int">Int</option>
              <option value="cart">Cart</option>
            </select> {}

            <input
              className="InlineDX7PerfEditor__voice"
              type="number"
              min={1}
              max={64}
              value={inputs.voiceA}
              onChange={this.handleInputChange.bind(this, 'voiceA')}
            />
          </div>
        </div>

        <div className="InlineEditor__field">
          <label>Voice B</label>
          <div>
            <select
              value={inputs.voiceBLoc}
              onChange={this.handleSelectChange.bind(this, 'voiceBLoc')}
            >
              <option value="int">Int</option>
              <option value="cart">Cart</option>
            </select> {}

            <input
              className="InlineDX7PerfEditor__voice"
              type="number"
              min={1}
              max={64}
              value={inputs.voiceB}
              onChange={this.handleInputChange.bind(this, 'voiceB')}
            />
          </div>
        </div>

        <div className="InlineEditor__field">
          <label>Split point</label>
          <div>
            <input
              type="number"
              min={0}
              max={127}
              value={inputs.splitPoint}
              onChange={this.handleInputChange.bind(this, 'splitPoint')}
            /> {}

            <span className="InlineDX7PerfEditor__noteName">
              {formatNoteName(parseInt(inputs.splitPoint || '0'))}
            </span>
          </div>
        </div>

        <div className="InlineEditor__actions">
          {this.state.changed && <button type="button" onClick={this.handleSaveClick}>✔</button>}

          <button type="button" className="button_acc4" onClick={this.handleCancelClick}>✖</button>
        </div>
      </div>
    </form>
  }

  private handleInputChange(inputId: keyof State['inputs'], e: React.ChangeEvent<HTMLInputElement>) {
    this.setState({
      inputs: {
        ...this.state.inputs,
        [inputId]: e.currentTarget.value,
      },
      changed: true,
    })
  }

  private handleSelectChange(inputId: keyof State['inputs'], e: React.ChangeEvent<HTMLSelectElement>) {
    this.setState({
      inputs: {
        ...this.state.inputs,
        [inputId]: e.currentTarget.value,
      },
      changed: true,
    })
  }

  private handleSaveClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    let inputs = this.state.inputs

    let newPerf = this.props.perf.clone()
    newPerf.name = inputs.name
    newPerf.mode = inputs.mode
    newPerf.splitPoint = parseInt(inputs.splitPoint)
    newPerf.voiceA = [ inputs.voiceALoc, parseInt(inputs.voiceA) ]
    newPerf.voiceB = [ inputs.voiceBLoc, parseInt(inputs.voiceB) ]

    this.props.onUpdate(this.props.perf, newPerf)
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

const NOTE_NAMES = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ]

function formatNoteName(note: number): string {
  if (note < 0 || note > 127 || isNaN(note)) return 'Invalid'

  return NOTE_NAMES[note % 12] + ' ' + (Math.floor(note / 12) - 2)
}
