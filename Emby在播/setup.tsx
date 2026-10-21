// Emby 在播 · 安装/更新向导
// 用途：在手机 Scripting 中为本项目配置「远程来源」，之后 App 会自动从 GitHub 拉取更新。
// 本文件自身不需要参与远程更新；若已有项目且已配置远程来源，运行此文件仅作检查提示。
import { Script } from "scripting"

async function main() {
  const meta = Script.metadata
  const remote = (meta as any)?.remoteResource as
    | { url?: string; autoUpdateInterval?: number }
    | undefined
  console.log("脚本名称:", meta.localizedName || Script.name)
  if (remote?.url) {
    console.log("远程来源已配置:", remote.url)
    console.log("自动检查间隔(秒):", remote.autoUpdateInterval ?? "未设置(不自动检查)")
    console.log("说明: App 会在打开时按间隔检查更新; 也可在脚本设置中手动「检查更新」。")
  } else {
    console.log("尚未配置远程来源。请在 Scripting 中:")
    console.log("1. 长按本项目 → 设置/编辑脚本信息")
    console.log("2. 找到「远程来源 / Remote Source」")
    console.log("3. 填入: https://github.com/tnanice/scripting-widgets/tree/main/Emby在播")
    console.log("   (App 会把 tree 后第一段当 revision，选 main 分支)")
    console.log("4. 自动更新间隔填 86400 (秒, 即每天检查; 最小 1800)")
    console.log("5. 保存后 App 即可检查/拉取更新，无需再手动复制代码")
  }
}

main().then(() => Script.exit())
