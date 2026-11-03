from array import array
import math
from pathlib import Path
import random
import wave


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "audio"
SAMPLE_RATE = 44_100


def envelope(position: float, duration: float, attack: float, release: float) -> float:
    return min(1.0, position / attack, (duration - position) / release) if 0 <= position <= duration else 0.0


def write_wave(filename: str, samples: list[float]) -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    pcm = array("h", (max(-32768, min(32767, round(sample * 32767))) for sample in samples))
    with wave.open(str(OUTPUT / filename), "wb") as target:
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(SAMPLE_RATE)
        target.writeframes(pcm.tobytes())


def make_ringtone() -> None:
    duration = 2.7
    samples = [0.0] * round(duration * SAMPLE_RATE)
    bursts = ((0.0, 0.55, (659.25, 880.0)), (0.72, 1.27, (587.33, 783.99)))

    for start, end, frequencies in bursts:
        length = end - start
        first = round(start * SAMPLE_RATE)
        last = round(end * SAMPLE_RATE)
        for index in range(first, last):
            local_time = (index - first) / SAMPLE_RATE
            strength = envelope(local_time, length, 0.04, 0.1)
            pulse = 0.87 + 0.13 * math.sin(2 * math.pi * 2.3 * local_time)
            tone = 0.0
            for frequency in frequencies:
                sweep = frequency + 4.0 * math.sin(math.pi * local_time / length)
                phase = 2 * math.pi * (sweep * local_time + 0.0012 * math.sin(2 * math.pi * 4 * local_time))
                tone += math.sin(phase) + 0.045 * math.sin(phase * 2) + 0.015 * math.sin(phase * 3)
            samples[index] += 0.105 * strength * pulse * tone / len(frequencies)

    write_wave("dialfit-incoming-ringtone.wav", samples)


def make_glitch() -> None:
    duration = 0.46
    total = round(duration * SAMPLE_RATE)
    rng = random.Random(2026)
    raw_noise = [rng.uniform(-1.0, 1.0) for _ in range(total)]
    filtered_noise = [0.0] * total
    low = 0.0
    for index, sample in enumerate(raw_noise):
        low += 0.18 * (sample - low)
        filtered_noise[index] = low

    samples = [0.0] * total
    pulses = ((0.025, 0.105), (0.145, 0.19), (0.245, 0.325), (0.35, 0.405))
    for index in range(total):
        time = index / SAMPLE_RATE
        noise_gate = max((envelope(time - start, end - start, 0.007, 0.018) for start, end in pulses), default=0.0)
        sweep = math.sin(2 * math.pi * (1260.0 * time - 365.0 * time * time / duration))
        soft_click = math.sin(2 * math.pi * 1060 * time) * envelope(time, 0.035, 0.004, 0.018)
        samples[index] = 0.105 * filtered_noise[index] * noise_gate + 0.025 * sweep * envelope(time, duration, 0.018, 0.1) + 0.016 * soft_click

    write_wave("dialfit-signal-interference.wav", samples)


if __name__ == "__main__":
    make_ringtone()
    make_glitch()
