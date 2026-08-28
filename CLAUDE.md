# Project Arbitrium — Engineering Guidelines

2D top-down procedural action roguelite built with **Phaser 4 + TypeScript**.
**[`gdd.md`](./gdd.md) is the source of truth for *what* to build** — read it before
implementing anything. This file is the source of truth for *how* to build it.

These rules are mandatory for every change. If a rule must be broken, say so
explicitly and explain why in the same message as the change.

---

## 1. The Game Design Document (Source of Truth)

**[`gdd.md`](./gdd.md) is the single source of truth for what this game is.**
Read the relevant section before implementing any system. This file governs *how*
code is written; the GDD governs *what* the code must do. Where they overlap
(architecture, data structures), the GDD's intent wins and this file's standards
describe the way to express it.

### 1.1 Rules for working against the GDD

- **Consult before building.** Every feature traces to a GDD section. If you cannot
  point to one, the feature is out of scope — ask before writing it.
- **Never silently deviate.** If an implementation cannot match the GDD, or the GDD
  is ambiguous/contradictory, stop and surface the conflict with the specific
  section cited. Do not "improve" the design on your own initiative.
- **The GDD is a living document.** When a design decision genuinely changes,
  update `gdd.md` in the same change that implements it. Code and GDD must never
  disagree; a drifted GDD is a bug.
- **Speak the GDD's language.** Its terminology is the codebase's ubiquitous
  language (see §4.1 of this file): `Parley`, `Bargain`, `Liquidation`, `Forge`, `Module`,
  `Sphere of Influence`, `Desire Icon`, `Aggro Delay`, `Encounter Director`.
  Do not invent synonyms.
- **Balance numbers belong to the GDD.** Values such as the 30% Parley movement
  penalty, the 1.5s Aggro Delay, the +50% late-bargain cost, and
  `UpgradeCost = BaseCost * (CurrentFloor * 1.5)` come from the GDD (§4, §8) and
  live in config/JSON — never hardcoded, never tuned without updating the GDD.

### 1.2 The three pillars (GDD §1.2)

Every technical decision is checked against these:

1. **Total Variance (The Anti-Meta)** — no two runs alike; the player cannot force
   a build. Systems must be composable and randomized, never a fixed progression
   tree.
2. **Context-Driven Proceduralism** — randomness is *smart*. Spawns are tactically
   aligned to room geometry; generation is analysed, not sprinkled.
3. **The Economic Consequence of Mercy** — bargaining is resource management, not
   dialogue. It buys survival and costs progression.

### 1.3 System map — GDD section to implementation

| System | GDD | Owns |
| --- | --- | --- |
| Core room loop | §2.1 | Entry → Parley Window → Execution → Resolution → Liquidation |
| Bargaining / Parley | §2.2, §4.1 | Demands, costs (Gold/Vitality/Pride), aggro timing, no-reward rule |
| Liquidation (Swap vs Sell) | §2.3.1 | 1 weapon slot, `E` = Swap, `R` = Sell |
| Weapon generation | §2.3.2, §4.2 | Part assembly (Core/Barrel/Payload, Blade/Handle/Enchantment), tiers |
| Forge / Modules | §2.4, §9.1 | Tag compatibility: all `requiredTags`, no `forbiddenTags` |
| Data registry | §3.1, §9.1 | `WeaponData`, `UpgradeData`, JSON loading and validation |
| Dungeon topology | §3.2.1, §6.1 | Connector-based generation, room templates, graph traversal |
| Encounter Director | §3.2.2–3.2.3 | Room analysis (`Cover`/`Open`/`Corner`), weighted contextual spawning |
| Input & player control | §3.3 | Move, Aim, Attack, Bargain, Interact, Sell |
| Enemy AI | §5 | Behavior trees, Combat vs Bargaining states |
| Weapon composition | §9.2 | `WeaponController` + `WeaponVisuals` + `WeaponStats` |

### 1.4 Roadmap discipline (GDD §7)

Development follows the GDD's four phases and twelve sprints. Build the current
sprint's scope only. A hook, abstraction, or interface for a later phase is a YAGNI
violation (§4.5 of this file) — the roadmap exists so that work stays sequenced.

