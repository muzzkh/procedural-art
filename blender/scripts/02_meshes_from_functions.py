"""Blender lesson 2: meshes from functions, modifiers, and export for 3D printing.

Builds three things:
  1. a terrain, vertex by vertex, with mesh.from_pydata
  2. a twisted vase, as a surface from a (u, v) function, made printable with a Solidify modifier
  3. a wobbly sphere, edited in place with bmesh

and then exports the vase as an STL file next to this script.

Tested with Blender 5.3.
"""
import math
import os
import random

import bmesh
import bpy
from mathutils import Vector, noise

SEED = 3
rng = random.Random(SEED)
offset = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), rng.uniform(-100, 100)))

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)


def fbm(x, y, octaves=4):
    """Fractal noise in 0..1."""
    total, amplitude, frequency, norm = 0.0, 1.0, 1.0, 0.0
    for _ in range(octaves):
        total += amplitude * noise.noise(Vector((x * frequency, y * frequency, 0.0)) + offset)
        norm += amplitude
        amplitude *= 0.5
        frequency *= 2.0
    return 0.5 + 0.5 * total / norm


def add_object(name, vertices, faces):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)          # points, edges (none: Blender works them out), faces
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    return obj


# ------------------------------------------------------------------ 1. terrain
N = 80                      # cells along each side
SIZE = 8.0                  # metres

vertices = []
for j in range(N + 1):
    for i in range(N + 1):
        x = (i / N - 0.5) * SIZE
        y = (j / N - 0.5) * SIZE
        z = 2.2 * max(0.0, fbm(x * 0.45, y * 0.45) - 0.42)
        vertices.append((x, y, z))

faces = []
for j in range(N):
    for i in range(N):
        a = j * (N + 1) + i
        faces.append((a, a + 1, a + N + 2, a + N + 1))     # one four-sided face per grid square

terrain = add_object("Terrain", vertices, faces)
terrain.location = (-6.0, 0.0, 0.0)


# ------------------------------------------------------------------ 2. vase
def vase(u, v):
    """u goes round the vase, v goes up it. Both run from 0 to 1. Units are millimetres."""
    angle = u * math.tau + v * 1.4                              # the twist: angle shifts with height
    profile = 0.8 + 0.3 * math.sin(v * 2.9 + 0.3) - 0.12 * v    # the silhouette
    ribs = 0.05 * math.sin(u * math.tau * 8)                    # eight ribs
    r = 30.0 * (profile + ribs)
    return (r * math.cos(angle), r * math.sin(angle), v * 120.0)


NU, NV = 96, 60
vertices = [vase(i / NU, j / NV) for j in range(NV + 1) for i in range(NU)]
faces = []
for j in range(NV):
    for i in range(NU):
        a = j * NU + i
        b = j * NU + (i + 1) % NU                               # wrap round: the last column joins the first
        faces.append((a, b, b + NU, a + NU))
faces.append(tuple(reversed(range(NU))))                        # a floor: one face through the whole bottom ring

vase_obj = add_object("Vase", vertices, faces)
vase_obj.scale = (0.02, 0.02, 0.02)                             # shown at 1:50 beside the terrain
for polygon in vase_obj.data.polygons:
    polygon.use_smooth = True

# Modifiers are procedural operations that stay editable. Solidify gives the open surface a wall.
solidify = vase_obj.modifiers.new("Wall", "SOLIDIFY")
solidify.thickness = 2.4                                        # millimetres, in the mesh's own units
solidify.offset = -1.0                                          # thicken inward, so the outside keeps its size


# ------------------------------------------------------------------ 3. editing a mesh with bmesh
mesh = bpy.data.meshes.new("Blob")
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=4, radius=1.0)
for vert in bm.verts:                                           # push every vertex along its normal by noise
    n = noise.noise(vert.co * 1.6 + offset)
    vert.co += vert.normal * n * 0.45
bm.to_mesh(mesh)
bm.free()
blob = bpy.data.objects.new("Blob", mesh)
bpy.context.scene.collection.objects.link(blob)
blob.location = (5.0, 0.0, 1.4)
for polygon in mesh.polygons:
    polygon.use_smooth = True

subdivide = blob.modifiers.new("Smooth", "SUBSURF")
subdivide.levels = 1
subdivide.render_levels = 2


# ------------------------------------------------------------------ export the vase for printing
bpy.ops.object.select_all(action="DESELECT")
vase_obj.select_set(True)
bpy.context.view_layer.objects.active = vase_obj
vase_obj.scale = (1.0, 1.0, 1.0)                                # full size for the file: 1 unit = 1 mm

folder = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else bpy.app.tempdir
path = os.path.join(folder, "vase.stl")
bpy.ops.wm.stl_export(filepath=path, export_selected_objects=True, apply_modifiers=True)
vase_obj.scale = (0.02, 0.02, 0.02)

print(f"Terrain: {len(terrain.data.polygons)} faces. Vase exported to {path}")
