"""Blender lesson 3: building a Geometry Nodes setup, and a procedural material, from Python.

The node tree made here does this:

    Grid  ->  Set Position (raise by a noise texture)  ->  terrain
    terrain -> Distribute Points on Faces -> Instance on Points (cones) -> trees
    Join terrain and trees -> output

Two values are exposed on the modifier, so they can be changed without opening the node editor.

Tested with Blender 5.3. Socket names changed between versions (for example the noise texture's
first output is "Fac" in 4.x and "Factor" in 5.x), so this script reaches outputs by position
where the name is unreliable.
"""
import bpy

for obj in list(bpy.data.objects):
    bpy.data.objects.remove(obj, do_unlink=True)


# ------------------------------------------------------------------ the node tree
tree = bpy.data.node_groups.new("Procedural Hills", "GeometryNodeTree")

# what the modifier shows: one geometry in, one geometry out, and our own settings
tree.interface.new_socket(name="Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
tree.interface.new_socket(name="Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
height_socket = tree.interface.new_socket(name="Height", in_out="INPUT", socket_type="NodeSocketFloat")
height_socket.default_value = 1.6
density_socket = tree.interface.new_socket(name="Tree Density", in_out="INPUT", socket_type="NodeSocketFloat")
density_socket.default_value = 3.0

nodes, links = tree.nodes, tree.links


def add(kind, x, y):
    """Create a node and place it, so the tree is readable when opened in the editor."""
    node = nodes.new(kind)
    node.location = (x, y)
    return node


group_in = add("NodeGroupInput", -900, 0)
group_out = add("NodeGroupOutput", 900, 0)

# 1. a flat grid
grid = add("GeometryNodeMeshGrid", -700, 200)
grid.inputs["Size X"].default_value = 10.0
grid.inputs["Size Y"].default_value = 10.0
grid.inputs["Vertices X"].default_value = 120
grid.inputs["Vertices Y"].default_value = 120

# 2. a noise texture, turned into an upward offset
noise = add("ShaderNodeTexNoise", -700, -150)
noise.inputs["Scale"].default_value = 0.45
noise.inputs["Detail"].default_value = 5.0

multiply = add("ShaderNodeMath", -480, -150)
multiply.operation = "MULTIPLY"
links.new(noise.outputs[0], multiply.inputs[0])              # the noise value...
links.new(group_in.outputs["Height"], multiply.inputs[1])    # ...times the Height setting

offset = add("ShaderNodeCombineXYZ", -280, -150)
links.new(multiply.outputs[0], offset.inputs["Z"])

set_position = add("GeometryNodeSetPosition", -80, 150)
links.new(grid.outputs["Mesh"], set_position.inputs["Geometry"])
links.new(offset.outputs["Vector"], set_position.inputs["Offset"])

smooth = add("GeometryNodeSetShadeSmooth", 110, 150)
links.new(set_position.outputs["Geometry"], smooth.inputs[0])

# 3. scatter points over the surface, and put a cone on each
scatter = add("GeometryNodeDistributePointsOnFaces", 110, -100)
links.new(set_position.outputs["Geometry"], scatter.inputs["Mesh"])
links.new(group_in.outputs["Tree Density"], scatter.inputs["Density"])

cone = add("GeometryNodeMeshCone", 110, -380)
cone.inputs["Vertices"].default_value = 6
cone.inputs["Radius Bottom"].default_value = 0.09
cone.inputs["Depth"].default_value = 0.45

random_size = add("FunctionNodeRandomValue", 110, -620)       # each tree a different size
random_size.data_type = "FLOAT"
random_size.inputs["Min"].default_value = 0.5
random_size.inputs["Max"].default_value = 1.6

instance = add("GeometryNodeInstanceOnPoints", 380, -100)
links.new(scatter.outputs["Points"], instance.inputs["Points"])
links.new(cone.outputs["Mesh"], instance.inputs["Instance"])
links.new(random_size.outputs[0], instance.inputs["Scale"])

# 4. join the terrain and the trees
join = add("GeometryNodeJoinGeometry", 650, 0)
links.new(smooth.outputs[0], join.inputs[0])
links.new(instance.outputs["Instances"], join.inputs[0])      # a second link into the same socket adds to it
links.new(join.outputs[0], group_out.inputs["Geometry"])


# ------------------------------------------------------------------ an object that uses the tree
mesh = bpy.data.meshes.new("Hills")
hills = bpy.data.objects.new("Hills", mesh)
bpy.context.scene.collection.objects.link(hills)
modifier = hills.modifiers.new("Procedural Hills", "NODES")
modifier.node_group = tree


def set_input(modifier, socket, value):
    """Change an exposed setting from Python. Each one is stored under its socket's identifier."""
    if hasattr(modifier, "properties"):                         # Blender 5.x
        getattr(modifier.properties.inputs, socket.identifier).value = value
    else:                                                       # Blender 4.x
        modifier[socket.identifier] = value


set_input(modifier, height_socket, 2.0)
set_input(modifier, density_socket, 4.0)


# ------------------------------------------------------------------ a procedural material
mat = bpy.data.materials.new("Layered Rock")
mat.use_nodes = True
mnodes, mlinks = mat.node_tree.nodes, mat.node_tree.links
bsdf = mnodes["Principled BSDF"]

texture = mnodes.new("ShaderNodeTexNoise")
texture.location = (-600, 200)
texture.inputs["Scale"].default_value = 2.5
texture.inputs["Detail"].default_value = 8.0

ramp = mnodes.new("ShaderNodeValToRGB")                      # a colour ramp: maps 0..1 to a gradient
ramp.location = (-350, 200)
ramp.color_ramp.elements[0].color = (0.10, 0.22, 0.12, 1.0)
ramp.color_ramp.elements[1].color = (0.75, 0.68, 0.50, 1.0)
mlinks.new(texture.outputs[0], ramp.inputs[0])
mlinks.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
bsdf.inputs["Roughness"].default_value = 0.85
mesh.materials.append(mat)

# the Set Material node applies it to the generated geometry (which has no material slots of its own)
set_material = add("GeometryNodeSetMaterial", 780, 0)
set_material.inputs["Material"].default_value = mat
links.new(join.outputs[0], set_material.inputs["Geometry"])
links.new(set_material.outputs[0], group_out.inputs["Geometry"])

# ------------------------------------------------------------------ check the result
depsgraph = bpy.context.evaluated_depsgraph_get()
evaluated = hills.evaluated_get(depsgraph)
points = len(evaluated.data.vertices)
instances = sum(1 for inst in depsgraph.object_instances if inst.is_instance and inst.parent and inst.parent.original == hills)
print(f"Geometry Nodes: {len(nodes)} nodes, terrain has {points} vertices, {instances} trees instanced")
