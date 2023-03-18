import React from 'react'
import clsx from 'clsx'
import { FileDrop } from 'react-file-drop'
import { fromBase64, toBase64 } from '@aws-sdk/util-base64'
import logoURL from 'assets/dx7ii.png'
import QuestionSvg from 'assets/icons/question-circle.svg'
import GithubSvg from 'assets/icons/github-fill.svg'
import MIDIProvider, { MIDIContext } from 'components/utility/MIDIProvider/MIDIProvider'
import MIDISelector from 'components/utility/MIDISelector/MIDISelector'
import { FileWithMeta } from 'components/carts/CartViewer/cartViewerTypes'
import CartViewer from 'components/carts/CartViewer/CartViewer'
import DragNDropProvider from 'components/utility/DragNDropProvider/DragNDropProvider'
import InlineDX7VoiceEditor from 'components/editors/InlineDX7VoiceEditor/InlineDX7VoiceEditor'
import InlineDX7PerfEditor from 'components/editors/InlineDX7PerfEditor/InlineDX7PerfEditor'
import SysExReceiver from 'components/utility/SysExReceiver/SysExReceiver'
import MenuButton, { MenuButtonAction } from 'components/basic/MenuButton/MenuButton'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import './App.scss'

export interface Props {
}

interface State {
  sysExFiles: FileWithMeta[]
  openEditor?: {
    type: string,
    data: any,
    onDataChange: (oldData: any, newData: any) => void
  }
}

/**
 * Main component of the application.
 */
