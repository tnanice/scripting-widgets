import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

// 服务器切换（中/大号 ↻ 按钮）：循环 全部 → HO → TX → SJC → US → 全部…
export const CycleServerIntent = AppIntentManager.register({
  name: "CycleServerIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    const KEY = "emby-live-v1:serverFilter"
    const ORDER = ["", "Nanflix-HO", "Nanflix-TX", "Nanflix-SJC", "Nanflix-US"]
    const current = Storage.get<string>(KEY) || ""
    const idx = ORDER.indexOf(current)
    const next = ORDER[(idx + 1) % ORDER.length]
    Storage.set(KEY, next)
    Widget.reloadUserWidgets()
  }
})

// 中号在播明细展开/收起（Toggle）：记住状态，各中号组件共享。
export const TogglePlaysIntent = AppIntentManager.register({
  name: "TogglePlaysIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async ({ expand }: { expand: boolean }) => {
    Storage.set("emby-live-v1:showPlays", expand)
    Widget.reloadUserWidgets()
  }
})
