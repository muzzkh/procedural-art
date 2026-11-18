"""proclib: a small personal library for procedural work in Blender.

Lesson 4 of the Blender section explains how a library like this is organised and loaded.
To use it from Blender's Text Editor, add this folder to Python's search path first:

    import sys
    sys.path.append(r"C:\\path\\to\\Procedural Art\\blender\\scripts")
    import proclib

Tested with Blender 5.3.
"""
import math
import random

import bpy
from mathutils import Vector, noise


def clear_scene():
    """Delete every object, and the meshes and materials nothing uses any more."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.node_groups):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def link(obj, collection=None):
    """Put an object into the scene (an object is invisible until it is in a collection)."""
    (collection or bpy.context.scene.collection).objects.link(obj)
    return obj


def seeded(seed):
    """A random generator and a noise offset that both depend only on the seed."""
    rng = random.Random(seed)
    offset = Vector((rng.uniform(-1000, 1000), rng.uniform(-1000, 1000), rng.uniform(-1000, 1000)))
    return rng, offset


def fbm(x, y, offset, octaves=4):
    """Fractal noise in the range 0..1, like PA.noise(...).fbm in the browser lessons."""
    total, amplitude, frequency, norm = 0.0, 1.0, 1.0, 0.0
    for _ in range(octaves):
        total += amplitude * noise.noise(Vector((x * frequency, y * frequency, 0.0)) + offset)
        norm += amplitude
        amplitude *= 0.5
        frequency *= 2.0
    return 0.5 + 0.5 * total / norm


def material(name, colour, roughness=0.5, metallic=0.0):
    """A simple surface material. colour is (r, g, b) from 0 to 1."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    mat.diffuse_color = (*colour, 1.0)          # the colour shown in solid view
    return mat


def mesh_object(name, vertices, faces, smooth=False):
    """Build an object from lists of points and faces. A face is a tuple of vertex numbers."""
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    if smooth:
        mesh.polygons.foreach_set("use_smooth", [True] * len(mesh.polygons))
    return link(bpy.data.objects.new(name, mesh))


def grid_surface(name, fn, nu, nv, close_u=False, smooth=True):
    """A surface from a function: fn(u, v) -> (x, y, z), with u and v from 0 to 1.

    close_u joins the last column back to the first, for shapes that go all the way round.
    """
    cols = nu if close_u else nu + 1
    vertices = [fn(i / nu, j / nv) for j in range(nv + 1) for i in range(cols)]
    faces = []
    for j in range(nv):
        for i in range(nu):
            a = j * cols + i
            b = j * cols + (i + 1) % cols
            faces.append((a, b, b + cols, a + cols))        # anticlockwise seen from outside
    return mesh_object(name, vertices, faces, smooth)


def look_at(obj, target):
    """Turn an object (usually the camera) to face a point."""
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def camera_and_sun(location=(9, -9, 7), target=(0, 0, 1)):
    """A camera looking at the target, and a sun. Returns the camera object."""
    cam = link(bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera")))
    cam.location = location
    look_at(cam, target)
    bpy.context.scene.camera = cam
    sun = link(bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN")))
    sun.data.energy = 4.0
    sun.rotation_euler = (math.radians(50), 0.0, math.radians(30))
    return cam


def render_still(path, size=600, samples=16):
    """Render the current scene to a PNG file."""
    scene = bpy.context.scene
    scene.render.resolution_x = scene.render.resolution_y = size
    scene.render.filepath = path
    scene.render.image_settings.file_format = "PNG"
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = samples
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.color = (0.05, 0.06, 0.08)
    bpy.ops.render.render(write_still=True)
