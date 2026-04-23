#!/usr/bin/env node
import { startServer } from './server.js';
import open from 'open';

const args = process.argv.slice(2);

if (args.length < 2) {
    console.error("Usage: compare-splats <path_to_ply_a> <path_to_ply_b>");
    process.exit(1);
}

const pathA = args[0];
const pathB = args[1];

startServer(pathA, pathB);

// Automatically open the browser
setTimeout(() => {
    open('http://localhost:3000');
}, 1000);
