import { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function QRModal({ open, onClose, link }) {
  const canvasRef = useRef()
  const trackUrl = link ? `${window.location.origin}/r/${link.slug}` : ''

  function downloadQR() {
    const canvas = canvasRef.current?.querySelector('canvas')
    if (!canvas) return
    const url = canvas.toDataURL('image/png')
    const a = document.createElement('a')
    a.href = url
    a.download = `qr-${link?.slug}.png`
    a.click()
  }

  if (!link) return null

  return (
    <Modal open={open} onClose={onClose} title="QR 코드" size="sm">
      <div className="flex flex-col items-center gap-4">
        <div ref={canvasRef} className="p-4 bg-white border border-gray-200 rounded-lg">
          <QRCodeCanvas
            value={trackUrl}
            size={200}
            level="H"
            includeMargin={false}
          />
        </div>
        <div className="w-full text-center">
          <p className="text-xs text-gray-500 mb-1">추적 URL</p>
          <p className="text-sm font-mono text-gray-800 break-all bg-gray-50 rounded px-3 py-2">
            {trackUrl}
          </p>
        </div>
        <div className="flex gap-2 w-full">
          <Button onClick={downloadQR} className="flex-1 justify-center">
            PNG 다운로드
          </Button>
          <Button
            variant="secondary"
            className="flex-1 justify-center"
            onClick={() => navigator.clipboard.writeText(trackUrl)}
          >
            URL 복사
          </Button>
        </div>
      </div>
    </Modal>
  )
}
