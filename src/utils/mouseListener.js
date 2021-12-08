const { spawn } = require('child_process');

const MouseListener = () => {
  let service;

  return {
    start: () => {
      service = spawn(
        '/Users/nick/smile-ml/backends/spot-api/dist/pymouse/pymouse'
      );
      service.stderr.pipe(process.stderr);
      service.stdout.pipe(process.stdout);
      return service;
    },
    kill: () => {
      return service.kill();
    },
  };
};

exports.MouseListener = MouseListener;
