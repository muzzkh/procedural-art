"""BLENDER CHALLENGE 3: A SCATTER SYSTEM
Full brief: blender/03-geometry-nodes.html

Checklist
[ ] The tree works on whatever mesh the modifier is put on
[ ] Scatter density varies across the surface by a field
[ ] At least two instance shapes, with random scale and rotation
[ ] At least four exposed settings, including a seed
[ ] A procedural material assigned inside the tree
[ ] This script builds it all from an empty file and applies it to a test object
[ ] Works on a plane, a sphere and the monkey
"""
import bpy

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)

tree = bpy.data.node_groups.new("Scatter System", "GeometryNodeTree")
tree.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
# ---- your exposed settings here, for example: ----
# seed_socket = tree.interface.new_socket(name="Seed", in_out="INPUT", socket_type="NodeSocketInt")

nodes, links = tree.nodes, tree.links


def add(kind, x, y):
    node = nodes.new(kind)
    node.location = (x, y)
    return node


group_in = add("NodeGroupInput", -800, 0)
group_out = add("NodeGroupOutput", 800, 0)

# ---- your nodes here. For now the geometry passes straight through: ----
links.new(group_in.outputs["Geometry"], group_out.inputs["Geometry"])

# ---- a test object ----
bpy.ops.mesh.primitive_uv_sphere_add(radius=2.0)
target = bpy.context.active_object
modifier = target.modifiers.new("Scatter System", "NODES")
modifier.node_group = tree
print("Scatter System:", len(nodes), "nodes on", target.name)
