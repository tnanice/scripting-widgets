# Scripting 小组件

用于 iPhone Scripting App 的个人小组件。

## Emby 在播

读取 N100 工作台的多服务器在播接口，显示用户、片名、播放进度和服务器状态；支持小号、中号、大号及离线缓存。

- [安装与使用说明](./Emby在播/README.md)
- [小组件代码 widget.tsx](./Emby在播/widget.tsx)
- [预览入口 index.tsx](./Emby在播/index.tsx)
- [下载发布版本](https://github.com/tnanice/scripting-widgets/releases/latest)

## 下载和更新

1. 登录 GitHub，打开上方的发布版本页面，下载 `EmbyNowPlaying.zip` 并在 iPhone「文件」App 中解压。
2. 在 Scripting 新建「Emby在播」项目，将压缩包中的 `widget.tsx` 和 `index.tsx` 内容复制到同名文件。
3. 运行项目预览，再到桌面添加 Scripting 小组件并选择该项目。
4. 更新时下载最新发布版本，替换项目中的两个文件，再运行项目、关闭预览以请求桌面刷新。无需删除桌面小组件。

如改过服务器地址，请在替换前保存自己的 `BASE_URL`，更新后重新填写。
源码可能比发布包更新，可通过 Code → Download ZIP 下载 main 分支；发布版本以 Releases 为准。
目前为手动更新，不会在手机后台自动安装代码。

仓库为私有，下载需登录有访问权限的 GitHub 账号。代码未包含 Emby API 密钥。
接口已在 N100 验证；iPhone Scripting 的运行与布局尚待真机验证。
