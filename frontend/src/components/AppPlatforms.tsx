import React from 'react'
import { getApiBaseOrigin } from '@/lib/paymentsHelpers'
import { Button } from '@/components/ui/Button'
import { DownloadCloud, Smartphone, Monitor, Apple, Server, File, FileStack, CreditCard, User } from 'lucide-react'
import { Robot, Stack } from 'phosphor-react'
import useRampedCounters from '@/hooks/useRampedCounters'

type Platform = 'android' | 'ios' | 'windows' | 'macos' | 'linux'

const PLATFORMS: { key: Platform; label: string }[] = [
  { key: 'android', label: 'Android' },
  { key: 'ios', label: 'iOS' },
  { key: 'windows', label: 'Windows' },
  { key: 'macos', label: 'macOS' },
  { key: 'linux', label: 'Linux' },
]

function renderIcon(k: Platform) {
  const cls = 'w-4 h-4 mr-2 inline-block align-middle'
  switch (k) {
    case 'android':
      // use smartphone icon for Android
      return <Smartphone className={cls} />
    case 'ios':
      return <Smartphone className={cls} />
    case 'windows':
      // use monitor for desktop/windows
      return <Monitor className={cls} />
    case 'macos':
      return <Apple className={cls} />
    case 'linux':
      // lucide doesn't include a penguin; use Server as representative
      return <Server className={cls} />
    default:
      return null
  }
}

