# 从教学实验到独立研究 / From playground to independent study

当前版本已经完成浏览器对照、基准数据和模型检查。下列是尚未实现的研究任务。

The browser comparison, baseline data and model checks are implemented. The following studies are future work.

## 1

延迟稳定性：扫描 0–0.25 s 延迟，并减小步长验证触地边界。使用固定参数先绘制失败区，再在相同预算下调节内外环带宽。

Delay stability: sweep 0–0.25 s delay and refine the integration step near ground-contact boundaries. Map failures with fixed gains, then tune inner/outer bandwidth under equal budgets.

## 2

公平控制对照：分别给 PD/PID 相同调参预算；在未用于调参的风频率与质量上比较误差、触地率、饱和比例和控制努力。

Fair control comparison: give PD and PID equal tuning budgets. Evaluate on held-out wind frequencies and masses; report error, ground-contact rate, saturation and control effort.

## 3

更真实的仿真：迁移到 gym-pybullet-drones；核对坐标系、控制频率与电机接口，再逐步研究状态估计、轨迹控制及 PX4 SITL。

More realistic simulation: migrate to gym-pybullet-drones. Validate axes, control frequency and motor interfaces, then investigate estimation, trajectory control and PX4 SITL.

每次实验提交：问题、模型假设、参数/种子、调参和评估划分、成功及失败数据、代码改动、下一步。

Report the question, assumptions, settings/seeds, tuning/evaluation split, successes and failures, code changes and next step.
