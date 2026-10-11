# 贡献 / Contributing

欢迎小而明确的贡献：双语表达、键盘/触屏体验、一个受控的反例、独立数据审计。先说明问题与预期效果，再修改；不要为了贡献制造无意义的 issue。

Useful small contributions: bilingual wording, keyboard/touch access, a controlled counterexample or an independent data audit. Explain the problem and expected behavior; avoid manufactured issues.

改变模型或参数后运行 `node test.cjs`、`node benchmark.cjs` 和 `python verify.py`，对照旧结果并说明变化。只有更新了基准才重新生成数据；正常校验使用 `--check`。

For model changes run `node test.cjs`, `node benchmark.cjs` and `python verify.py`, compare against prior results and explain the change. Normal verification uses `--check`; regenerate only for deliberate baseline updates.

新界面文字同时提供中文/英语。保留来源和许可证。贡献应明确区分你的工作、AI 辅助和第三方实现。

Provide both Chinese and English for UI text, retain attribution/licenses, and distinguish your work, AI assistance and third-party code.
