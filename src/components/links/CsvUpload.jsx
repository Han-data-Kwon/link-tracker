import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { parseCsv, CSV_TEMPLATE_EXAMPLE } from '../../lib/csv'
import { useBulkCreateLinks } from '../../hooks/useLinks'
import Button from '../ui/Button'

export default function CsvUpload({ onSuccess }) {
  const [preview, setPreview] = useState(null)   // { links, errors }
  const [status, setStatus] = useState('idle')    // idle | parsing | ready | uploading | done | error
  const [uploadResult, setUploadResult] = useState(null)
  const bulkCreate = useBulkCreateLinks()

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setStatus('parsing')
    setPreview(null)
    try {
      const result = await parseCsv(file)
      setPreview(result)
      setStatus('ready')
    } catch (err) {
      setStatus('error')
      setPreview({ links: [], errors: [err.message] })
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'], 'text/plain': ['.csv'] },
    maxFiles: 1,
  })

  async function handleUpload() {
    if (!preview?.links?.length) return
    setStatus('uploading')
    try {
      const data = await bulkCreate.mutateAsync(preview.links)
      setUploadResult({ success: data.length })
      setStatus('done')
      setPreview(null)
      onSuccess?.()
    } catch (err) {
      setUploadResult({ error: err.message })
      setStatus('error')
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_EXAMPLE], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'link-tracker-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setPreview(null)
    setStatus('idle')
    setUploadResult(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">CSV 업로드</h3>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          템플릿 다운로드
        </Button>
      </div>

      {/* 드롭존 */}
      {status === 'idle' || status === 'parsing' ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {status === 'parsing' ? (
            <p className="text-sm text-gray-500">파싱 중...</p>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-700">CSV 파일을 드래그하거나 클릭하세요</p>
              <p className="text-xs text-gray-400 mt-1">필수: destination_url / 선택: title, utm_*, slug, tags</p>
            </>
          )}
        </div>
      ) : null}

      {/* 미리보기 */}
      {preview && status === 'ready' && (
        <div className="space-y-3">
          {preview.errors.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">⚠ 일부 행에 오류 ({preview.errors.length}건)</p>
              {preview.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-xs text-yellow-700">{e}</p>
              ))}
            </div>
          )}
          {preview.links.length > 0 ? (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800">
                  ✓ {preview.links.length}개 링크 준비됨
                </p>
              </div>
              <div className="overflow-x-auto max-h-48 border border-gray-200 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {['슬러그', '제목', 'UTM Source', 'UTM Campaign'].map(h => (
                        <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.links.map((r, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-1.5 font-mono">{r.slug}</td>
                        <td className="px-3 py-1.5">{r.title || '-'}</td>
                        <td className="px-3 py-1.5">{r.utm_source || '-'}</td>
                        <td className="px-3 py-1.5">{r.utm_campaign || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpload} loading={status === 'uploading'} className="flex-1 justify-center">
                  {preview.links.length}개 링크 생성
                </Button>
                <Button variant="secondary" onClick={reset}>취소</Button>
              </div>
            </>
          ) : (
            <Button variant="secondary" onClick={reset} className="w-full justify-center">다시 시도</Button>
          )}
        </div>
      )}

      {/* 결과 */}
      {status === 'done' && uploadResult && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium text-green-800">✓ {uploadResult.success}개 링크 생성 완료</p>
          <Button variant="secondary" size="sm" onClick={reset}>새로 업로드</Button>
        </div>
      )}

      {status === 'error' && uploadResult?.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm text-red-700">{uploadResult.error}</p>
          <Button variant="secondary" size="sm" onClick={reset}>다시 시도</Button>
        </div>
      )}
    </div>
  )
}
