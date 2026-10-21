# Scripting 小组件

用于 iPhone Scripting App 的个人小组件。仓库公开，可通过 Scripting 的「远程来源」功能直接安装和更新。

## Emby 在播

读取 N100 工作台的多服务器在播接口，显示用户、片名、播放进度和服务器状态；支持小号、中号、大号及离线缓存。

- [安装与使用说明](./Emby在播/README.md)
- [小组件代码 widget.tsx](./Emby在播/widget.tsx)
- [项目元数据 script.json](./Emby在播/script.json)

## 远程安装与自动更新（Scripting 原生支持）

Scripting 支持 GitHub 仓库作为「远程来源」，配置一次后 App 自动检查更新，无需手动复制代码：

1. 在 Scripting 新建「Emby在播」项目，首次需复制 `script.json`、`widget.tsx`、`index.tsx`。
2. 项目设置 → 远程来源，填入：
   ```
   https://github.com/tnanice/scripting-widgets/tree/main/Emby在播
   ```
3. 自动更新间隔填 `86400`（每天检查；App 最小 1800 秒）。
4. 之后仓库更新 → 手机 App 检测到新版本即可更新，替换文件由 App 完成。

仓库为公开，任何设备可拉取；代码不含 Emby API 密钥，仅有内网工作台地址（不可从公网访问）。
接口已在 N100 验证；iPhone Scripting 的运行与布局尚待真机验证。