---

## 2. TypeScript Standards

### 2.1 Strictness
- `tsconfig.json` runs in **strict mode**, non-negotiable:
  `strict`, `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`,
  `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`,
  `exactOptionalPropertyTypes`, `noUnusedLocals`, `noUnusedParameters`.
- **`any` is banned.** Use `unknown` at boundaries and narrow it. If a third-party
  type is missing, write the declaration rather than casting through `any`.
- **No `as` casts** to silence the compiler. Casting is allowed only after a real
  runtime check, or in a type guard (`function isX(v: unknown): v is X`).
- **No non-null assertions (`!`)**. Handle the `undefined` case or restructure so
  it cannot occur.
- **No `@ts-ignore`**. `@ts-expect-error` with a one-line justification, only when
  a genuine compiler/library limitation is being worked around.

### 2.2 Typing style
- Prefer `type` for unions and function shapes, `interface` for object contracts
  that classes implement or that get extended.
- Model domain values as **discriminated unions**, not booleans plus optional
  fields. Example: `type RoomOutcome = { kind: 'combat'; loot: LootDrop[] } |
  { kind: 'bargain'; paid: BargainCost }` — never `{ wasBargained: boolean; loot?: ... }`.
- Use **string literal unions** over `enum` (`type WeaponTag = 'Projectile' | ...`).
  They serialize cleanly to/from the JSON data files and cost nothing at runtime.
- Mark data that must not mutate as `readonly` / `ReadonlyArray<T>`. Loaded JSON
  (weapons, upgrades, room templates) is **immutable** — clone before modifying.
- Make illegal states unrepresentable. Prefer branded IDs (`type WeaponId = string
  & { readonly __brand: 'WeaponId' }`) over bare `string` for entity identifiers.
- Avoid optional properties as a default. An optional field must mean "genuinely
  absent", not "not filled in yet".

### 2.3 Modules & structure
- One primary export per file; filename matches the export.
- `PascalCase` for types/classes, `camelCase` for values/functions,
  `SCREAMING_SNAKE_CASE` for module-level constants.
- No circular imports. If two modules need each other, the shared piece belongs in
  a third module (usually an interface).
- No barrel `index.ts` files that re-export whole folders — they hide dependencies
  and break tree-shaking.
- Boundary data (JSON from `this.load.json`) is **validated on load** by a parser
  that returns a typed result. Never trust a cache read to match its interface.

---

## 3. SOLID Principles

### 3.1 Single Responsibility
- A class has one reason to change. `Player` moves and renders — it does **not**
  own weapon stats, bargain negotiation, or loot rolls.
- Split along the GDD's own seams: `EncounterDirector` (what spawns),
  `RoomAnalyzer` (what the geometry is), `DungeonGenerator` (topology),
  `BargainService` (negotiation rules), `WeaponFactory` (assembly from parts).
- Phaser `Scene` classes are **wiring only**: create systems, connect them, tick
  them. Game rules never live in a Scene.

### 3.2 Open/Closed
- Extend behavior by adding data or a new implementation, never by editing a
  `switch` that grows with every feature.
- New weapon behaviors, upgrades, bargain demands, and enemy archetypes must be
  addable via JSON + a registered strategy, with **zero edits to existing systems**.
- Registries over conditionals: `upgradeEffects.register('volatile_casing', fn)`
  beats `if (upgrade.id === 'volatile_casing')`.

### 3.3 Liskov Substitution
- A subtype must honor its base contract. If an override throws
  "not supported", the hierarchy is wrong — use composition instead.
- `StationaryEnemy` must not be a subclass of a `MovingEnemy` whose `move()` it
  no-ops. Model capability as a component the entity either has or lacks.

### 3.4 Interface Segregation
- Small, role-shaped interfaces: `Damageable`, `Bargainable`, `Updatable`,
  `Pathfindable`. Consumers depend only on what they call.
- No "god" `IEntity` that every system must implement in full.

### 3.5 Dependency Inversion
- Systems depend on **interfaces**, not concrete classes or Phaser globals.
- Inject collaborators through the constructor. No service locators, no singletons,
  no reaching into `scene.registry` for a dependency from deep inside a system.
