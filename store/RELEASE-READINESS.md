# Lorkan1 0.4.0 beta — 提交前状态

## 已准备

- MV3 ZIP：manifest位于根目录；匹配 `frontwars.io` 和 `www.frontwars.io`，不再匹配错误的 `.org`。
- 功能性本机胜者研究室、明确同意后导入JSON、报告保存和清除；附带真实本地完整对局样本。
- 16/32/48/128 PNG图标；真实研究室界面的1280×800截图。
- 隐私页面、单一用途说明、权限说明、非官方声明、商店介绍和支持链接。
- 静态检查、真实记录解析、未决/伪造胜者拒绝、DOM菜单路由测试通过；浏览器实际加载样本复盘成功。

## 不能宣传为已完成的能力

- 当前没有经过验证的 FrontWars.io 官方对局自动托管适配器；不能声称换域名即兼容。
- 不支持自动解析当前 FrontWars 原生回放，不自动抓取官方全站比赛。
- 未取得当前 FrontWars 服务器AI源码。公开归档代码不能代表线上最新版。
- 原子弹/氢弹/MIRV等能力证据来自本地完整OpenFront测试，不是官方FrontWars对战证据。
- 尚未在用户Chrome中实际安装这个0.4版本；前面的桌面控制因无法可靠判断浏览器URL而被中止。

## Chrome Web Store 待用户完成

1. 注册开发者账号、完成必要的开发者信息与两步验证。首次注册涉及费用和协议，由账号持有人完成。
2. 将本研究版功能范围与是否先发布测试版确认后，上传ZIP、隐私URL、介绍及截图。不要把未实现的官方托管写成已支持。
3. 提交审核；能否通过以Google审核为准。目前未上传、未提交、未上架。

## 审核员复现

加载ZIP中的扩展目录，点击工具栏图标 → 胜者研究室 → 查看随附实测胜者样本。
无需账号即可复现报告；样本来自本地游戏。导入自有文件前必须勾选本机处理同意框；支持格式明确写在界面中。
打开FrontWars.io，检查可收起菜单和“检查页面适配状态”；应明确报告官方状态读取、指令发送和原生回放导入尚未验证，不自动点击游戏。
本地实验AI需要另行启动已打补丁的OpenFront客户端；商店复盘功能不依赖本地服务。

官方文档：
- https://developer.chrome.com/docs/webstore/register/
- https://developer.chrome.com/docs/webstore/publish/
- https://developer.chrome.com/docs/webstore/program-policies/policies
- https://developer.chrome.com/docs/webstore/images
