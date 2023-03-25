import React from 'react'
import clsx from 'clsx'
import { FileDrop } from 'react-file-drop'
import { fromBase64, toBase64 } from '@aws-sdk/util-base64'
import logoURL from 'assets/dx7ii.png'
import QuestionSvg from 'assets/icons/question-circle.svg'
import GithubSvg from 'assets/icons/github-fill.svg'
import MIDIProvider, { MIDIContext } from 'components/utility/MIDIProvider/MIDIProvider'
import MIDISelector from 'components/utility/MIDISelector/MIDISelector'
import { FileWithMeta } from 'components/carts/CartViewer/CartViewerBase'
import CartViewer from 'components/carts/CartViewer/CartViewer'
import DragNDropProvider from 'components/utility/DragNDropProvider/DragNDropProvider'
import InlineDX7VoiceEditor from 'components/editors/InlineDX7VoiceEditor/InlineDX7VoiceEditor'
import InlineDX7PerfEditor from 'components/editors/InlineDX7PerfEditor/InlineDX7PerfEditor'
import SysExReceiver from 'components/utility/SysExReceiver/SysExReceiver'
import MenuButton, { MenuButtonAction } from 'components/basic/MenuButton/MenuButton'
import { DX7VoiceCart } from 'core/models/DX7VoiceCart'
import { DX7PerfCart } from 'core/models/DX7PerfCart'
import { handleError } from 'core/utils/errorHandling'
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

interface XYPos {
  x: number
  y: number
}

/**
 * Main component of the application.
 */
export default class App extends React.PureComponent<Props, State> {
  constructor(props: Props) {
    super(props)

    this.state = App.deserializeState()
  }

