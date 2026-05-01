import { useState } from 'react'
import { buildUtmUrl } from '../../lib/utm'
import { generateSlug, isValidSlug } from '../../lib/slug'
import { useCreateLink } from '../../hooks/useLinks'
import { useTags, useCreateTag } from '../../hooks/useTags'
import Button from '../ui/Button'
import Input from '../ui/Input'

const TAG_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#06b6d4']

const EMPTY_UTM = { source: '', medium: '', campaign: '', term: '', content: '' }

export default function LinkForm({ onSuccess }) {
  const [form, setForm] = useState({
    destinationUrl: '',
    title: '',
    slug: '',
    utm: { ...EMPTY_UTM },
    tagIds: [],
  })
  const [preview, setPreview]         = useState('')
  const [errors, setErrors]           = useState({})
  const [newTagName, setNewTagName]   = useState('')
  const [newTagColor, setNewTagColor] = useState('#6366f1')
  const [showNewTag, setShowNewTag]   = useState(false)

  const { data: tags = [] } = useTags()
  const createLink = useCreateLink()
  const createTag  = useCreateTag()

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
      setShowNewTag(false)
      onSuccess?.()
    } catch (err) {
      setErrors({ submit: err.message })
    }
  }

  async function handleCreateTag() {
    if (!newTagName.trim()) return
    try {
      const tag = await createTag.mutateAsync({ name: newTagName.trim(), color: newTagColor })
      setForm(prev => ({ ...prev, tagIds: [...prev.tagIds, tag.id] }))
      setNewTagName('')
      setNewTagColor('#6366f1')
      setShowNewTag(false)
    } catch (err) {
      setErrors(prev => ({ ...prev, newTag: err.message }))
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
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">태그</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className="px-3 py-1 rounded-full text-xs font-medium border transition-colors"
              style={
                form.tagIds.includes(tag.id)
                  ? { backgroundColor: tag.color, color: '#fff', borderColor: tag.color }
                  : { backgroundColor: 'transparent', color: tag.color, borderColor: tag.color }
              }
            >
              {tag.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowNewTag(v => !v)}
            className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-gray-400 text-gray-500 hover:border-gray-600 hover:text-gray-700 transition-colors"
          >
            + 새 태그
          </button>
        </div>

        {showNewTag && (
          <div className="flex items-center gap-2 mt-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              placeholder="태그 이름"
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateTag())}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
            <div className="flex gap-1">
              {TAG_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewTagColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition-all ${newTagColor === c ? 'border-gray-800 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleCreateTag}
              disabled={createTag.isPending || !newTagName.trim()}
              className="px-2 py-1.5 text-xs bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              추가
            </button>
          </div>
        )}
        {errors.newTag && <p className="text-xs text-red-500">{errors.newTag}</p>}
      </div>

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
