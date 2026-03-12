const fs = require('fs');
const gltfPath = './public/models/Zyro.gltf';

const data = JSON.parse(fs.readFileSync(gltfPath, 'utf8'));

console.log("MATERIALS:");
data.materials.forEach((m, i) => console.log(`[${i}] ${m.name}`));

console.log("\nMESHES:");
data.nodes.forEach(n => {
    if (n.mesh !== undefined) {
        const mesh = data.meshes[n.mesh];
        console.log(`Node: ${n.name}`);
        mesh.primitives.forEach((p, i) => {
             const matName = data.materials[p.material]?.name;
             console.log(`  - Primitive ${i} uses material: ${matName}`);
        });
    }
});
