import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import path from 'path';
import os from 'os';

// Fix for Ubuntu on CI
export default function MouseListener() {
  let service: ChildProcessWithoutNullStreams;

  return {
    start: () => {
      const curDir = process.cwd();
      const { platform } = process;
      const binary = platform === 'darwin' ? 'pymouse' : 'pymouse.exe';
      const arch = os.arch(); // 'x64' or 'arm64'
      const subFolder = path.join(platform, arch);
      const assets = path.join(__dirname, '..', 'assets');

      const binDir = path.join(assets, subFolder);
      process.chdir(binDir);
      service = spawn(`./${binary}`);
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
