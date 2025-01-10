import { PublicEventHandler } from '../../util/events.js';
import type { Packet } from '../../util/packet.js';
import type { AsyncVoid } from '../../util/types.js';
import proxy from '../internal.proxy/local.js';

interface DownstreamSoundEffectPacketData {
  soundId: number;
  // present when soundId = 0
  soundEvent:
    | {
        resource: string;
        range: number | undefined;
      }
    | undefined;
  soundCategory: string;
  x: number;
  y: number;
  z: number;
  volume: number;
  pitch: number;
  seed: [number, number];
}

interface DownstreamStopSoundPacketData {
  flags: number;
  // if flags & 1
  source: number | undefined;
  // if flags & 2
  sound: string | undefined;
}

interface EventMap {
  'sound.play': (packet: Packet<DownstreamSoundEffectPacketData>) => AsyncVoid;
  'sound.stop': (packet: Packet<DownstreamStopSoundPacketData>) => AsyncVoid;
}

export const sound = {
  downstream: new PublicEventHandler<EventMap>(),
  playSound(
    sound: { resource: string; range: number | undefined } | number,
    soundCategory: string = 'master',
    x: number,
    y: number,
    z: number,
    volume: number = 1,
    pitch: number = 1,
  ) {
    console.log('playing sound!');

    const randomInt = (): number => Math.floor(Math.random() * 2 ** 30);

    // for whatever reason
    x *= 8;
    y *= 8;
    z *= 8;

    const soundId = typeof sound === 'number' ? sound : 0;
    const soundEvent = typeof sound === 'number' ? undefined : sound;

    proxy.writeDownstream('sound_effect', {
      soundId,
      soundEvent,
      soundCategory,
      x,
      y,
      z,
      volume,
      pitch,
      seed: [randomInt(), randomInt()],
    } satisfies DownstreamSoundEffectPacketData);
  },
  stopSound(source?: number, sound?: string) {
    proxy.writeDownstream('stop_sound', {
      flags: 0 + (source === undefined ? 0 : 1) + (sound === undefined ? 0 : 2),
      source,
      sound,
    } satisfies DownstreamStopSoundPacketData);
  },
};

proxy.downstream.on(
  'sound_effect',
  async (packet: Packet<DownstreamSoundEffectPacketData>) => {
    await sound.downstream.emit('sound.play', packet);
  },
);

proxy.downstream.on(
  'stop_sound',
  async (packet: Packet<DownstreamStopSoundPacketData>) => {
    await sound.downstream.emit('sound.stop', packet);
  },
);
