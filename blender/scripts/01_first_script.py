"""Blender lesson 1: a first procedural script.

A grid of columns whose heights and colours come from noise.
Run it from Blender's Scripting tab (open this file, press Run Script), or from a terminal:

    blender --python 01_first_script.py

Tested with Blender 5.3.
"""
import math
import random

import bpy
from mathutils import Vector, noise

SEED = 7
SIZE = 16               # columns along each side
SPACING = 0.6           # metres between columns

# ---- 1. start from an empty scene ----
for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

rng = random.Random(SEED)
offset = Vector((rng.uniform(-100, 100), rng.uniform(-100, 100), 0.0))     # a different patch of noise per seed

# ---- 2. one mesh, shared by every column ----
bpy.ops.mesh.primitive_cube_add(size=1.0)
template = bpy.context.active_object
cube_mesh = template.data
bpy.data.objects.remove(template, do_unlink=True)        # keep the mesh, discard the object

# ---- 3. a few materials to choose from ----
palette = [(0.11, 0.21, 0.34), (0.16, 0.62, 0.56), (0.91, 0.77, 0.42), (0.91, 0.44, 0.32)]
materials = []
for i, colour in enumerate(palette):
    mat = bpy.data.materials.new(f"Column {i}")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*colour, 1.0)
    mat.diffuse_color = (*colour, 1.0)
    materials.append(mat)
cube_mesh.materials.append(materials[0])                 # gives the mesh one material slot

# ---- 4. the loop: position, height and colour all follow from the grid position ----
collection = bpy.data.collections.new("Columns")
bpy.context.scene.collection.children.link(collection)

for j in range(SIZE):
    for i in range(SIZE):
        x = (i - SIZE / 2 + 0.5) * SPACING
        y = (j - SIZE / 2 + 0.5) * SPACING
        n = 0.5 + 0.5 * noise.noise(Vector((x * 0.35, y * 0.35, 0.0)) + offset)      # 0..1
        height = 0.2 + 4.0 * n * n

        column = bpy.data.objects.new(f"Column {i}-{j}", cube_mesh)       # a new object using the shared mesh
        column.location = (x, y, height / 2)                                # a cube is centred, so lift it by half
        column.scale = (SPACING * 0.85, SPACING * 0.85, height)
        collection.objects.link(column)

        # objects that share a mesh can still have their own material, set "on the object"
        slot = column.material_slots[0]
        slot.link = "OBJECT"
        slot.material = materials[min(len(materials) - 1, int(n * len(materials)))]

# ---- 5. a camera and a light, so that it can be rendered ----
camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
bpy.context.scene.collection.objects.link(camera)
camera.location = (9.0, -9.0, 8.0)
camera.rotation_euler = (Vector((0, 0, 1.2)) - camera.location).to_track_quat("-Z", "Y").to_euler()
bpy.context.scene.camera = camera

sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN"))
bpy.context.scene.collection.objects.link(sun)
sun.data.energy = 4.0
sun.rotation_euler = (math.radians(50), 0.0, math.radians(30))

print(f"Built {SIZE * SIZE} columns from seed {SEED}")
