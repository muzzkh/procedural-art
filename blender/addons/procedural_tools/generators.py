"""The generators: plain functions that build mesh data.

Nothing in this file knows about buttons, panels or operators. Keeping the generating code
separate from the interface code means it can also be imported by scripts, tested without
Blender's window, and reused in another add-on.
"""
import math
import random

from mathutils import Vector, noise


def _fbm(x, y, offset, octaves):
    total, amplitude, frequency, norm = 0.0, 1.0, 1.0, 0.0
    for _ in range(octaves):
        total += amplitude * noise.noise(Vector((x * frequency, y * frequency, 0.0)) + offset)
        norm += amplitude
        amplitude *= 0.5
        frequency *= 2.0
    return 0.5 + 0.5 * total / norm


def terrain(seed=1, size=8.0, cells=64, height=2.0, scale=0.45, octaves=4, sea_level=0.42):
    """Return (vertices, faces) for a square noise terrain."""
    rng = random.Random(seed)
    offset = Vector((rng.uniform(-1000, 1000), rng.uniform(-1000, 1000), 0.0))
    vertices = []
    for j in range(cells + 1):
        for i in range(cells + 1):
            x = (i / cells - 0.5) * size
            y = (j / cells - 0.5) * size
            z = height * max(0.0, _fbm(x * scale, y * scale, offset, octaves) - sea_level)
            vertices.append((x, y, z))
    faces = []
    for j in range(cells):
        for i in range(cells):
            a = j * (cells + 1) + i
            faces.append((a, a + 1, a + cells + 2, a + cells + 1))
    return vertices, faces


def vase(seed=1, height=120.0, radius=30.0, twist=1.0, ribs=8, segments=96, rings=60):
    """Return (vertices, faces) for an open vase surface with a floor. Units are millimetres."""
    rng = random.Random(seed)
    bulge = rng.uniform(0.15, 0.35)
    phase = rng.uniform(0.0, 1.0)
    vertices = []
    for j in range(rings + 1):
        v = j / rings
        for i in range(segments):
            u = i / segments
            angle = u * math.tau + v * twist
            profile = 0.8 + bulge * math.sin(v * 2.9 + phase) - 0.12 * v
            r = radius * (profile + 0.05 * math.sin(u * math.tau * ribs))
            vertices.append((r * math.cos(angle), r * math.sin(angle), v * height))
    faces = []
    for j in range(rings):
        for i in range(segments):
            a = j * segments + i
            b = j * segments + (i + 1) % segments
            faces.append((a, b, b + segments, a + segments))
    faces.append(tuple(reversed(range(segments))))          # the floor
    return vertices, faces
