Here is the Project Arbitrium Game Design Document exported as a raw Markdown file. You can copy the text below and save it with a `.md` extension.

# Project Arbitrium: Comprehensive Technical Game Design Document & Strategic Roadmap

## 1. Executive Summary

### 1.1 Project Overview

**Project Arbitrium** (Working Title) represents a strategic divergence from the contemporary "Survivor-like" roguelite market. While the current genre trend favors deterministic build-crafting, Arbitrium returns to the chaotic, high-variance roots of the genre, citing *The Binding of Isaac* as its spiritual predecessor. However, it introduces a radical disruption to the core combat loop: the **Liquidation Protocol**, the **Pacifist’s Gamble**, and the **Modular Forge**.

The game is a 2D, top-down, procedural action game built using the **Phaser 4 HTML5 framework** (TypeScript/JavaScript). It challenges players not through long-term statistical accumulation, but through forced adaptability and instantaneous risk assessment. The player must navigate a procedurally generated dungeon where every room offers a binary strategic choice: engage in lethal combat to accrue power, or bargain with enemies to preserve survival at the cost of progression.

### 1.2 Core Pillars

The design is supported by three immutable pillars that guide all development decisions:

1. **Total Variance (The Anti-Meta):** No run should feel identical. The game rejects the safety of "build planning." Players cannot force a "Sniper Build" or a "Melee Build" because their arsenal is constantly in flux. Mastery is defined by the player's ability to utilize a chaotic, rotating arsenal effectively.
2. **Context-Driven Proceduralism:** Randomness must not equal messiness. The procedural generation is "smart," utilizing context-aware algorithms to ensure that enemy spawns are tactically aligned with the room's geometry.
3. **The Economic Consequence of Mercy:** The Bargaining System is not a dialogue tree; it is a resource management mechanic. Bargaining is a safety valve that arrests the player's power curve. To bargain is to survive the room, but to starve the run. This creates a high-stakes tension between current safety and future viability.

### 1.3 Target Audience Analysis

The target demographic consists of "Hardcore Adaptors"—players who enjoy the friction of high difficulty and RNG management found in titles like *Nuclear Throne*, *Enter the Gungeon*, and *Noita*. This audience is distinct from the "Power Fantasy" audience of *Vampire Survivors*. They value mechanical skill (spacing, aiming) and cognitive flexibility (adapting to new tools instantly) over relaxation or grinding.

---

## 2. Game Design Specification: The Core Loop

### 2.1 The Gameplay Cycle

The fundamental atomic unit of *Project Arbitrium* is the "Room." The loop within a single room is a microcosm of the entire game's economy.

| Phase | Description | Player Action | System State |
| --- | --- | --- | --- |
| 1. Entry | The player enters a new node. Doors seal. | Assessment: Scan geometry and enemy composition. | Procedural Director loads room layout and spawns entities based on tags. |
| 2. The Parley Window | A brief window (1-3 seconds) where enemies are entering the arena or are in an "Alert" state but not yet attacking. | Decision: Hold 'Bargain' or Open Fire. | Bargain UI initializes. Enemy AI checks "Aggro" timers. |
| 3. Execution | The chosen path plays out. | Combat: Twin-stick shooting/slashing, dodging.<br>

<br>Bargain: Minigame/Interaction management. | Combat: Enemies drop Loot/XP on death.<br>

<br>Bargain: Enemies despawn/flee. NO REWARDS. |
| 4. Resolution | The room is cleared. | Looting: Pick up drops (if Combat was chosen). | Doors unlock. |
| 5. The Liquidation | A Weapon Pedestal rises at the exit. | Strategic Choice:<br>

<br>A) Swap: Take new weapon, drop old one.<br>

<br>B) Sell: Sacrifices the new weapon for Gold. | If Swap: New stats applied.<br>

<br>If Sell: Gold added to bank, Player keeps old weapon. |

### 2.2 The Bargaining Mechanic: Design & Psychology

The user query emphasizes a desire to be different from *Binding of Isaac* by allowing players to bargain with enemies (Normal, Rare, Unique) to avoid fighting, with the penalty of receiving zero rewards. This is the game's central "Hook."

#### 2.2.1 Mechanics of Negotiation

In an action roguelite, negotiation cannot be a menu-driven conversation; it must be diegetic and fast-paced.

