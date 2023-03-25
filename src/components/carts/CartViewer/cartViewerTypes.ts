export interface CartViewerProps {
  className?: string
  file: FileWithMeta
  currentSelection?: any
  onSave?: (oldFile: FileWithMeta, newFile: FileWithMeta) => void
  onClose: (file: FileWithMeta) => void
  onFocus?: (file: FileWithMeta) => void
  onPosChanged?: (file: FileWithMeta, xPos: number, yPos: number) => void
  onOpenEditor?: (
    type: string,
    data: any,
    onDataChange: (oldData: any, newData: any) => void,
  ) => void
  onSendSysEx?: (data: Uint8Array) => void,
}

export interface FileWithMeta {
  fileName: string
  buf: Uint8Array
  xPos: number
  yPos: number
  id: string
  zIndex: number
  origin?: 'file' | 'midi' | 'user'
}
