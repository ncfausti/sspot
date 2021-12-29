import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';

// check if path 'assets/<platform>-<arch>/<file>' exists
describe('All platform-specific binaries should exist', () => {
  it('check that mouse event listener binary exists', () => {
    const pymouseBinary =
      process.platform === 'darwin' ? 'pymouse' : 'pymouse.exe';
    const pymouse = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      `${process.platform}-${process.arch}`,
      pymouseBinary
    );

    expect(fs.existsSync(pymouse)).toBe(true);
  });

  it('check that face detection binary exists', () => {
    const serverBinary =
      process.platform === 'darwin' ? 'ws_server' : 'ws_server.exe';
    // Switch case on architecture
    const faceDetectionServer = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      `${process.platform}-${process.arch}`,
      'ws_server', // directory
      serverBinary
    );
    expect(fs.existsSync(faceDetectionServer)).toBe(true);
  });
});
