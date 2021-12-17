import { spawn } from 'child_process';
import path from 'path';

// Fix for Ubuntu on CI
export default function MouseListener() {
  let service;

  return {
    start: () => {
      const curDir = process.cwd();
      const mouseListenerBin =
        process.platform === 'darwin' ? 'pymouse' : 'pymouse.exe';
      const assets = path.join(__dirname, '..', 'assets');
      const binDir = path.join(assets, 'pymouse');
      process.chdir(binDir);
      service = spawn(`./${mouseListenerBin}`);
      process.chdir(curDir);
      service.stdout.setEncoding('utf8');
      service.stderr.setEncoding('utf8');

      return service;
    },
    kill: () => {
      return service.kill();
    },
  };
}