* **Activation:** The player holds a dedicated "Parley" button. This projects a visual radius (The Sphere of Influence).
* **Acceptance:** Holding is the negotiation. Parley must be held for `holdDurationMs` with the enemy inside the Sphere; the cost is charged and the enemy flees the moment the hold completes. Releasing early, or drifting so a different enemy becomes the nearest, starts the hold over. The exposure during that hold — at reduced speed, unable to shoot — is the risk being traded.
* **One at a time:** Every enemy in the Sphere shows its Desire Icon, but a hold settles only with the **nearest**. Clearing a room by mercy therefore costs several holds, keeping mass bargaining expensive in exposure as well as resources.
* **The Cost:** While the button is held, the player cannot shoot. Their movement speed is reduced by 30%. This makes attempting to bargain a physical risk.
* **The Demand:** Enemies display a "Desire Icon" above their heads.
* *Normal Enemies:* Simple demands (percentage of current Gold, specific ammo type, or a small HP sacrifice).
* *Rare Enemies:* Complex demands (Drop a passive item, sacrifice max HP cap).
* *Unique Enemies:* Narrative demands (Complete a quick evasion minigame, "Don't move for 5 seconds").



#### 2.2.2 The "No Reward" Economy

This design choice creates a negative feedback loop known as the **"Death Spiral."**

* **The Trap:** If a player bargains too often, they gain no Gold to buy passive items and no XP (if an XP system exists). They reach the Boss (who cannot be bargained with) underpowered.
* **The Utility:** The mechanic serves as a "Run Saver," but only while the player is solvent. If the player enters a room with 1 HP, a terrible weapon and gold in the purse, bargaining is the *only* logical choice, and it converts "Game Over" into "One More Chance."
* **The Sting:** Once the gold is gone, demands are taken in Vitality instead (4.1.2). The same Parley that saved an earlier run will end this one. The Death Spiral is not merely a slow loss of power — it is the mechanism by which mercy turns lethal.

### 2.3 Inventory & Weapon Systems

This system has been refined to allow players agency over their arsenal while maintaining the roguelite economy.

#### 2.3.1 The "Scrap or Swap" System

Instead of forcing the player to take every random weapon, the player can choose to monetize bad RNG.

* **Slot Limit:** The player has **1 Weapon Slot** (plus a potential backup slot via meta-upgrades).
* **The Choice:** When a room is cleared, a weapon spawns.
* **Interact (E):** SWAP. The player drops their current weapon and picks up the new one.
* **Alt-Interact (R):** SELL. The new weapon dissolves into gold coins.


* **Design Consequence:** This solves the "Bad RNG" frustration. If the game spawns a "Rusty Pistol" when you have a "Laser Rifle," you aren't forced to downgrade. Instead, you are rewarded with currency. However, "Selling" doesn't refill your ammo/durability (if implemented), forcing you to eventually swap weapons naturally.

#### 2.3.2 Expanded Weapon Generation (Ranged & Melee)

Weapons are procedurally generated using a "Part" system. To increase variety, we include both Ranged and Melee archetypes.

**Ranged Parts:**

* **Core:** Projectile behavior (Bullet, Beam, Rocket).
* **Barrel:** Spread/Range (Sniper, Shotgun).
* **Payload:** On-hit effect (Fire, Ice, Void).

**Melee Parts:**

* **Blade/Head:** Determines Swing Arc and Damage (Wide sweep vs. Narrow stab).
* **Handle:** Determines Swing Speed and Reach.
* **Enchantment:** On-hit effect (Stun, Bleed, Knockback).

### 2.4 The Forge Protocol: Weapon Modification

To reward creative players and utilize the gold earned from "Selling" weapons, players can encounter a **Forge Room** (Shop variation).

#### 2.4.1 The Compatibility Logic

The Forge allows players to buy **Modules** (Upgrades). However, these upgrades are constrained by **Weapon Tags** to ensure logical consistency (e.g., a Sword cannot have "Ricochet").

* **System:** When the player interacts with the Forge, the UI scans the current weapon's data object.
* **The Shop Inventory:**
* *Universal Upgrades:* +10% Damage, +5% Crit Chance.
* *Type-Specific Upgrades:* Only appear/unlock if the tag matches.



#### 2.4.2 Upgrade Examples