- Pure game logic (bargain math, forge compatibility, loot weighting, upgrade cost
  formulas) must be **Phaser-free** so it is unit-testable in isolation. Phaser is
  a rendering/physics detail at the edges, not a dependency of the rules.
- Randomness is injected as an `Rng` interface, never `Math.random()` inline —
  this is what makes procedural generation seedable, reproducible, and testable.

---

## 4. Clean Code

### 4.1 Naming
- Names state intent: `getCompatibleUpgrades`, not `filter2`.
- No abbreviations beyond established domain terms (`Rng`, `Ai`, `Xp`, `Hp`).
- Booleans read as predicates: `isBargaining`, `hasRangedTag`, `canAffordUpgrade`.
- Use the GDD's vocabulary exactly — `Parley`, `Liquidation`, `Forge`, `Module`,
  `Sphere of Influence`. Code and design doc must speak the same language.
- **No magic numbers.** `PARLEY_MOVEMENT_PENALTY = 0.3`, `AGGRO_DELAY_MS = 1500`.
  Tunable gameplay values belong in config/JSON, not literals in a method body.

### 4.2 Functions
- Small and single-purpose. If a function needs a comment to explain its
  sections, those sections are separate functions.
- Max 3 parameters; beyond that pass a named options object.
- **No boolean flag parameters** — `spawn(x, y, true)` tells the reader nothing.
  Two functions, or an explicit union argument.
- Prefer pure functions returning new values over methods mutating shared state.
- Guard clauses over nested `if`. Keep nesting at 2 levels or less.

### 4.3 Comments
- Code explains *what*; comments explain *why* — a non-obvious balance decision, a
  Phaser quirk, a deliberate design trade-off.
- No commented-out code, no changelog comments, no redundant restatements.
- Public system APIs get a short TSDoc block; private helpers usually need none.

### 4.4 Error handling
- Fail fast and loud on programmer error (invalid room template, unknown upgrade
  id) — throw with a message naming the offending id.
- Expected failures return a typed result (`{ ok: true, value } | { ok: false, error }`),
  not `null` plus a comment.
- Never swallow an error into an empty `catch`.

### 4.5 Hygiene
- **DRY, but only after the third repetition.** Two similar blocks are fine; three
  is an abstraction. Premature abstraction is worse than duplication.
- **YAGNI:** build what the current sprint needs. No speculative hooks for features
  the GDD schedules for Phase 4.
- Leave code cleaner than you found it, but keep refactors in separate commits from
  behavior changes.
- Delete dead code — version control remembers it.

---

## 5. Phaser-Specific Rules

- **Composition over inheritance** for game objects, per GDD §9.2. Deep
  `Sprite` subclass chains are forbidden. A weapon is
  `WeaponController` + `WeaponVisuals` + `WeaponStats`, not `class LaserRifle extends
  Gun extends Weapon extends Sprite`.
- Scene lifecycle is strict: `preload` loads assets only; `create` wires systems;
  `update(time, delta)` delegates to systems and contains no game rules.
- **Every allocation is freed.** Event listeners registered in `create` are removed
  in `shutdown`. Tweens, timers, and emitters are destroyed with their owner. A
  memory leak in a roguelite with hundreds of room transitions is a crash.
- Use **object pools** for projectiles, enemies, and particles. Never
  create/destroy per-frame entities in `update`.
- All movement and timing are **delta-scaled**. No frame-rate-dependent logic. For an
  Arcade body that means setting **velocity in px/sec** and letting the body integrate
  it — never multiplying by delta yourself, and never writing body positions from
  `scene.update`, which runs *after* the physics step and lands several frames of
  movement in one lump on high-refresh displays.
- Communicate between systems via a typed event bus/emitter with a declared event
  map — not by holding references to sibling systems and calling into them.

---

## 6. Testing

- Every pure-logic module ships with unit tests: forge compatibility, bargain
  costs, upgrade cost formula, loot weighting, weapon part assembly, room analysis.
