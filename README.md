# Lorkan1

OpenFront 四策略本地引擎对战回放。直接打开 index.html，无需启动服务器或联网。现代 Chrome 支持内置 gzip 解压。默认16倍速，从追加赛第25局开始；可选择全部72局。

GitHub Pages：仓库 Settings → Pages → Deploy from a branch → main / (root)。

## 实测结果

{
  "极速扩张": 2,
  "经济优先": 49,
  "军事突袭": 0,
  "均衡外交": 6
}

未决 15 局。原24局加新48局，两个新批次分别轮换24种出生排列和引擎种子。固定地图、手写策略；不能推出对真人、其他地图或其他策略的普遍实力结论。四个视角观察同一场比赛，地图信息一致。

## 来源和复现

引擎：https://github.com/openfrontio/OpenFrontIO
固定提交：030274df6e377a57e784a9f6f9865720b0dfbbba
引擎及其源码遵循上游 AGPL-3.0 和素材许可。本项目不打包引擎或上游游戏素材。
将 tournament.ts 放到该版本引擎根目录；按照上游说明安装依赖；在引擎两级上方创建 outputs 并放入 results-first24.json；设置 ROUNDS=48，执行 node --import tsx tournament.ts。策略只提交合法意图，由引擎验证和执行；18000刻无引擎胜者记未决。

## Chrome 小菜单

extension 是 Manifest V3 扩展源码。Chrome 扩展管理页开启开发者模式后加载 extension 文件夹（需用户自行安装）。FrontWars 官方页面仅显示回放入口；本地页面可启动四策略自动赛。不是官方服代打插件，也尚未接管原版客户端。

### 本地自动赛服务

本机已配置的引擎在 work/OpenFrontIO。运行 node local-service.cjs，再访问 http://127.0.0.1:8765/；扩展菜单的本地自动赛按钮调用该服务。其他电脑需将 OPENFRONT_DIR 设为已安装依赖且放入 tournament.ts 的引擎目录，并按上文放置 outputs/results-first24.json。状态显示在 /api/status。此功能运行四策略自动赛，不接管官方游戏客户端。
