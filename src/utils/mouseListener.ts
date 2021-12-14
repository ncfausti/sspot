import { spawn } from 'child_process';
import path from 'path';

export default function MouseListener() {
  let service;

  return {
    start: () => {
      const curDir = process.cwd();
      const mouseListenerBin =
        process.platform === 'darwin' ? 'pymouse' : 'pymouse.exe';
      const binDir = path.join(__dirname, '..', 'assets');
      process.chdir(binDir);
      service = spawn(`./${mouseListenerBin}`);
      process.chdir(curDir);
      service.stdout.setEncoding('utf8');
      return service;
    },
    kill: () => {
      return service.kill();
    },
  };
}