| Upgrade Name | Effect | Required Tag | Incompatible Tag |
| --- | --- | --- | --- |
| Split Chamber | Fires 1 additional projectile in a 15° spread. | `[Projectile]` | `[Melee]` |
| Volatile Casing | Projectiles explode on impact (AOE). | `[Projectile]` | `[Hitscan]`, `[Melee]` |
| Phase Blade | Swing passes through walls. | `[Melee]` | `[Ranged]` |
| Serrated Edge | Apply Bleed DOT (Damage over Time) on hit. | `[Melee]` | `[Ranged]` |
| Quantum Mag | 20% Chance to not consume ammo. | `[Projectile]` | `[Melee]` |
| Titan Grip | Increases Knockback by 200%. | `[Heavy]` | `[Light]` |

---

## 3. Technical Architecture: Phaser Implementation

### 3.1 Data-Driven Architecture (JSON & TypeScript Interfaces)

Given the requirement for "Total Randomness," procedural generation, and the compatibility checks for the Forge, a strictly typed data approach using **TypeScript and JSON** will form the foundation.

#### 3.1.1 Weapon Data Structure

We will define a `WeaponData` type. The variations are stored in a `weapons.json` file and loaded into Phaser's Cache via `this.load.json()`, then **validated on load** before any system sees them — a cache read is untrusted input, not a typed object. The `tags` array drives Forge compatibility.

```typescript
export type WeaponTag =
  | 'Ranged' | 'Melee'
  | 'Projectile' | 'Hitscan' | 'Beam'
  | 'Heavy' | 'Light'
  | 'Blade' | 'Blunt';

/** Branded so a weapon id cannot be passed where an upgrade id is expected. */
export type WeaponId = string & { readonly __brand: 'WeaponId' };

interface WeaponBase {
  readonly id: WeaponId;
  readonly name: string;
  readonly tags: readonly WeaponTag[];   // Used for Forge compatibility
  readonly spriteKey: string;
  readonly damage: number;
  readonly attackRate: number;           // Attacks per second
  readonly knockbackForce: number;
}

export type WeaponData =
  | (WeaponBase & {
      readonly type: 'Ranged';
      readonly projectileSpriteKey: string;
      readonly projectileSpeed: number;
      readonly projectileCount: number;  // Modified by "Split Chamber"
    })
  | (WeaponBase & {
      readonly type: 'Melee';
      readonly swingArc: number;
      readonly lungeAmount: number;
    });

export type WeaponType = WeaponData['type'];
```

A discriminated union rather than one interface with optional fields, so a Melee weapon cannot carry `projectileSpeed` and a Ranged one cannot carry `swingArc`.

`Ranged` and `Melee` are both a `WeaponType` and a `WeaponTag`. The Module table in 2.4.2 constrains on `[Melee]` and `[Ranged]`, and `requiredTags` is an AND-list, so "Blade or Blunt" cannot express "any melee weapon". Every weapon therefore carries the tag matching its own type, and the loader rejects a weapon whose tags disagree with its type.

#### 3.1.2 Upgrade Data Structure (The Forge)
Upgrades are defined in an `upgrades.json` file. The game registry uses these to filter valid upgrades for the current weapon.

```typescript
export interface UpgradeData {
    id: string;
    name: string;
    goldCost: number;
    iconKey: string;

    // Constraints
    requiredTags: WeaponTag[]; // Must have ALL these
    forbiddenTags: WeaponTag[]; // Must have NONE of these

    // Modifiers applied dynamically via a weapon modifier class
    damageMultiplier?: number;
    extraProjectiles?: number;
    enableExplosions?: boolean;
}

```

#### 3.1.3 Data Files

| File | Cache key | Contents |
| --- | --- | --- |
| `public/data/weapons.json` | `weapons` | `WeaponData[]` |
| `public/data/upgrades.json` | `upgrades` | `UpgradeData[]` |
| `public/data/player.json` | `playerStats` | Movement values from 3.3.1 |
| `public/data/bargain.json` | `bargain` | Parley constants from 4.1.3, and the Desires enemies may hold |
| `public/data/dungeon.json` | `dungeon` | Floor size and layout seed (3.2.1) |
| `public/data/rooms/*.json` | `room:<id>` | One Tiled room template each (3.2.1.1) |

Each is parsed by a validator returning `Result<T, string>`. A failure names the file, the index and the offending field; the scene throws on it rather than starting with half-valid data.

### 3.2 The Procedural Director (Level Generation)

The user requires that *"level generation should be procedural... encounter on each room should be randomized but should be aligned with the room design."*

#### 3.2.1 Step 1: Topology (The "Dungeon Graph")

We use a **Connector-Based Generation** method, rendered through `Phaser.Tilemaps.Tilemap`.

