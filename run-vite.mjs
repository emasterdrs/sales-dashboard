import { build } from 'vite';
import fs from 'fs';

process.on('exit', (code) => {
    fs.appendFileSync('debug-exit.log', `EXIT CODE: ${code}\n`);
});
process.on('uncaughtException', (err) => {
    fs.appendFileSync('debug-exit.log', `UNCAUGHT EXCEPTION: ${err.stack}\n`);
    process.exit(1);
});
process.on('unhandledRejection', (reason, p) => {
    fs.appendFileSync('debug-exit.log', `UNHANDLED REJECTION: ${reason}\n`);
    process.exit(1);
});

async function run() {
    try {
        fs.writeFileSync('debug-exit.log', 'STARTING BUILD\n');
        await build();
        fs.appendFileSync('debug-exit.log', "Build finished successfully\n");
    } catch (e) {
        fs.appendFileSync('debug-exit.log', `BUILD ERROR: ${e.stack}\n`);
        process.exit(1);
    }
}

run();
