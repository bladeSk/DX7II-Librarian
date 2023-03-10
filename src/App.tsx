import React from 'react'
import { FileDrop } from 'react-file-drop'
import logoURL from './assets/dx7ii.png'
import MIDIProvider from 'components/utility/MIDIProvider/MIDIProvider'
import MIDISelector from 'components/utility/MIDISelector/MIDISelector'
import { FileWithMeta } from 'components/carts/CartViewer/cartViewerTypes'
import CartViewer from 'components/carts/CartViewer/CartViewer'
import { fromBase64, toBase64 } from '@aws-sdk/util-base64'
import DragNDropProvider from 'components/utility/DragNDropProvider/DragNDropProvider'
import InlineDX7VoiceEditor from 'components/editors/InlineDX7VoiceEditor/InlineDX7VoiceEditor'
import InlineDX7PerfEditor from 'components/editors/InlineDX7PerfEditor/InlineDX7PerfEditor'
import SysExReceiver from 'components/utility/SysExReceiver/SysExReceiver'
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

    return <div className="App">
      <MIDIProvider>
        <DragNDropProvider>
          <header className="App__header">
            <div className="App__title">
              <div className="App__logo">
                <img src={logoURL} alt="DX7II" />Librarian
              </div>
              <div className="App__subTitle">
                Yamaha DX7II-FD / DX7II-D / DX7s / DX7 cart manager in your browser
              </div>
            </div>

            <MIDISelector />
          </header>

          <main className="App__body">
            {this.state.sysExFiles.map((sysExFile) => {
              return <CartViewer
                key={sysExFile.id}
                file={sysExFile}
                onClose={this.handleFileWindowClose}
                onFocus={this.handleFileWindowFocus}
                onPosChanged={this.handlePosChanged}
                onSavedAs={this.handleFileUpdate}
                onOpenEditor={this.handleOpenEditor}
              />
            })}
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
                this.openSysExeFiles(buffers.map((buf, i) => ({
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
              let w = Math.max(200, window.innerWidth - 440)
              let h = Math.max(200, window.innerWidth - 500)

              this.openSysExeFiles([{
                name: 'Received SysEx',
                buf: data,
                x: Math.floor(Math.random() * w),
                y: Math.floor(Math.random() * h),
              }])
            }}
          />
        </DragNDropProvider>
      </MIDIProvider>
    </div>
  }

  private openSysExeFiles(files: Array<{ name: string, buf: Uint8Array, x: number, y: number }>) {
    let maxZIndex = this.state.sysExFiles.reduce((maxVal, f) => Math.max(maxVal, f.zIndex), 0)

    let filesToAdd: FileWithMeta[] = files.map(({ name, buf}, i) => {
      let file = files![i]
      return {
        fileName: file.name,
        buf: new Uint8Array(buf),
        xPos: file.x + i * 24,
        yPos: file.y + i * 24,
        id: `${+new Date()}_${i}`,
        zIndex: maxZIndex + i + 1,
      }
    })

    filesToAdd.forEach(file => localStorage[`dx7iilr-file-${file.id}`] = toBase64(file.buf))

    this.setState({
      sysExFiles: [ ...this.state.sysExFiles, ...filesToAdd ]
    }, () => this.serializeState())
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

    this.setState({ sysExFiles })
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
