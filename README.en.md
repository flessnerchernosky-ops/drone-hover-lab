# drone-hover-lab · How does a drone hold still in wind?

[中文](README.md) · [Play the demo](https://flessnerchernosky-ops.github.io/drone-hover-lab/?lang=en) · [Research roadmap](ROADMAP.md)

Keep two planar drones hovering in the same wind. Compare position PD with PID integral memory. Explore constant wind, changing gusts, extra payload and delayed commands.

![Actual default simulation trajectories](docs/preview.gif)

**No hardware, account or payment required.** Open `docs/index.html` from a downloaded repository or use the hosted demo. Interface and guide support Chinese/English. Experiment data stays in the browser; CSV exports are generated locally.

## Start in three minutes

1. Open the demo and click Finish experiment to compare both methods.
2. Change one variable, such as delay, and rerun. Scene changes reset the experiment; changing language preserves results.
3. Download the CSV and write one evidence-backed finding. Export requires a completed run; metadata records settings, time step and completion.

## One measured example

Default wind scene, zero delay, 2 N wind and 1 kg mass. Initial transients are included:

| 方法 Method | 全程 RMSE / Full-run RMSE (m) | 末段 / Late RMSE (m) |
|---|---:|---:|
| PD / PD | 1.051069 | 1.111110 |
| PID / PID | 0.358667 | 0.002226 |

On gusts, late RMSE is 0.516 m for PD and 0.656 m for PID: PID is worse. Both controllers hit the ground in the default 0.2 s delay scene.

The saved [benchmarks.json](benchmarks.json) contains 15 paired configurations / 30 trajectories. [trace.csv](trace.csv) stores the complete default raw run. Other traces can be exported from the browser or generated with the engine. These are deterministic results, not random trials or statistical confidence estimates. Recomputing identical data does not strengthen empirical evidence. Thresholds, time windows and model assumptions matter.

## Reproduce locally

Node.js 18+ and Python 3.9+, standard libraries only. No Python package or npm dependency installation for the core experiments. Run from the repository root:

```sh
node test.cjs
node benchmark.cjs --check
python verify.py
```

This runs 17 model checks, verifies the saved paired benchmark, and independently audits geometry/metrics with Python. After deliberate model changes, `node benchmark.cjs` regenerates data; explain the changes and preserve failure cases. Optional local server: `python -m http.server 8000 --directory docs`, then open `http://localhost:8000`.

Optional preview regeneration: install Pillow (`python -m pip install Pillow`), then run `python build_preview.py`. Animation samples the default CSV; fonts/Pillow may change image bytes without changing numerical results.

## Implementation and scope

- State `[x,z,vx,vz,θ,ω]`. Adjustable true mass; controller always assumes 1 kg. Goal `(0,1.5)` m; initial position `(-0.6,1.25)` m and all other states zero.
- Dynamics: `m ẍ=−T sinθ+F_w−0.15vx`, `m z̈=T cosθ−mg−0.15vz`, `θ̈=0.2(f_R−f_L)/0.025−0.1ω`, g=9.81. Each rotor is limited to [0,9] N.
- Position loop: `a_x=1.8e_x−2.6vx+0.7I_x`, `a_z=4e_z−3vz+1.8I_z`; PD omits integral terms. `θ_ref=clip(atan2(−a_x,g+a_z),±0.45)`, `T=(g+a_z)/max(0.5,cosθ)`.
- Attitude loop: `τ=0.025[36(θ_ref−θ)−12ω]`; rotor allocation `(T∓τ/0.2)/2`, then clipping. Integrators are bounded to ±3 and both freeze when rotor allocation or desired tilt saturates: a simple conditional integration rule.
- Delay queue starts with 4.905 N per rotor. Wind and thrust are held constant within each RK4 step, dt=0.005 s. Default wind 2 N; gust `2[sin(1.2t)+0.4sin(3.1t)]` N. The gust setting is an amplitude, not its maximum force.
- Duration 20 s; late metric covers (15,20] s; near-goal radius 0.1 m. Ground contact locks height to zero, resets velocity and disables subsequent thrust. Failure errors remain included in full-run scores.
- Controller receives true state. No estimator, 3D aerodynamics, sensor noise, flight firmware or reinforcement learning. Teaching and controller comparisons only.

RMSE is the square root of mean squared Euclidean position error over equally spaced time samples. Late RMSE uses the window above. Near-goal seconds accumulate time within a distance threshold; they do not establish grasping or task completion. The integral of squared thrust is a control effort proxy, not electrical energy.

| File | Purpose / 用途 |
|---|---|
| `docs/index.html`, `app.js`, `style.css` | Bilingual browser UI / 双语交互 |
| `docs/engine.js` | Shared browser/Node model / 同一计算模型 |
| `test.cjs` | 17 meaningful model checks / 17 项模型检查 |
| `benchmark.cjs`, `benchmarks.json` | Reproducible paired study / 可复现对照 |
| `trace.csv`, `verify.py` | Raw default run + independent audit / 默认原始数据与独立审计 |
| `build_preview.py` | Optional GIF/cover regeneration / 可选重建动图及封面 |
| `ROADMAP.md` | Research extensions / 研究拓展 |


## Develop this into an application portfolio

Reproduce the result and explain one success and one failure yourself. Complete a controlled study from [ROADMAP.md](ROADMAP.md), then report your changes, tuning budget, held-out evaluation scenes and findings. Initial code and documentation were AI-assisted. Describe your actual modifications and independent validation in application materials.

## References, contributions and license

[gym-pybullet-drones](https://github.com/learnsyslab/gym-pybullet-drones) supplies a PyBullet drone-control environment; the [official PX4 simulation guide](https://docs.px4.io/main/en/simulation/) describes flight-stack simulation workflows. These are extension references. This version implements its own planar model and does not integrate PyBullet or PX4.

See [CONTRIBUTING.md](CONTRIBUTING.md) for useful starter contributions. If the experiments help you, a Star or a shared finding is welcome. MIT License: [LICENSE](LICENSE).
