const { Worker, parentPort } = require('worker_threads');

function runInThread(workerData) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: workerData
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  })
  .catch(error => {
    console.error('Erro dentro da thread:', error);
  });
}

// Exporta a função para que ela possa ser utilizada em outros arquivos
module.exports = {
    runInThread
};