export default class App extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = App.deserializeState()
  }

  render(): React.ReactElement {
    let editData = this.state.openEditor
    let isEmpty = this.state.sysExFiles.length == 0

    return <div className="App">
      <MIDIProvider>
        <DragNDropProvider>
          <header className="App__header">
            <div className="App__title">
              <div className="App__logo">
                <h1><img src={logoURL} alt="DX7II" />Librarian</h1>

                <QuestionSvg className="App__helpButton" onClick={this.handleHelpClick} />

                <a href="https://github.com/bladeSk/dx7ii-librarian"><GithubSvg /></a>
              </div>

              <div className="App__subTitle">
                Yamaha DX7II-FD / DX7II-D / DX7s / DX7 cart manager in your browser
              </div>
            </div>

            <MIDISelector />

            <MenuButton className="App__mainMenuButton"
              hAlign="r"
              actions={MENU_ACTIONS}
              onAction={this.handleMenuAction}
            />
          </header>

          <main className={clsx('App__body', isEmpty && 'App__body_empty')}>
            {isEmpty && <p>Drop a .syx file here or send SysEx from a DX7 via MIDI.</p>}

            <MIDIContext.Consumer>{(midiCtx) => this.state.sysExFiles.map((sysExFile) => {
              return <CartViewer
                key={sysExFile.id}
                file={sysExFile}
                onClose={this.handleFileWindowClose}
                onFocus={this.handleFileWindowFocus}
                onPosChanged={this.handlePosChanged}
                onSave={this.handleFileUpdate}
                onOpenEditor={this.handleOpenEditor}
                onSendSysEx={midiCtx.sendData}
              />
            })}</MIDIContext.Consumer>
          </main>

          {editData?.type == 'DX7Voice' && <InlineDX7VoiceEditor
            voice={editData.data}
            onUpdate={editData.onDataChange}
            onClose={this.handleCloseEditor}
          />}

          {editData?.type == 'DX7Perf' && <InlineDX7PerfEditor
            perf={editData.data}
            onUpdate={editData.onDataChange}
            onClose={this.handleCloseEditor}
          />}

          <FileDrop
            onDrop={(files, dragEvt) => {
              let offsetY: number = (dragEvt.target as any)?.offsetTop || 0

              Promise.all(
                Array.from(files || [])
                  // prevent large files from being imported, the largest DX7 sysex is 21404 B
                  .map(f => f.size > 64 * 1024 ? { arrayBuffer: () => new ArrayBuffer(0) } : f)
                  .map(f => f.arrayBuffer())
              ).then((buffers) => {
                this.openFiles(buffers.map((buf, i) => ({
                  name: files![i].name,
                  buf: new Uint8Array(buf),
                  x: dragEvt.clientX,
                  y: dragEvt.clientY - offsetY,
                })))
              })
            }}
          >Drop .syx here to load a cartridge</FileDrop>

          <SysExReceiver
            onSysExReceived={(data) => {
              // prevent auto-importing unknown SysExes - just editing parameters can cause SysEx data
              // to be sent, flooding the app with unknown data windows
              if (!KNOWN_DATA_LENGTHS.includes(data.length)) return

              this.openFileAtRandomLocation('Received SysEx', data)
            }}
          />
        </DragNDropProvider>
      </MIDIProvider>
    </div>
  }

  private openFiles(
    files: Array<{ name: string, buf: Uint8Array, x: number, y: number, id?: string }>,
  ) {
    let maxZIndex = this.state.sysExFiles.reduce((maxVal, f) => Math.max(maxVal, f.zIndex), 0)

    let filesToAdd: FileWithMeta[] = files.map((file, i) => {
      return {
        fileName: file.name,
        buf: new Uint8Array(file.buf),
        xPos: file.x + i * 24,
        yPos: file.y + i * 24,
        id: file.id || `${+new Date()}_${i}`,
        zIndex: maxZIndex + i + 1,
      }
    })

    filesToAdd.forEach(file => localStorage[`dx7iilr-file-${file.id}`] = toBase64(file.buf))

    this.setState({
      sysExFiles: [ ...this.state.sysExFiles, ...filesToAdd ]
    }, () => this.serializeState())
  }

  private openFileAtRandomLocation(name: string, buf: Uint8Array) {
    let w = Math.max(200, window.innerWidth - 440)
    let h = Math.max(200, window.innerHeight - 500)

    this.openFiles([{
      name,
      buf,
      x: Math.floor(Math.random() * w),
      y: Math.floor(Math.random() * h),
    }])
  }

  private handleMenuAction = (actionId: string) => {
    if (actionId == 'newVoiceCart') {
      this.openFileAtRandomLocation('New Voice Cart', DX7VoiceCart.createEmpty().buildCartDX7II())
    } else if (actionId == 'newPerfCart') {
      this.openFileAtRandomLocation('New Performance Cart', DX7PerfCart.createEmpty().buildCart())
    } else if (actionId == 'demoProject') {

    }
  }

  private handleFileWindowClose = (file: FileWithMeta) => {
    localStorage.removeItem(`dx7iilr-file-${file.id}`)

    this.setState({
      sysExFiles: this.state.sysExFiles.filter(f => f != file),
    })
  }

  private handleFileWindowFocus = (file: FileWithMeta) => {
    let maxZIndex = this.state.sysExFiles.reduce((maxVal, f) => Math.max(maxVal, f.zIndex), 0)
    if (file.zIndex == maxZIndex) return

    let filesInNewOrder = this.state.sysExFiles
      .sort((a, b) => a.zIndex - b.zIndex)
      .filter(f => f != file)

    filesInNewOrder.push(file)

    let fileIdToZ = filesInNewOrder.reduce((dict, file, i) => {
      dict[file.id] = i
      return dict
    }, {} as Record<string, number>)

    let sysExFiles = this.state.sysExFiles.map((file) => ({
      ...file,
      zIndex: fileIdToZ[file.id] || 0,
    }))

    this.setState({ sysExFiles }, () => this.serializeState())
  }

  private handleFileUpdate = (oldFile: FileWithMeta, newFile: FileWithMeta) => {
    localStorage.removeItem(`dx7iilr-file-${oldFile.id}`)
    localStorage[`dx7iilr-file-${newFile.id}`] = toBase64(newFile.buf)

    this.setState({
      sysExFiles: this.state.sysExFiles.map((f) => {
        if (f == oldFile) return newFile

        return f
      })
    }, () => this.serializeState())
  }

  private handlePosChanged = (file: FileWithMeta, xPos: number, yPos: number) => {
    this.setState({
      sysExFiles: this.state.sysExFiles.map((f) => {
        if (f != file) return f

        return {
          ...file,
          xPos,
          yPos
        }
      })
    }, () => this.serializeState())
  }

  private handleOpenEditor = (type: string, data: any, onDataChange: (oldData: any, newData: any) => void) => {
    this.setState({ openEditor: { type, data, onDataChange } })
  }

  private handleCloseEditor = () => {
    this.setState({ openEditor: undefined })
  }

  private handleHelpClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    let helpFile = this.state.sysExFiles.find(f => f.id == 'help')

    if (helpFile) {
      this.handleFileWindowClose(helpFile)
    } else {
      this.openFiles([{
        name: 'Help',
        buf: new Uint8Array([ 0 ]),
        x: Math.floor(Math.max(0, (window.innerWidth - 480) / 2)),
        y: Math.floor(Math.max(0, (window.innerHeight - 680) / 2)),
        id: 'help',
      }])
    }
  }

  private serializeState() {
    localStorage['dx7iilr-openFiles'] = JSON.stringify(this.state.sysExFiles.map((file) => {
      let { buf, ...fileWithoutBuf } = file
      return fileWithoutBuf
    }))
  }

  private static deserializeState(): State {
    if (!localStorage['dx7iilr-openFiles']) return { sysExFiles: [] }

    let files = JSON.parse(localStorage['dx7iilr-openFiles']) as FileWithMeta[]
    files.forEach((file) => {
      let b64 = localStorage[`dx7iilr-file-${file.id}`]
      if (!b64) return

      file.buf = fromBase64(b64)
    })

    return {
      sysExFiles: files.filter(f => f.buf),
    }
  }
}


const MENU_ACTIONS: MenuButtonAction[] = [
  { id: 'newVoiceCart', label: 'New voice cart' },
  { id: 'newPerfCart', label: 'New performance cart' },
  { id: 'demoProject', label: 'Open demo project' },
]


const DX7_1_CART_LENGTH = 5232
const DX7_2_CART_LENGTH = 21404
const DX7_2_PARTIAL_CART_LENGTH = 21404
const DX7_2_PERF_LENGTH = 1650

const KNOWN_DATA_LENGTHS = [
  DX7_1_CART_LENGTH,
  DX7_2_CART_LENGTH,
  DX7_2_PARTIAL_CART_LENGTH,
  DX7_2_PERF_LENGTH,
]
