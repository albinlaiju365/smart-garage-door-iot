const { spawn } = require('child_process');
const path = require('path');

function run(name, dir, command, args) {
    console.log(`[${name}] Starting in ${dir}...`);
    const proc = spawn(command, args, {
        cwd: path.resolve(__dirname, '..', dir),
        stdio: 'inherit',
        shell: true
    });

    proc.on('close', (code) => {
        console.log(`[${name}] Process exited with code ${code}`);
        if (code !== 0) process.exit(code);
    });

    return proc;
}

// Start backend
run('Backend', 'backend', 'node', ['server.js']);

// Start frontend
run('Frontend', 'frontend', 'node', ['node_modules/next/dist/bin/next', 'dev']);