1. **Grid Initialization:** A 2D grid of `GridCoordinate` slots manages the layout of "Rooms". One room occupies one slot.
2. **Room Templates:** Pre-designed Tiled JSON maps, one file per room under `public/data/rooms`, with labeled objects for "Exits" and a map property for "Tags". They are read and validated by our own parser rather than Phaser's tilemap loader, so room data passes the same validation as every other data file.
3. **Graph Traversal:** Starting from one entrance, the generator repeatedly takes an unused door, steps to the neighbouring slot, and places a template that opens back onto it. The floor is therefore connected by construction rather than by a repair pass. Every choice comes from an injected `Rng`, so a seed always rebuilds the same floor.
4. **Sealing:** A template with four doors placed in a dead end would leave gaps the player could wedge into, so any door that leads nowhere is walled up before the room is drawn. This is 2.1's "doors seal", applied to geometry.

#### 3.2.1.1 Room Template Schema

A room template is an ordinary Tiled map. The parser requires:

| Element | Requirement |
| --- | --- |
| Tile layer `terrain` | One gid per tile, row-major: `1` floor, `2` wall. Length must equal `width * height`. |
| Object layer `meta` | One object per exit, with class (or type) `exit` and a string property `direction` of `North`, `South`, `East` or `West`. Its position marks the tile a player stands on when arriving. At most one exit per side. |
| Map property `tags` | Comma-separated `RoomTag` values (`Arena`, `Corridor`), which the Encounter Director will spawn against in 3.2.3. |

A room with no exits is rejected: it could never be reached.

The shipped set is placeholder geometry to be replaced by designed rooms: `arena` and `pillars` (four doors), `corridor-ns` and `corridor-ew` (two), and four single-door `chamber-*` rooms that cap branches.

#### 3.2.2 Step 2: Contextual Analysis (The "Encounter Director")

Once the geometry is placed, the `EncounterDirector` class scans the room.

* **Node Analysis:** Using a custom grid system, it identifies tiles as `[Cover]`, `[Open]`, or `[Corner]`.

#### 3.2.3 Step 3: Weighted Spawning

The `EncounterDirector` consults the JSON `LootTable` of enemies.

* **Scenario A: Narrow Corridor Room.** Spawns "Phalanx Guards" or "Spear Skeletons".
* **Scenario B: Open Arena Room.** Spawns "Rat Swarms" and "Mortar Turrets".

### 3.3 Input System & Player Controller

* **Actions:** `Move` (WASD/Analog), `Aim` (Mouse pointer/Right stick), `Attack` (Click), `Bargain` (Hold Spacebar/Trigger), `Interact` (E), `Sell` (R). Bound once from `this.input.keyboard` and the scene's active pointer.
* **Architecture:** Devices sit behind an `InputSource` that reports one frame of intent as an `InputIntent` snapshot: held actions (Move, Aim, Attack, Bargain) plus edge-detected one-shots (Interact, Sell). The `PlayerController` consumes that snapshot and drives a narrow `PlayerActor` interface, so it neither reads Phaser input nor owns a sprite. Held actions are polled per frame rather than event-driven, which is what lets Attack and Bargain be sustained without listener bookkeeping.

#### 3.3.1 Player Constants

| Constant | Value | Rationale |
| --- | --- | --- |
| Base Move Speed | 220 px/sec | Crosses the 1280x720 logical room in ~6 seconds; fast enough to reposition, slow enough that Tier 1 projectiles stay dodgeable. First-pass value, to be revisited in Sprint 10 (Economic Balancing). |
| Parley Movement Penalty | 30% | The physical cost of holding Parley (see 2.2.1). |
| Diagonal Handling | Input normalized to unit length | A diagonal must not outrun a cardinal. Normalizing rather than clamping means any non-zero input travels at full speed, including a partial analog tilt. |
| Movement Application | Velocity in px/sec, integrated by Arcade | The body integrates velocity against the frame delta, which is what makes travel frame-rate independent. Arcade steps once per rendered frame (`fixedStep: false`) instead of on a 60Hz accumulator, so motion stays even on high-refresh displays. |
| Logical Resolution | 1280x720 | Fixed world units; the canvas is scaled to fit the window. |
| Starting Gold | 120 | The pool a Gold demand takes its cut from (4.1.2). First-pass value. |
| Max Vitality | 100 | Starting and maximum Vitality; the pool a Vitality demand draws down (4.1.2). |