export default function AppPlatforms({ hideOnPlatform }: { hideOnPlatform?: Partial<Record<Platform, boolean>> }) {
  const [visible, setVisible] = React.useState<Record<Platform, boolean>>(() => {
    const init: Record<Platform, boolean> = { android: false, ios: false, windows: false, macos: false, linux: false }
    if (hideOnPlatform) {
      for (const k of Object.keys(hideOnPlatform) as Platform[]) {
        if (hideOnPlatform[k]) init[k] = false
      }
    }
    return init
  })

  const [stats, setStats] = React.useState({ free_reports: 0, full_reports: 0, ai_policy_reports: 0, total_downloads: 0, total_users: 0, total_subscriptions: 0 })
  const [statsLoaded, setStatsLoaded] = React.useState(false)

  // animated counters hook — returns ramped values matching stats keys when enabled
  const animatedStats = useRampedCounters(stats, statsLoaded)
  const [downloading, setDownloading] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    // fetch stats from the backend origin directly to avoid hitting the frontend dev server
    const apiBase = getApiBaseOrigin() ?? 'http://localhost:8000'
    const url = `${apiBase}/api/v1/stats/summary`
    console.debug('[AppPlatforms] fetching stats summary from', url)
    fetch(url, { method: 'GET', headers: { Accept: 'application/json' } })
      .then(async (r) => {
        if (cancelled) return
        if (!r.ok) {
          const text = await r.text().catch(() => r.statusText || 'error')
          throw { message: text, status: r.status }
        }
        return r.json()
      })
      .then((res) => {
        if (cancelled) return
        try {
          const resObj: unknown = res
          let payload: Record<string, unknown> = {}
          if (resObj && typeof resObj === 'object') {
            const obj = resObj as Record<string, unknown>
            if ('data' in obj && obj.data && typeof obj.data === 'object') {
              payload = obj.data as Record<string, unknown>
            } else {
              payload = obj
            }
          }

          const free = Number((payload['free_reports'] as number) ?? (payload['freeReports'] as number) ?? 0)
          const full = Number((payload['full_reports'] as number) ?? (payload['fullReports'] as number) ?? 0)
          const ai = Number((payload['ai_policy_reports'] as number) ?? (payload['aiPolicyReports'] as number) ?? 0)
          const downloads = Number((payload['total_downloads'] as number) ?? (payload['totalDownloads'] as number) ?? 0)
          const users = Number((payload['total_users'] as number) ?? (payload['user_count'] as number) ?? (payload['totalUsers'] as number) ?? (payload['userCount'] as number) ?? 0)
          const subscriptions = Number((payload['total_subscriptions'] as number) ?? (payload['subscription_count'] as number) ?? (payload['totalSubscriptions'] as number) ?? (payload['subscriptionCount'] as number) ?? 0)

          setStats({ free_reports: free, full_reports: full, ai_policy_reports: ai, total_downloads: downloads, total_users: users, total_subscriptions: subscriptions })
          setStatsLoaded(true)
        } catch (e) {
          console.warn('[AppPlatforms] failed to parse stats response', e, res)
        }
      })
      .catch((err) => {
        console.warn('[AppPlatforms] stats fetch failed', err)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const toggle = (k: Platform) => setVisible((s) => {
    // If user selects iOS, deselect all other platforms (iOS is mutually exclusive)
    if (k === 'ios') {
      const newVal = !s.ios
      return { android: false, ios: newVal, windows: false, macos: false, linux: false }
    }
    // If user selects any other platform, make sure iOS is deselected (mutually exclusive with iOS)
    return { ...s, ios: false, [k]: !s[k] }
  })

  const handleDownload = async () => {
    setDownloading(true)
    try {
      const apiBase = getApiBaseOrigin() ?? 'http://localhost:8000'
      const url = `${apiBase}/api/v1/stats/downloads`
      const r = await fetch(url, { method: 'POST', headers: { Accept: 'application/json' } })
      if (!r.ok) {
        const txt = await r.text().catch(() => r.statusText || 'error')
        throw { message: txt, status: r.status }
      }
      const res = await r.json()
  const newDownloads = (res && (res.total_downloads ?? res.totalDownloads)) ?? null
  setStats((s) => ({ ...s, total_downloads: newDownloads ?? s.total_downloads }))
  if (newDownloads !== null) setStatsLoaded(true)
    } catch {
      // ignore errors, we still increment locally
      setStats((s) => ({ ...s, total_downloads: s.total_downloads + 1 }))
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-10">
  <div className="bg-white rounded-2xl shadow-xl max-w-3xl mx-auto p-10 flex flex-col items-center text-center gap-6">
        <div>
          <h3 className="text-3xl font-semibold">Built for every device</h3>
          <p className="text-lg text-gray-600">We've got you covered no matter your device type or operating system.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          {PLATFORMS.map((p) => (
            <button
              key={p.key}
              onClick={() => toggle(p.key)}
              className={`px-4 py-2 rounded-full border transition-colors ${visible[p.key] ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              <span className="inline-flex items-center">
                {renderIcon(p.key)}
                <span className="align-middle">{p.label}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="w-full flex flex-wrap items-center justify-center gap-8">
          <Button onClick={handleDownload} disabled={downloading} className="bg-green-600 hover:bg-green-700 px-6 flex-shrink-0 whitespace-nowrap" icon={<DownloadCloud className="h-5 w-5 text-white" />}>
            {downloading ? 'Downloading…' : 'Download App'}
          </Button>

          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold">
              {statsLoaded && (
                animatedStats.total_downloads
              )}
            </div>
            <div className="text-lg font-normal text-gray-500 inline-flex items-center gap-2 whitespace-nowrap">
              <Stack className="w-5 h-5 text-gray-500" />
              <span>Downloads</span>
              <div className="text-xs text-gray-400 ml-2">so far</div>
            </div>
          </div>
        </div>

        {/* Short write-up between downloads and stats */}
        <div className="w-full">
          <div className="max-w-2xl mx-auto text-center mt-4 mb-2">
            <p className="text-lg text-gray-600">
              PoliverAI delivers fast, practical reports for quick checks and deep, AI-powered
              policy reviews for thorough compliance. Whether you're running a quick scan or
              generating a full policy report, we've made it simple and reliable — built
              to support teams across devices and platforms.
            </p>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-black inline-flex items-center gap-2 whitespace-nowrap">
              <File className="w-5 h-5 text-gray-600" />
              Free Reports
            </div>
            <div className="text-3xl font-bold">
              {statsLoaded && (
                <>{animatedStats.free_reports} <span className="text-sm font-normal text-gray-500">Reports</span></>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">and counting</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-black inline-flex items-center gap-2 whitespace-nowrap">
              <FileStack className="w-5 h-5 text-gray-600" />
              Full Reports
            </div>
            <div className="text-3xl font-bold">
              {statsLoaded && (
                <>{animatedStats.full_reports} <span className="text-sm font-normal text-gray-500">Reports</span></>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">and counting</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-black inline-flex items-center gap-2 whitespace-nowrap">
              <Robot className="w-5 h-5 text-gray-600" />
              AI Revised Policies
            </div>
            <div className="text-3xl font-bold">
              {statsLoaded && (
                <>{animatedStats.ai_policy_reports} <span className="text-sm font-normal text-gray-500">Policies</span></>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">and counting</div>
          </div>
        </div>

        {/* Additional single stats row: users + subscriptions */}
        <div className="w-full flex justify-center mt-4 gap-8">
          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-black inline-flex items-center gap-2 whitespace-nowrap">
              <User className="w-5 h-5 text-gray-600" />
              Sign Ups
            </div>
            <div className="text-3xl font-bold">
              {statsLoaded && (
                <>{animatedStats.total_users} <span className="text-sm font-normal text-gray-500">Users</span></>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">and counting</div>
          </div>

          <div className="flex flex-col items-center">
            <div className="text-lg font-semibold text-black inline-flex items-center gap-2 whitespace-nowrap">
              <CreditCard className="w-5 h-5 text-gray-600" />
              Subscriptions
            </div>
            <div className="text-3xl font-bold">
              {statsLoaded && (
                <>{animatedStats.total_subscriptions} <span className="text-sm font-normal text-gray-500">Subs</span></>
              )}
            </div>
            <div className="text-xs text-gray-400 mt-1">and counting</div>
          </div>
        </div>
      </div>
    </div>
  )
}
