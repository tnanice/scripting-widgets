import { HStack, VStack, Text, Spacer, Image, ProgressView, Button, Divider, Widget } from "scripting"
import { CycleServerIntent } from "./app_intents"

// 手机需与 N100 在同一局域网，或通过 VPN 访问。无需填写 Emby API Key。
const BASE_URL = "http://192.168.10.250:8899"
const CACHE_KEY = "emby-live-v1:" + BASE_URL
// 切换按钮记住的服务器筛选（共享域，各桌面组件共用）。
export const FILTER_KEY = "emby-live-v1:serverFilter"

type Session = {
  user: string; title: string; sub: string; device: string; client: string
  playing: boolean; paused: boolean; pct: number; trans: string; br: string
}
type Server = {
  id: string; name: string; status: string; sessions: Session[]
  online: number; playing: number
}
type Live = {
  generated_at: string; servers: Server[]
  totals: { servers: number; ok: number; online: number; playing: number }
}

function isLive(value: any): value is Live {
  return value && typeof value.generated_at === "string" && value.generated_at.length > 0
    && Array.isArray(value.servers)
    && value.servers.every((s: any) => typeof s.name === "string" && Array.isArray(s.sessions))
    && value.totals && ["servers", "ok", "online", "playing"]
      .every(key => Number.isFinite(value.totals[key]))
}

// 从 sub（如 "S01E24 “地理人”…"）提取剧集编号 S01E24；无编号返回空串。
function epCode(sub?: string): string {
  if (!sub) return ""
  const m = sub.match(/^S\d+E\d+/)
  return m ? m[0] : ""
}

async function load(): Promise<{ data: Live | null; offline: boolean }> {
  try {
    // 不带 fresh=1：走工作台 10s 缓存 + SWR（过期立返旧值后台重建），毫秒级响应。
    const response = await fetch(BASE_URL + "/api/emby/live", { timeout: 10 })
    if (!response.ok) throw new Error("HTTP " + response.status)
    const data = await response.json()
    if (!isLive(data)) throw new Error("在播接口数据不完整")
    Storage.set(CACHE_KEY, data)
    return { data, offline: false }
  } catch (error) {
    console.log("Emby 在播读取失败：", String(error))
    const cached = Storage.get<Live>(CACHE_KEY)
    return { data: isLive(cached) ? cached : null, offline: true }
  }
}