- Procedural generation is tested with a **fixed seed** — same seed, same dungeon.
- Test behavior through the public API, not private internals.
- A bug fix starts with a failing test that reproduces it.
- Rendering and physics are not unit-tested; keep the untestable surface thin
  enough that this is acceptable.

### 6.1 End-of-sprint browser verification

Unit tests cover the rules; they say nothing about whether the game still boots.
**Every sprint closes with an end-to-end run in a real browser** before the sprint
is called done. Use **Brave** (any Chromium-based binary takes the same flags).

Automated pass — start the dev server, then drive it headless:

```bash
npm run dev &                       # or: npm run build && npm run preview
brave --headless=new --disable-gpu --no-sandbox --enable-unsafe-swiftshader \
  --disable-background-timer-throttling --disable-backgrounding-occluded-windows \
  --disable-renderer-backgrounding \
  --enable-logging=stderr --v=0 --window-size=1280,720 \
  --screenshot=/tmp/arbitrium-boot.png http://localhost:5173/

# For an input-driven check, add --remote-debugging-port=9222 instead of
# --screenshot, then drive it over CDP (Input.dispatchKeyEvent +
# Page.captureScreenshot). See the caveats below before asserting anything.
```

Headless Chromium renders on demand, which constrains what this pass can prove:

- The page is backgrounded after a few seconds and `requestAnimationFrame` drops to
  zero, freezing Phaser's loop. Keep it awake with the three `--disable-*`
  backgrounding flags above **and** a CDP `Emulation.setFocusEmulationEnabled` call.
- Even awake, software WebGL cannot hold 60fps, and `TimeStep.smoothDelta` clamps
  oversized deltas to the last sane value. The game therefore runs in **slow motion**:
  simulated time advances slower than wall-clock. **Never assert an absolute distance,
  speed, or duration from a headless run** — the number will be short and it means
  nothing about the build.
- CDP virtual time (`Emulation.setVirtualTimePolicy`) does not drive Phaser's frame
  loop at all. It is not a workaround.

So the automated pass verifies presence and direction, not magnitude. It passes only
when **all** of these hold:

- The process exits `0` and writes a screenshot.
- The console shows the expected `Phaser v<version> (WebGL | Web Audio)` banner —
  a Canvas fallback means the renderer regressed.
- **Zero** console errors, warnings, or uncaught exceptions. `--enable-unsafe-swiftshader`
  is what keeps the headless software-WebGL notice out of that count; if a warning
  appears, fix it or record why it is benign in the sprint's commit message.
- The screenshot shows what the sprint built, not an empty canvas.
- Where the sprint added input or motion, driving it over CDP moves the right thing in
  the right **direction**, stops when the input stops, and never leaves the canvas.

Screenshots are the reliable probe. Reading pixels back from the WebGL canvas returns
an empty buffer, since the context has no `preserveDrawingBuffer`; measure the
captured PNG instead (ImageMagick `-fuzz` on a known sprite colour, then `-trim`).

Manual pass — this is where speed, timing, and feel are actually checked, because
headless cannot measure them and feel is where this game lives. Open
the dev server and play the sprint's feature for a minute: input latency, whether
the Parley slowdown reads as a real cost, whether spawns look tactically placed.
Anything that feels wrong is a finding even when every test is green.

Record the outcome of both passes in the sprint's closing commit message. A failing
browser run blocks the sprint from being called done, exactly as a failing unit test
blocks a change.

---

## 7. Definition of Done

A change is complete only when all of these hold:

1. The change traces to a section of `gdd.md`, and does not contradict it.
2. If the design changed, `gdd.md` was updated in the same change.
3. `tsc --noEmit` passes with zero errors and zero new warnings.
4. Lint and format pass; no disabled rules added.
5. Tests for the touched logic pass, and new logic has new tests.
6. No `any`, no `!`, no `@ts-ignore`, no magic numbers, no dead code.
7. New behavior is data-driven where the GDD says it should be.
8. Nothing outside the requested scope was changed.

For a change that closes a sprint, one more holds:

9. The end-to-end browser verification in §6.1 passed, both automated and manual,
   and its outcome is recorded in the closing commit message.
