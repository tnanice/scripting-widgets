import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

// 服务器切换：点一下循环 全部 → HO → TX → SJC → US → 全部…
// 选择持久化在 Storage（共享域），不同桌面组件共享同一个选择。
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
    Widget.reloadAll()
  }
})
