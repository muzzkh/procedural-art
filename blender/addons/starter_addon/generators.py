"""Generating code only. Nothing in this file may import or mention the interface."""
import random


def generate(seed=1, size=2.0):
    """Return (vertices, faces). Replace this square with your own generator."""
    rng = random.Random(seed)
    h = size / 2
    vertices = [(-h, -h, 0.0), (h, -h, 0.0), (h, h, 0.0), (-h, h, 0.0)]
    faces = [(0, 1, 2, 3)]
    return vertices, faces
