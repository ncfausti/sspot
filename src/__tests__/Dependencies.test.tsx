import '@testing-library/jest-dom';
import fs from 'fs';
import path from 'path';

// check if path 'assets/<platform>-<arch>/<file>' exists
describe('All platform-specific binaries should exist', () => {
  it('check that mouse event listener binary exists', () => {
    // Switch case on architecture
    const pymouse = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      `${process.platform}-${process.arch}`,
      'pymouse'
    );
    expect(fs.existsSync(pymouse)).toBe(true);
  });

  it('check that face detection binary exists', () => {
    // Switch case on architecture
    const faceDetectionServer = path.join(
      __dirname,
      '..',
      '..',
      'assets',
      `${process.platform}-${process.arch}`,
      'ws_server', // directory
      'ws_server' // binary
    );
    expect(fs.existsSync(faceDetectionServer)).toBe(true);
  });
});