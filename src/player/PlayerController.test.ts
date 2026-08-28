import { describe, expect, it } from 'vitest';
import type { InputIntent } from '../input/InputIntent';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';
import { UNAFFECTED } from './PlayerCondition';
import { PlayerController } from './PlayerController';
import { PlayerMovement } from './PlayerMovement';

const STATS = { moveSpeedPixelsPerSecond: 100, parleyMovementPenalty: 0.3 };

const intentAiming = (aimPoint: Vector2, moveAxes: Vector2 = { x: 0, y: 0 }): InputIntent => ({
  moveAxes,
  aimPoint,
  isAttacking: false,
  isParleying: false,
  isInteracting: false,
  isSelling: false,
});

class FakeActor implements PlayerActor {
  public velocity: Vector2 | null = null;
  public facing: number | null = null;
  public constructor(public readonly position: Vector2) {}
  public setVelocity(velocity: Vector2): void {
    this.velocity = velocity;
  }
  public setFacing(radians: number): void {
    this.facing = radians;
  }
}

const controllerFor = (actor: FakeActor): PlayerController =>
  new PlayerController(new PlayerMovement(STATS), actor);

describe('PlayerController', () => {
  it('passes the active condition through to movement', () => {
    const actor = new FakeActor({ x: 0, y: 0 });
    const controller = controllerFor(actor);

    controller.update(intentAiming({ x: 10, y: 0 }, { x: 1, y: 0 }), { speedMultiplier: 0.5 });

    expect(actor.velocity?.x).toBeCloseTo(50);
  });

  it('applies the resolved velocity to the actor', () => {
    const actor = new FakeActor({ x: 0, y: 0 });
    const controller = controllerFor(actor);

    controller.update(intentAiming({ x: 10, y: 0 }, { x: 1, y: 0 }), UNAFFECTED);

    expect(actor.velocity).toEqual({ x: 100, y: 0 });
  });

  it('faces the aim point', () => {
    const actor = new FakeActor({ x: 100, y: 100 });
    const controller = controllerFor(actor);

    controller.update(intentAiming({ x: 100, y: 200 }), UNAFFECTED);

    expect(actor.facing).toBeCloseTo(Math.PI / 2);
  });

  it('keeps the current facing when the aim point sits on the player', () => {
    const actor = new FakeActor({ x: 42, y: 42 });
    const controller = controllerFor(actor);

    controller.update(intentAiming({ x: 42, y: 42 }), UNAFFECTED);

    expect(actor.facing).toBeNull();
  });
});
