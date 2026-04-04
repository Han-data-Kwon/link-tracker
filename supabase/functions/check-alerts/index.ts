import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? ''
const FROM_EMAIL     = Deno.env.get('ALERT_FROM_EMAIL') ?? 'alerts@example.com'

// ──────────────────────────────────────────────
// 이메일 발송 (Resend API 사용)
// ──────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Resend error: ${err}`)
  }
  return res.json()
}

// ──────────────────────────────────────────────
// 마지막 발송 시각 조회 (alert_logs 기준)
// ──────────────────────────────────────────────
async function getLastSentAt(alertId: string): Promise<Date | null> {
  const { data } = await supabase
    .from('alert_logs')
    .select('created_at')
    .eq('alert_id', alertId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data ? new Date(data.created_at) : null
}

// ──────────────────────────────────────────────
// traffic_spike 조건 체크
// 최근 1시간 클릭 수 >= 지난 7일 시간당 평균 * threshold
// 중복 방지: 마지막 발송 후 1시간이 지나야 재발송
// ──────────────────────────────────────────────
async function checkTrafficSpike(alert: Record<string, unknown>): Promise<boolean> {
  const alertId   = alert.id as string
  const linkId    = alert.link_id as string
  const threshold = Number(alert.threshold)
  const now       = new Date()
  const oneHourAgo    = new Date(now.getTime() - 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // 중복 발송 방지: 마지막 발송 후 1시간 미경과 시 스킵
  const lastSent = await getLastSentAt(alertId)
  if (lastSent && now.getTime() - lastSent.getTime() < 60 * 60 * 1000) {
    return false
  }

  const [{ count: recentCount }, { count: baseCount }] = await Promise.all([
    supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('link_id', linkId)
      .gte('clicked_at', oneHourAgo.toISOString()) as Promise<{ count: number }>,
    supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('link_id', linkId)
      .gte('clicked_at', sevenDaysAgo.toISOString())
      .lt('clicked_at', oneHourAgo.toISOString()) as Promise<{ count: number }>,
  ])

  // 7일(168시간 - 1시간)동안의 시간당 평균
  const hourlyAvg = (baseCount ?? 0) / 167
  if (hourlyAvg === 0) return (recentCount ?? 0) >= threshold

  return (recentCount ?? 0) >= hourlyAvg * threshold
}

// ──────────────────────────────────────────────
// no_traffic 조건 체크
// 최근 threshold 시간 동안 클릭 0
// 중복 방지: 마지막 발송 후 threshold 시간이 지나야 재발송
// ──────────────────────────────────────────────
async function checkNoTraffic(alert: Record<string, unknown>): Promise<boolean> {
  const alertId = alert.id as string
  const linkId  = alert.link_id as string
  const hours   = Number(alert.threshold)
  const now     = new Date()
  const since   = new Date(now.getTime() - hours * 60 * 60 * 1000)

  // 중복 발송 방지: 마지막 발송 후 threshold 시간 미경과 시 스킵
  const lastSent = await getLastSentAt(alertId)
  if (lastSent && now.getTime() - lastSent.getTime() < hours * 60 * 60 * 1000) {
    return false
  }

  const { count } = await supabase
    .from('clicks')
    .select('*', { count: 'exact', head: true })
    .eq('link_id', linkId)
    .gte('clicked_at', since.toISOString())

  return (count ?? 0) === 0
}

// ──────────────────────────────────────────────
// 메인 핸들러
// ──────────────────────────────────────────────
Deno.serve(async (_req) => {
  try {
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*, links(title, slug, full_url)')
      .eq('is_active', true)

    if (error) throw error
    if (!alerts || alerts.length === 0) {
      return new Response(JSON.stringify({ checked: 0 }), { status: 200 })
    }

    const results: { alertId: string; triggered: boolean; error?: string }[] = []

    for (const alert of alerts) {
      try {
        let triggered = false
        if (alert.alert_type === 'traffic_spike') {
          triggered = await checkTrafficSpike(alert)
        } else if (alert.alert_type === 'no_traffic') {
          triggered = await checkNoTraffic(alert)
        }

        if (!triggered) {
          results.push({ alertId: alert.id, triggered: false })
          continue
        }

        const link      = alert.links as Record<string, string>
        const typeLabel = alert.alert_type === 'traffic_spike' ? '트래픽 급증' : '트래픽 없음'
        const subject   = `[Link Tracker 레이더] ${link.title || link.slug} - ${typeLabel} 감지`
        const html      = `
          <h2>캠페인 레이더 알림</h2>
          <p><strong>링크:</strong> ${link.title || link.slug} (<code>/r/${link.slug}</code>)</p>
          <p><strong>조건:</strong> ${
            alert.alert_type === 'traffic_spike'
              ? `최근 1시간 클릭이 평균 대비 <strong>${alert.threshold}배</strong> 이상 발생`
              : `최근 <strong>${alert.threshold}시간</strong> 동안 클릭 없음`
          }</p>
          <p><strong>감지 시각:</strong> ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
          <hr/>
          <p style="color:#888;font-size:12px">Link Tracker 자동 발송 메일입니다.</p>
        `

        await sendEmail(alert.recipient_email, subject, html)

        await supabase.from('alert_logs').insert({
          alert_id: alert.id,
          details: {
            alert_type: alert.alert_type,
            threshold:  alert.threshold,
            link_slug:  link.slug,
            link_title: link.title,
          },
        })

        results.push({ alertId: alert.id, triggered: true })
      } catch (err) {
        results.push({ alertId: alert.id, triggered: false, error: String(err) })
      }
    }

    return new Response(JSON.stringify({ checked: alerts.length, results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
