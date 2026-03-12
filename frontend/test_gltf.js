import fs from 'fs';
import path from 'path';

const modelPath = path.resolve('public/models/Zyro.glb');
console.log("Checking model at:", modelPath);

// A simple script to read the structure of the GLB without loading it in the browser
// GLTF parser could be used if installed, but for now we'll just check if the file exists and its size
if (fs.existsSync(modelPath)) {
    const stats = fs.statSync(modelPath);
    console.log("File size:", stats.size / 1024 / 1024, "MB");
} else {
    console.log("File not found!");
}
