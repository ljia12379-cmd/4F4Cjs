# LJC 云服务器 · 官网

一个纯静态的 Minecraft 服务器官网（无框架、无构建步骤），设计语言取自 Vercel 风格设计模板：
墨黑主色 + 灰阶表面 + 网格渐变装饰，Inter / JetBrains Mono 字体，堆叠阴影与 100px 药丸 CTA。
**默认深色主题**，导航栏右上角可一键切换浅色，选择会记在浏览器里。

## 文件结构

```
服务器官网项目/
├─ index.html        首页：Hero、实时状态、特色、机械动力、生电、进服三步、社区、FAQ 预览
├─ modes.html        玩法：机械动力 / 生电技术 / 生存与秩序 / 活动与比赛 / 玩法边界
├─ join.html         进服指南：准备清单、四步进服、整合包、皮肤站、报错排查表
├─ rules.html        服务器规则：条款、处罚梯度、申诉
├─ faq.html          常见问题：进服 / 账号与皮肤 / 玩法与技术 / 管理与申诉
├─ assets/
│  ├─ css/style.css  设计系统（tokens + 组件 + 响应式 + 深色主题），全站唯一样式表
│  ├─ js/main.js     交互：主题切换、复制地址、实时状态、移动端导航、FAQ 手风琴、滚动淡入
│  └─ img/
│     ├─ logo.svg        导航与页脚用的等距立方体标识
│     └─ favicon.svg     站点图标（深底白立方）
├─ _preview/         各页整页渲染截图（深色 / 浅色各一套，部署时可整个删掉）
└─ README.md
```

## 主题（深色 / 浅色）

- **默认深色**。想改成跟随系统或默认浅色：编辑每个 HTML 里 `<head>` 中那段 `主题引导` 内联脚本的 `var t = "dark";`：
  - 跟随系统：`var t = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";`
  - 默认浅色：`var t = "light";`
  这段脚本在首次绘制前执行，所以不会出现「先白后黑」的闪屏。
- 用户在导航右上角点圆形按钮即可切换，选择存在 `localStorage["ljc-theme"]`，刷新后保持。
- 站点级配色全部走 `style.css` 顶部的 token：`:root` 是浅色，`:root[data-theme="dark"]` 是深色。
  组件只引用变量（包括网格渐变过渡色 `--fade-*`、终端 `--terminal-*`、极性翻转带 `--invert-*`），
  所以想微调深色只需改那一段，不用碰组件。
- 终端 / 代码块在两个主题下都保持深色（设计规范里的 code-editor-mockup 是固定的技术层表面）。
- 深色下网格渐变会自动收敛（`opacity .3`，结尾 CTA 带 `.22`），避免在黑底上过亮。

## 本地预览

直接双击 `index.html` 即可（所有资源都是相对路径）。若要看实时状态接口，建议用本地服务器打开，
例如在该目录执行 `python -m http.server 8080`，然后访问 `http://localhost:8080`。

`_preview/` 里是五个页面的整页截图，深色（`*-dark.png`）与浅色（`*-light.png`）各一套，
外加一张 500px 宽的手机版截图，方便不开浏览器时快速看效果。

## 部署

把整个目录上传到任意静态托管即可：Nginx / Apache、宝塔、GitHub Pages、Vercel、Netlify、对象存储（OSS/COS）。
无需 Node 环境，也没有构建产物。

## 需要你替换/确认的内容

| 位置 | 说明 |
| --- | --- |
| `assets/js/main.js` 顶部 `SITE` 对象 | `ip`、`port`、`qqGroup`、`statusApi`。改这里即可全局生效 |
| 各页 HTML 里出现的地址 / 群号 | 复制按钮的 `data-copy` 属性、终端块、页脚，如需改地址请全局搜索 `mc.ljcyun.xyz` 与 `1064599211` |
| 整合包下载 | 目前引导到 QQ 群文件（`join.html#pack`）。若已有直链，把「复制群号，进群下载」按钮换成 `<a class="btn btn--primary" href="你的下载链接">` |
| 皮肤站地址 | 目前写成「见 QQ 群公告」。有独立域名后，替换 `join.html#skin` 里三张卡片的说明并加链接 |
| 卡片封面图 | `index.html`、`modes.html` 的生电卡片是渐变占位图。把实机截图放进 `assets/img/`，替换 `.card__media` 内的渐变层即可 |
| 模组清单 | `index.html`、`modes.html` 的终端块里是示意性模组名，请按实际整合包清单校正 |
| 规则条款与处罚梯度 | `rules.html` 中为通用模板，请按服务器实际执行标准调整 |
| 服务器起始年份 | 页脚版权年份由 JS 自动取当前年，无写死 |

## 设计系统速查（改样式先看这里）

- **颜色**：`--primary #171717`（唯一主 CTA 色）、`--ink / --body / --mute` 三级文本、`--hairline #ebebeb` 分割线、
  `--canvas / --canvas-soft / --canvas-soft-2` 表面阶梯，以及三对品牌渐变 `--g-develop / --g-preview / --g-ship`。
  深色主题只覆盖这批 token（见文件顶部 `:root[data-theme="dark"]`），组件不必改。
- **字体**：`--font-sans`（Inter + 系统中文字体回退）、`--font-mono`（JetBrains Mono，用于技术标签与终端块）。
  字体通过 Google Fonts 加载；离线环境会自动回退到系统字体，不影响布局。
- **圆角**：营销 CTA 用 `--r-pill` 100px；导航级按钮 `--r-sm` 6px；卡片 `--r-md` 8px / `--r-lg` 12px。
- **海拔**：`--e1`–`--e5` 五级堆叠阴影（都是「小偏移叠加 + 内描边」，不要改成单层大模糊投影）。
- **网格渐变**：`.mesh > .mesh__canvas + .mesh__fade`（底部向上淡出用 `.mesh__fade--up`），
  只在 Hero 与结尾 CTA 这类大尺度使用，不要缩小成图标。
- **动效**：滚动淡入用 `data-reveal` / `data-reveal-delay`，已适配 `prefers-reduced-motion`。

## 无障碍与兼容

- 语义化标签、`skip-link`、`aria-current` 当前页标记、`aria-expanded` 移动菜单、表单与按钮均有可见焦点环。
- 主题切换按钮带 `aria-label` 与 `aria-pressed`，键盘可达；深色下同步更新 `<meta name="theme-color">`，
  并在 `:root[data-theme="dark"]` 上设置 `color-scheme: dark`（滚动条、表单控件跟随系统深色）。
- 断点：< 640px 单列、640–899px 两列、≥ 900px 三/四列；导航在 < 800px 折叠为浮层菜单。
- 实时状态来自公开接口 `api.mcsrvstat.us`，请求失败或超时会静默降级为「未知」，不影响其它功能。
- 禁用 JavaScript 时不会有主题切换按钮，页面回落为浅色主题，其余内容完全可用。