  componentDidMount(): void {
    let openFiles = this.state.sysExFiles

    if (!openFiles.length || (openFiles.length == 1 && openFiles[0].id == 'help')) {
      this.openInitialProject()
    }
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
                <h1><img src={logoURL} alt="DX7II" draggable={false} />Librarian</h1>

                <span className="App__helpButton" title="Open help">
                  <QuestionSvg onClick={this.handleHelpClick} />
                </span>

                <a href="https://github.com/bladeSk/dx7ii-librarian" title="Project Github" target="_blank" draggable={false}>
                  <GithubSvg />
                </a>
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

            <MIDIContext.Consumer>{(midiCtx) => <>
              {this.state.sysExFiles.map((sysExFile) => {
                return <CartViewer
                  key={sysExFile.id}
                  file={sysExFile}
                  currentSelection={this.state.openEditor?.data}
                  onClose={this.handleFileWindowClose}
                  onFocus={this.handleFileWindowFocus}
                  onPosChanged={this.handlePosChanged}
                  onSave={this.handleFileUpdate}
                  onOpenEditor={this.handleOpenEditor}
                  onSendSysEx={midiCtx.sendData}
                />
              })}

              {midiCtx.sendingData && <div className="App__sendingDataOverlay">Sending SysEx data...</div>}
            </>}</MIDIContext.Consumer>
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
                  origin: 'file',
                })), { x: dragEvt.clientX, y: dragEvt.clientY - offsetY })
              })
            }}
          >Drop .syx files here to import DX7II/DX7 cartridges</FileDrop>

          <SysExReceiver
            onSysExReceived={(buf) => {
              // prevent auto-importing unknown SysExes - just editing parameters can cause SysEx data
              // to be sent, flooding the app with unknown data windows
              if (!KNOWN_DATA_LENGTHS.includes(buf.length)) return

              this.openFiles([{ name: 'Received SysEx', buf, origin: 'midi' }])
            }}
          />
        </DragNDropProvider>
      </MIDIProvider>
    </div>
  }

  private openFiles(
    files: {
      name: string,
      buf: Uint8Array,
      x?: number,
      y?: number,
      id?: string,
      origin?: FileWithMeta['origin'],
    }[],
    originXY?: XYPos,
  ): Promise<void> {
    let maxZIndex = this.state.sysExFiles.reduce((maxVal, f) => Math.max(maxVal, f.zIndex), 0)

    if (!originXY) {
      originXY =  {
        x: Math.floor(Math.random() * Math.max(200, window.innerWidth - 440)),
        y: Math.floor(Math.random() * Math.max(200, window.innerHeight - 500)),
      }
    }

    let filesToAdd: FileWithMeta[] = files.map((file, i) => {
      return {
        fileName: file.name,
        buf: new Uint8Array(file.buf),
        xPos: file.x || (originXY!.x + i * 32),
        yPos: file.y || (originXY!.y + i * 32),
        id: file.id || `${+new Date()}_${i}`,
        zIndex: maxZIndex + i + 1,
      }
    })

    filesToAdd.forEach(file => localStorage[`dx7iilr-file-${file.id}`] = toBase64(file.buf))

    return new Promise((res) => {
      this.setState((prevState: State) => {
        return {
          sysExFiles: [ ...prevState.sysExFiles, ...filesToAdd ]
        }
      }, () => {
        this.serializeState()
        res()
      })
    })
  }

  private openRemoteFiles(uris: string[], originXY?: XYPos): Promise<void> {
    return Promise.all(uris.map(uri => fetch(uri).then((resp) => {
      if (!resp.ok) throw new Error('Couldn\'t fetch the file')
      return resp.arrayBuffer()
    }))).then((bufs) => {
      return this.openFiles(bufs.map((buf, i) => ({
        buf: new Uint8Array(buf),
        name: uris[i].match(/[^\/]*$/)?.[0] || '',
        origin: 'file',
      })), originXY)
    }).catch(handleError)
  }

  private async openInitialProject() {
    this.setState({ sysExFiles: [] })

    let uris = [
      '/carts/Demo Cart.syx',
      '/carts/DX7II factory A 1-32.syx',
      '/carts/DX7II factory A 33-64.syx',
      '/carts/DX7II factory A perf.syx',
    ]

    let positions = [
      { x: 30, y: 30 },
      { x: 480, y: 30 },
      { x: 870, y: 30 },
      { x: 1260, y: 30 },
    ]

    try {
      let bufs = await Promise.all(uris.map(uri => fetch(uri).then((resp) => {
        if (!resp.ok) throw new Error('Couldn\'t open demo file')
        return resp.arrayBuffer()
      })))

      await this.openFiles(bufs.map((buf, i) => ({
        buf: new Uint8Array(buf),
        name: uris[i].match(/[^\/]*$/)?.[0] || '',
        origin: 'file',
        ...positions[i],
      })))
    } catch(err) {
      handleError(err)
    } finally {
      if (this.state.sysExFiles.find(f => f.id == 'help')) return
      this.handleHelpClick()
    }
  }

  private handleMenuAction = (actionId: string) => {
    if (actionId == 'newVoiceCart') {
      this.openFiles([{
        name: 'New Voice Cart',
        buf: DX7VoiceCart.createEmpty().buildCartDX7II(),
        origin: 'user',
      }])
    } else if (actionId == 'newPerfCart') {
      this.openFiles([{
        name: 'New Performance Cart',
        buf: DX7PerfCart.createEmpty().buildCart(),
        origin: 'user',
      }])
    } else if (actionId == 'importDemo') {
      this.openRemoteFiles(['/carts/Demo Cart.syx'])
    } else if (actionId == 'importDX7IIA') {
      this.openRemoteFiles([
        '/carts/DX7II factory A perf.syx',
        '/carts/DX7II factory A 1-32.syx',
        '/carts/DX7II factory A 33-64.syx',
      ])
    } else if (actionId == 'importDX7IIB') {
      this.openRemoteFiles([
        '/carts/DX7II factory B perf.syx',
        '/carts/DX7II factory B 1-32.syx',
        '/carts/DX7II factory B 33-64.syx',
      ])
    } else if (actionId == 'importDX7') {
      this.openRemoteFiles([
        '/carts/DX7 ROM1A.syx',
        '/carts/DX7 ROM1B.syx',
      ])
    } else if (actionId == 'openHelp') {
      this.handleHelpClick()
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
          yPos,
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

  private handleHelpClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    let helpFile = this.state.sysExFiles.find(f => f.id == 'help')

    if (helpFile) {
      this.handleFileWindowFocus(helpFile)
    } else {
      this.openFiles([{
        name: 'Help',
        buf: new Uint8Array([ 0 ]),
        x: (document.querySelector('.App__body')?.clientWidth || window.innerWidth) - 540,
        y: 20,
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
  { id: '---', label: '' },
  { id: 'importDemo', label: 'Import demo voice cart' },
  { id: 'importDX7IIA', label: 'Import DX7II factory ROM A' },
  { id: 'importDX7IIB', label: 'Import DX7II factory ROM B' },
  { id: 'importDX7', label: 'Import DX7 ROM 1' },
  { id: '---', label: '' },
  { id: 'openHelp', label: 'Help' },
]


const DX7_1_CART_LENGTH = 4104
const DX7_2_CART_LENGTH = 21404
const DX7_2_PARTIAL_CART_LENGTH = 5232 // amem + vmem (no FKS)
const DX7_2_PERF_LENGTH = 1650
const DX7_2_MCT_LENGTH = 274

const KNOWN_DATA_LENGTHS = [
  DX7_1_CART_LENGTH,
  DX7_2_CART_LENGTH,
  DX7_2_PARTIAL_CART_LENGTH,
  DX7_2_PERF_LENGTH,
  DX7_2_MCT_LENGTH,
]