async function main() {
  const { data, offline } = await load()
  const small = Widget.family === "systemSmall"
  const large = Widget.family === "systemLarge"
  // 筛选优先级：小组件「参数」> 切换按钮记住的选择 > 全部。
  // 参数里可用 "auto" 表示跟随切换按钮。
  const paramRaw = (Widget.parameter || "").trim()
  const paramFilter = paramRaw && paramRaw.toLowerCase() !== "auto"
    ? paramRaw.toLowerCase() : ""
  const storedFilter = (Storage.get<string>(FILTER_KEY) || "").trim().toLowerCase()
  const filter = paramFilter || storedFilter
  // 参数留空或填 auto 跟随切换按钮；填服务器名(如 Nanflix-HO)固定只看该台。
  const servers = (data?.servers || []).filter(s => !filter
    || s.name.toLowerCase() === filter || s.id.toLowerCase() === filter)
  const rows = servers.flatMap(server => server.sessions
    .filter(s => s.playing).map(session => ({ ...session, server: server.name })))
    .sort((a, b) => Number(a.paused) - Number(b.paused))
  const failures = servers.filter(s => s.status !== "ok").length
  const visible = rows.slice(0, small ? 1 : large ? 4 : 1)
  const online = servers.reduce((n, s) => n + (s.online || 0), 0)
  // 大号：固定展示 3 台「外部」服务器（与工作台卡片一致，不含 HO），一屏排完。
  const HIDDEN_LARGE = ["nanflix-ho"]
  const largeServers = (data?.servers || [])
    .filter(s => !HIDDEN_LARGE.includes(s.name.toLowerCase()))
  const largeRows = largeServers.flatMap(server => server.sessions
    .filter(s => s.playing).map(session => ({ ...session, server: server.name })))
    .sort((a, b) => Number(a.paused) - Number(b.paused))
  const accent = "#8BE2AF"
  const muted = "#9DAABC"
  const warning = "#F1BF73"
  const timestamp = data?.generated_at || ""
  const updateText = offline ? "离线缓存 · " + timestamp.slice(5, 16)
    : "更新 " + timestamp.slice(11, 16)
  const emptyTitle = !data ? "无法连接 N100"
    : filter && !servers.length ? "未找到此服务器"
    : failures === servers.length && failures > 0 ? "服务器暂不可用" : "暂无在播"
  const emptySubtitle = !data ? "请连接家庭 Wi-Fi 或 VPN"
    : offline ? "当前显示上次保存的数据"
    : failures ? "部分服务器查询失败" : "有人开始播放后将在下次刷新显示"

  // 切换按钮显示的当前目标：参数优先时显示参数名，否则显示记住的选择。
  const filterLabel = (paramFilter || storedFilter).replace("Nanflix-", "")

  // ===== 大号：工作台卡片式布局 =====
  // 每台服务器一行（名称 + 在播数），下方跟在播会话行；每台最多 3 条，超出折叠 +N。
  if (large) {
    const largeFailures = largeServers.filter(s => s.status !== "ok").length
    const MAX_PLAYS = 3
    Widget.present(
      <VStack alignment="leading" spacing={10}
        padding={{ top: 24, leading: 24, bottom: 22, trailing: 24 }}
        widgetBackground="#101722" foregroundStyle="#F1F5FA">
        <HStack spacing={6}>
          <Image systemName="play.tv.fill" foregroundStyle={accent} />
          <Text font="headline" lineLimit={1}>Emby 在播</Text>
          <Spacer />
          <Text font="caption" foregroundStyle={accent}>{largeRows.length} 在播</Text>
          <Button intent={CycleServerIntent(undefined)} buttonStyle="plain">
            <Image systemName="arrow.2.circlepath" imageScale="small" foregroundStyle={accent} />
          </Button>
        </HStack>
        {largeServers.map((server, i) => {
          const plays = server.sessions.filter(s => s.playing)
          const shown = plays.slice(0, MAX_PLAYS)
          const hidden = plays.length - shown.length
          const shortName = server.name.replace("Nanflix-", "")
          return (
            <VStack key={server.id} alignment="leading" spacing={5}>
              <HStack spacing={6}>
                <Text font="subheadline" fontWeight="bold" foregroundStyle="#F1F5FA" lineLimit={1}>
                  {shortName}
                </Text>
                <Text font="caption2" foregroundStyle={plays.length ? accent : muted}>
                  {plays.length ? `${plays.length} 播放中` : "空闲"}
                </Text>
                {server.status !== "ok" ? <Text font="caption2" foregroundStyle={warning}>异常</Text> : null}
              </HStack>
              {shown.map((p, j) => (
                // 提取剧集编号（S01E24），集名不要。
                // 编号字号比剧名小，底部对齐；行与行之间留一点行距。
                <HStack key={String(j)} spacing={5} alignment="bottom" padding={{ bottom: 2 }}>
                  <Image systemName={p.paused ? "pause.fill" : "play.fill"}
                    imageScale="small" foregroundStyle={p.paused ? warning : accent} />
                  <Text font="subheadline" lineLimit={1}>{p.title || "未知影片"}</Text>
                  {epCode(p.sub) ? <Text font="caption" foregroundStyle={muted} lineLimit={1}>
                    {epCode(p.sub)}
                  </Text> : null}
                  <Spacer />
                  <Text font="caption" foregroundStyle={muted} lineLimit={1}>{p.user}</Text>
                </HStack>
              ))}
              {hidden > 0 ? <Text font="caption2" foregroundStyle={muted}>+{hidden} 个在播</Text> : null}
              {i < largeServers.length - 1 ? <Divider /> : null}
            </VStack>
          )
        })}
        <Spacer minLength={0} />
        <HStack spacing={6}>
          <Text font="caption2" foregroundStyle={offline || largeFailures ? warning : muted} lineLimit={1}>
            {data ? updateText : "等待连接"}{largeFailures ? ` · ${largeFailures} 台异常` : ""}
          </Text>
          <Spacer />
          <Button intent={CycleServerIntent({ action: "refresh" })} buttonStyle="plain">
            <Image systemName="arrow.clockwise" imageScale="small" foregroundStyle={accent} />
          </Button>
        </HStack>
      </VStack>,
      { policy: "after", date: new Date(Date.now() + 2 * 60 * 1000) },
    )
    return
  }

  // ===== 中号：单台服务器 + 切换按钮 =====
  // 一次只看一台（默认 TX；点 ↻ 循环 TX → SJC → US → TX，沿用 serverFilter 记住选择，
  // HO/全部 需在组件「参数」里填）。在播明细直接平铺（大号同款样式），空间充裕。
  if (!small && !large) {
    // 中号专属存储键，与大号的 serverFilter 互不干扰。
    const MED_KEY = "emby-live-v1:mediumServer"
    const MED_ORDER = ["Nanflix-TX", "Nanflix-SJC", "Nanflix-US"]
    let medName = (Storage.get<string>(MED_KEY) || "").trim()
    // 参数优先：填了服务器名就用参数的（含 HO/其他），否则用记住的中号选择，默认 TX。
    const medParam = (Widget.parameter || "").trim()
    const medServer = medParam
      ? (data?.servers || []).find(s =>
          s.name.toLowerCase() === medParam.toLowerCase() || s.id.toLowerCase() === medParam.toLowerCase())
      : ((data?.servers || []).find(s => s.name === medName) || largeServers.find(s => s.name === "Nanflix-TX") || largeServers[0])
    const medPlays = (medServer?.sessions || []).filter(s => s.playing)
    const medLabel = (medServer?.name || "…").replace("Nanflix-", "")
    const medFail = medServer && medServer.status !== "ok"
    Widget.present(
      <VStack alignment="leading" spacing={8}
        padding={{ top: 24, leading: 24, bottom: 22, trailing: 24 }}
        widgetBackground="#101722" foregroundStyle="#F1F5FA">
        <HStack spacing={6}>
          <Image systemName="play.tv.fill" foregroundStyle={accent} />
          <Text font="headline" lineLimit={1}>Emby 在播</Text>
          <Spacer />
          <Text font="caption" foregroundStyle={accent}>{medPlays.length} 在播</Text>
          <Button intent={CycleServerIntent({ action: "cycleMedium" })} buttonStyle="plain">
            <HStack spacing={2}>
              <Image systemName="arrow.2.circlepath" imageScale="small" foregroundStyle={accent} />
              <Text font="caption2" foregroundStyle={accent} lineLimit={1}>{medLabel}</Text>
            </HStack>
          </Button>
        </HStack>
        {medServer == null ? <VStack alignment="leading" spacing={5}>
          <Text font="title3" fontWeight="semibold">未找到此服务器</Text>
          <Text font="caption2" foregroundStyle={muted} lineLimit={2}>请检查组件「参数」里填写的名称</Text>
        </VStack> : <>
          {medFail ? <Text font="caption2" foregroundStyle={warning} lineLimit={1}>服务器查询异常，显示可能不完整</Text> : null}
          {medPlays.length ? medPlays.map((p, j) => (
            <VStack key={String(j)} alignment="leading" spacing={4}>
              <HStack spacing={5} alignment="bottom" padding={{ bottom: 2 }}>
                <Image systemName={p.paused ? "pause.fill" : "play.fill"}
                  imageScale="small" foregroundStyle={p.paused ? warning : accent} />
                <Text font="subheadline" lineLimit={1}>{p.title || "未知影片"}</Text>
                {epCode(p.sub) ? <Text font="caption" foregroundStyle={muted} lineLimit={1}>
                  {epCode(p.sub)}
                </Text> : null}
                <Spacer />
                <Text font="caption" foregroundStyle={muted} lineLimit={1}>{p.user}</Text>
              </HStack>
            </VStack>
          )) : <VStack alignment="leading" spacing={5}>
            <Text font="title3" fontWeight="semibold">暂无在播</Text>
            <Text font="caption2" foregroundStyle={muted} lineLimit={1}>有人开始播放后将在下次刷新显示</Text>
          </VStack>}
        </>}
        <Spacer minLength={0} />
        <HStack spacing={6}>
          <Text font="caption2" foregroundStyle={offline || medFail ? warning : muted} lineLimit={1}>
            {data ? updateText : "等待连接"}{medFail ? " · 台异常" : ""}
          </Text>
          <Spacer />
          <Button intent={CycleServerIntent({ action: "refresh" })} buttonStyle="plain">
            <Image systemName="arrow.clockwise" imageScale="small" foregroundStyle={accent} />
          </Button>
        </HStack>
      </VStack>,
      { policy: "after", date: new Date(Date.now() + 2 * 60 * 1000) },
    )
    return
  }

  // ===== 小号 / 中号：原有布局 =====
  Widget.present(
    <VStack alignment="leading" spacing={large ? 12 : 8}
      padding={{ top: 24, leading: 24, bottom: 22, trailing: 24 }}
      widgetBackground="#101722" foregroundStyle="#F1F5FA">
      <HStack spacing={6}>
        <Image systemName="play.tv.fill" foregroundStyle={accent} />
        <Text font="headline" lineLimit={1}>Emby 在播</Text>
        <Spacer />
        {!small ? <Text font="caption" foregroundStyle={accent}>{rows.length} 在播</Text> : null}
        <Button intent={CycleServerIntent(undefined)} buttonStyle="plain">
          <HStack spacing={2}>
            <Image systemName="arrow.2.circlepath" imageScale="small" foregroundStyle={accent} />
            {filterLabel ? <Text font="caption2" foregroundStyle={accent} lineLimit={1}>{filterLabel}</Text> : null}
          </HStack>
        </Button>
      </HStack>
      {!small ? <Text font="caption2" foregroundStyle={muted} lineLimit={1}>
        {filterLabel || "NANFLIX"} · {servers.length - failures}/{servers.length} 台正常 · {online} 在线
      </Text> : null}
      {visible.length ? visible.map((row, i) => (
        <VStack key={String(i)} alignment="leading" spacing={3}>
          <HStack spacing={4}>
            <Text font="caption2" foregroundStyle={row.paused ? warning : accent} lineLimit={1}>
              {row.paused ? "暂停" : "播放"} · {row.user}
            </Text>
            <Spacer />
            {!small ? <Text font="caption2" foregroundStyle={muted} lineLimit={1}>
              {row.server.replace("Nanflix-", "")}
            </Text> : null}
          </HStack>
          <Text font="subheadline" fontWeight="semibold" lineLimit={1}>{row.title || "未知影片"}</Text>
          {!small ? <Text font="caption2" foregroundStyle={muted} lineLimit={1}>
            {[row.sub, row.device || row.client, row.trans].filter(Boolean).join(" · ")}
          </Text> : null}
          <HStack spacing={6}>
            <ProgressView value={Math.max(0, Math.min(100, Number(row.pct) || 0))} total={100} tint={accent} />
            <Text font="caption2" foregroundStyle={muted}>{Math.max(0, Math.min(100, Number(row.pct) || 0))}%</Text>
          </HStack>
        </VStack>
      )) : <VStack alignment="leading" spacing={5}>
        <Text font="title3" fontWeight="semibold">{emptyTitle}</Text>
        <Text font="caption2" foregroundStyle={muted} lineLimit={2}>{emptySubtitle}</Text>
      </VStack>}
      <Spacer minLength={0} />
      <HStack spacing={6}>
        <Text font="caption2" foregroundStyle={offline || failures ? warning : muted} lineLimit={1}>
          {data ? updateText : "等待连接"}{failures ? ` · ${failures} 台异常` : ""}
          {rows.length > visible.length ? ` · 另 ${rows.length - visible.length} 个在播` : ""}
        </Text>
        <Spacer />
        <Button intent={CycleServerIntent({ action: "refresh" })} buttonStyle="plain">
          <Image systemName="arrow.clockwise" imageScale="small" foregroundStyle={accent} />
        </Button>
      </HStack>
    </VStack>,
    { policy: "after", date: new Date(Date.now() + 2 * 60 * 1000) },
  )
}

main()
