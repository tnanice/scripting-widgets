import { AppIntentManager, AppIntentProtocol, Widget } from "scripting"

// 小组件动作意图（Button 触发；CycleServerIntent 自 v0.2.0 起在真机可用）：
// - 无参数 / 其他：循环服务器筛选 全部 → HO → TX → SJC → US → 全部（大号 ↻）
// - { action: "cycleMedium" }：中号单台视图循环 TX → SJC → US → TX
// 不新增意图名：新意图（如 v0.4.x 的 TogglePlaysIntent）在设备上疑似未注册，
// 引用它的 Button 会整个不渲染——复用已注册的意图名最稳。
export const CycleServerIntent = AppIntentManager.register({
  name: "CycleServerIntent",
  protocol: AppIntentProtocol.AppIntent,
  perform: async (params?: { action?: string }) => {
    if (params?.action === "cycleMedium") {
      const KEY = "emby-live-v1:mediumServer"
      const ORDER = ["Nanflix-TX", "Nanflix-SJC", "Nanflix-US"]
      const current = Storage.get<string>(KEY) || ORDER[0]
      Storage.set(KEY, ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
    } else {
      const KEY = "emby-live-v1:serverFilter"
      const ORDER = ["", "Nanflix-HO", "Nanflix-TX", "Nanflix-SJC", "Nanflix-US"]
      const current = Storage.get<string>(KEY) || ""
      Storage.set(KEY, ORDER[(ORDER.indexOf(current) + 1) % ORDER.length])
    }
    Widget.reloadUserWidgets()
  }
})