---

## 4. Gameplay Systems: Deep Dive

### 4.1 The Bargaining System

The "Parley Phase" occurs at the start of the encounter.

#### 4.1.1 The "Aggro Delay"

* **Mechanic:** Enemies play a "Notice" animation (1.5s) on entry.
* **Opportunity:** Player can initiate Bargain during this window.
* **Late Bargaining:** Possible, but cost increases by 50%.

#### 4.1.2 Bargain Types & Costs

| Resource | Mechanics | Risk Profile |
| --- | --- | --- |
| Gold | Lose X% of Gold. | Strategic Risk: Can't afford Forge upgrades later. |
| Vitality | Take flat damage. | Immediate Risk: Closer to death. |
| Pride | Temp debuff (-Speed). | Skill Risk: Next room is harder. |

**A Parley can kill.** A Vitality demand is paid in full even when it empties the player. And a Gold demand an empty purse cannot answer does not lapse — it **converts to Vitality**, scaled by how greedy it was: a demand for X% of the purse costs `ceil(X * vitalityForUnpayableGold)`. A purse too thin to yield a single coin counts as empty.

Mercy is therefore only cheap while the player is solvent. Bargain the gold away and the price starts coming out of flesh; keep bargaining and it kills. This is where the Death Spiral in 2.2.2 actually ends.

**Pride** costs nothing at the moment it is paid and slows the player instead. The debuff is measured in room entries, not seconds: paying it in one room also slows the *next* one, then expires. That is the "next room is harder" risk, and it means a Pride demand is cheap only if the player is confident about what comes next.

Penalties compound. A Pride debuff multiplies the base speed, and holding Parley takes its 30% off whatever remains, so bargaining while already humbled is the slowest the player ever moves. A late Pride demand is surcharged like any other, but is capped so it can never immobilise the player outright.

#### 4.1.3 Parley Constants

| Constant | Value | Rationale |
| --- | --- | --- |
| Aggro Delay | 1500 ms | The "Notice" window from 4.1.1, during which demands are at list price. |
| Late Cost Multiplier | 1.5 | The +50% surcharge from 4.1.1, applied once the Aggro Delay lapses. |
| Hold Duration | 900 ms | Long enough that holding is a real commitment, short enough to be worth it under pressure. First-pass value. |
| Vitality for Unpayable Gold | 40 | Vitality charged for a demand of the *entire* purse when the player cannot pay; a smaller demand costs proportionally less. Against 100 Max Vitality, roughly two and a half full-purse demands are fatal. First-pass value. |
| Pride Rooms Affected | 1 | Further room entries a Pride debuff survives, so the room after the bargain is slowed too. |
| Max Speed Penalty | 90% | Ceiling on a surcharged Pride demand, so a late bargain can never leave the player unable to move. |
| Sphere of Influence Radius | 170 px | Reaches a nearby enemy without covering the arena, so positioning still matters. First-pass value. |

### 4.2 The Weapon Generation Algorithm

To ensure "Total Randomness" feels fair:

* **Tier 1 (Rusty):** Standard projectiles, blunt swords. (Floors 1-2).
* **Tier 2 (Refined):** Elemental effects, faster swings. (Floors 3-4).
* **Tier 3 (Legendary):** Exotic behaviors (homing bullets, teleporting strikes). (Floors 5+).

---

## 5. Enemy Design & AI Patterns

### 5.1 Enemy Roster

* **Normal:** Grunt (Melee), Turret (Stationary Ranged).
* **Rare:** Blink-Stalker (Teleport), Alchemist (AOE Potion).

### 5.2 AI Behavior Trees

A custom Behavior Tree utility class or an external state machine library will handle "Combat" vs "Bargaining" states in the enemy sprites.

---

## 6. Procedural Level Generation: Technical Roadmap

### 6.1 The "Room Director" Algorithm

1. **Instantiation:** `DungeonGenerator` selects a room JSON template. **Implemented in Sprint 4**; the remaining steps arrive with the Encounter Director in Sprint 5.
2. **Baking:** Generate Navigation Grid for an A* Pathfinding Plugin (e.g., EasyStar.js) to allow enemy navigation around tiles.
3. **Analysis Pass:** `RoomAnalyzer` identifies clusters.
4. **Director Pass:** Selects enemies based on room Tags.
5. **Weapon Spawning:** `WeaponPedestal` sprite placed at exit coordinates.

---

