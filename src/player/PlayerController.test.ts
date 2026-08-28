import { describe, expect, it } from 'vitest';
import type { InputIntent } from '../input/InputIntent';
import type { InputSource } from '../input/InputSource';
import type { Vector2 } from '../math/Vector2';
import type { PlayerActor } from './PlayerActor';
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

class FakeInput implements InputSource {
  public reads = 0;
  public constructor(private readonly intent: InputIntent) {}
  public readIntent(): InputIntent {
    this.reads += 1;
    return this.intent;
  }
}

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

const controllerFor = (intent: InputIntent, actor: FakeActor, input = new FakeInput(intent)) => ({
  controller: new PlayerController(input, new PlayerMovement(STATS), actor),
  input,
});

describe('PlayerController', () => {
  it('applies the resolved velocity to the actor', () => {
    const actor = new FakeActor({ x: 0, y: 0 });
    const { controller } = controllerFor(intentAiming({ x: 10, y: 0 }, { x: 1, y: 0 }), actor);

    controller.update();

    expect(actor.velocity).toEqual({ x: 100, y: 0 });
  });

  it('faces the aim point', () => {
    const actor = new FakeActor({ x: 100, y: 100 });
    const { controller } = controllerFor(intentAiming({ x: 100, y: 200 }), actor);

    controller.update();

    expect(actor.facing).toBeCloseTo(Math.PI / 2);
  });

  it('keeps the current facing when the aim point sits on the player', () => {
    const actor = new FakeActor({ x: 42, y: 42 });
    const { controller } = controllerFor(intentAiming({ x: 42, y: 42 }), actor);

    controller.update();

    expect(actor.facing).toBeNull();
  });

  it('reads input exactly once per update, so edge-detected presses are not lost', () => {
    const actor = new FakeActor({ x: 0, y: 0 });
    const { controller, input } = controllerFor(intentAiming({ x: 1, y: 1 }), actor);

    controller.update();
    controller.update();

    expect(input.reads).toBe(2);
  });
});
