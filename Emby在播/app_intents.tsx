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

// 中号在播明细展开/收起：直接翻转记住的状态（Button 意图，与 ↻ 同模式）。
export const TogglePlaysIntent = AppIntentManager.register({
  name: "TogglePlaysIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async () => {
    const KEY = "emby-live-v1:showPlays"
    const current = Storage.get<boolean>(KEY) || false
    Storage.set(KEY, !current)
    Widget.reloadUserWidgets()
  }
})