## 7. Strategic Roadmap & Production Schedule

### Phase 1: The Core Foundation (Months 1-3)

* **Sprint 1:** Player Controller (Phaser Arcade Physics).
* **Sprint 2:** Data Architecture (JSON loaders, TS Interfaces).
* **Sprint 3:** Bargain Interaction & UI.

### Phase 2: Procedural Systems (Months 4-6)

* **Sprint 4:** Dungeon Topology (Tiled API integration).
* **Sprint 5:** Context-Aware Spawning & Grid Pathfinding.
* **Sprint 6:** The Liquidation Loop (Swap vs Sell mechanics).

### Phase 3: Content Expansion (Months 7-9)

* **Sprint 7:** The Forge UI (Phaser DOM Elements or UI Plugins) & Compatibility System.
* **Sprint 8:** Unique Enemies & Bosses.
* **Sprint 9:** Visuals & Juice (Phaser Particle Emitters, Camera Shake).

### Phase 4: Polish & Beta (Months 10-12)

* **Sprint 10:** Economic Balancing (Gold vs Forge Costs).
* **Sprint 11:** Meta-Progression.
* **Sprint 12:** Final Polish & Web/Desktop Build Compilation (via Electron or Capacitor).

---

## 8. Balancing Considerations

### 8.1 Melee vs. Ranged

* **Mechanic:** "Bullet Deflection." Timing a melee swing hitbox (Arcade.Body) perfectly against a projectile overlaps reflects it by reversing velocity.

### 8.2 The Forge Economy

The Forge is the primary "Gold Sink."

* **Balance Target:** A player who "Sells" 50% of weapons should have enough gold to buy 1 Major Upgrade every 3 rooms.
* **Formula:** `UpgradeCost = BaseCost * (CurrentFloor * 1.5)`.

### 8.3 The "No Reward" Bargain Math

* **Fight:** High risk, Gold/XP reward.
* **Bargain:** Survival while solvent. Gold cost, or Vitality once the purse is empty — at which point a Parley can kill.
* **Dynamic:** Bargaining drains the resource (Gold) needed for the Forge, eventually forcing the player to fight to regain purchasing power.

---

## 9. Technical Implementation Details: Phaser & TypeScript

### 9.1 JSON Data Registry

`GameDatabase` holds the validated records and is the single place systems look data up. It is built from already-parsed records rather than from a Scene, so it carries no Phaser dependency and is testable on its own; a thin `PhaserJsonSource` adapter is what reads the cache.

```typescript
export class GameDatabase {
    public static create(
        weapons: readonly WeaponData[],
        upgrades: readonly UpgradeData[],
        playerStats: PlayerStats,
    ): Result<GameDatabase>          // rejects duplicate ids

    public readonly playerStats: PlayerStats;
    public get weapons(): readonly WeaponData[];
    public get upgrades(): readonly UpgradeData[];

    public weapon(id: WeaponId): WeaponData;      // throws, naming an unknown id
    public upgrade(id: UpgradeId): UpgradeData;   // throws, naming an unknown id
}
```

Lookups throw rather than return `undefined`: an unknown id is a typo in a spawn table, a programmer error, not a runtime condition to recover from.

Compatibility filtering belongs to the Forge and arrives with it in Sprint 7:

```typescript
getCompatibleUpgrades(weapon: WeaponData): UpgradeData[] {
    return this.upgrades.filter(u =>
        u.requiredTags.every(t => weapon.tags.includes(t)) &&
        !u.forbiddenTags.some(t => weapon.tags.includes(t))
    );
}
```

### 9.2 The "Component" Approach in Phaser

While Phaser uses a classical inheritance model for GameObjects, we will use a composition pattern for weapons:

* `WeaponController` (Handles the state and input).
* `WeaponVisuals` (Handles the Phaser `Sprite` and animations).
* `WeaponStats` (Applies modifiers from the loaded JSON and Forge upgrades).

---

## 10. Conclusion

**Project Arbitrium** challenges the genre's status quo. The **Liquidation Protocol** (Sell vs Swap) and **Forge System** give players agency over the randomness, converting "bad RNG" into currency for upgrades. The **Bargain** mechanic remains the unique selling point, creating a tension between immediate survival (Bargaining) and long-term power (Fighting for Gold to spend at the Forge). The use of the **Phaser 4 framework** ensures a lightweight, highly accessible, and easily deployable web-first experience without sacrificing 2D combat polish.

```

```
