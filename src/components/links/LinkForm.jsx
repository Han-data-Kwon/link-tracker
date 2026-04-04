import { useState } from 'react'
import { buildUtmUrl } from '../../lib/utm'
import { generateSlug, isValidSlug } from '../../lib/slug'
import { useCreateLink } from '../../hooks/useLinks'
import { useTags } from '../../hooks/useTags'
import Button from '../ui/Button'
import Input from '../ui/Input'

const EMPTY_UTM = { source: '', medium: '', campaign: '', term: '', content: '' }

export default function LinkForm({ onSuccess }) {
  const [form, setForm] = useState({
    destinationUrl: '',
    title: '',
    slug: '',
    utm: { ...EMPTY_UTM },
    tagIds: [],
  })
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState({})

  const { data: tags = [] } = useTags()
  const createLink = useCreateLink()

  function set(field, value) {
    const next = { ...form, [field]: value }
    setForm(next)
    if (next.destinationUrl) {
      setPreview(buildUtmUrl(next.destinationUrl, next.utm))
    }
  }

  function setUtm(field, value) {
    const nextUtm = { ...form.utm, [field]: value }
    setForm(prev => ({ ...prev, utm: nextUtm }))
    if (form.destinationUrl) {
      setPreview(buildUtmUrl(form.destinationUrl, nextUtm))
    }
  }

  function validate() {
    const e = {}
    if (!form.destinationUrl) e.destinationUrl = 'URL을 입력하세요'
    else { try { new URL(form.destinationUrl) } catch { e.destinationUrl = '올바른 URL을 입력하세요' } }
    if (form.slug && !isValidSlug(form.slug)) e.slug = '영문/숫자/- 3~50자'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    try {
      await createLink.mutateAsync({
        destinationUrl: form.destinationUrl,
        title: form.title,
        utm: form.utm,
        slug: form.slug || generateSlug(),
        tagIds: form.tagIds,
      })
      setForm({ destinationUrl: '', title: '', slug: '', utm: { ...EMPTY_UTM }, tagIds: [] })
      setPreview('')
      onSuccess?.()
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  function toggleTag(id) {
    setForm(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter(t => t !== id)
        : [...prev.tagIds, id],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">기본 정보</h3>
        <Input
          label="목적지 URL *"
          placeholder="https://example.com/page"
          value={form.destinationUrl}
          onChange={e => set('destinationUrl', e.target.value)}
          error={errors.destinationUrl}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="링크 제목"
            placeholder="봄 이벤트 랜딩페이지"
            value={form.title}
            onChange={e => set('title', e.target.value)}
          />
          <Input
            label="슬러그 (비워두면 자동생성)"
            placeholder="spring-2024"
            value={form.slug}
            onChange={e => set('slug', e.target.value)}
            error={errors.slug}
          />
        </div>
      </div>

      {/* UTM 파라미터 */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">UTM 파라미터</h3>
        <div className="grid grid-cols-2 gap-4">
          <Input label="utm_source" placeholder="google" value={form.utm.source}   onChange={e => setUtm('source',   e.target.value)} />
          <Input label="utm_medium" placeholder="cpc"    value={form.utm.medium}   onChange={e => setUtm('medium',   e.target.value)} />
        </div>
        <Input label="utm_campaign" placeholder="spring2024" value={form.utm.campaign} onChange={e => setUtm('campaign', e.target.value)} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="utm_term"    placeholder="키워드"  value={form.utm.term}    onChange={e => setUtm('term',    e.target.value)} />
          <Input label="utm_content" placeholder="banner1" value={form.utm.content} onChange={e => setUtm('content', e.target.value)} />
        </div>
      </div>

      {/* 태그 */}
      {tags.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">태그</h3>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors`}
                style={
                  form.tagIds.includes(tag.id)
                    ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
                    : { backgroundColor: 'transparent', color: tag.color, borderColor: tag.color }
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 미리보기 */}
      {preview && (
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">최종 URL 미리보기</p>
          <p className="text-xs text-gray-800 break-all font-mono">{preview}</p>
        </div>
      )}

      {errors.submit && (
        <p className="text-sm text-red-500">{errors.submit}</p>
      )}

      <Button type="submit" loading={createLink.isPending} className="w-full justify-center">
        링크 생성
      </Button>
    </form>
  )
}
