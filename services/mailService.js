const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const nodemailer = require('nodemailer');
const db = require('../db');

function sendEmail(transporterOptions, mailOptions, projectId, ticket) {
    const transporter = nodemailer.createTransport(transporterOptions);
    transporter.sendMail(mailOptions, async (error, info) => {
      const successfully = error == null;
      
      // Save log email sent
      await db.executeProcedure('USP_InsertEmailLog', 
        [mailOptions.to, mailOptions.subject, mailOptions.html, projectId, error ?? info, successfully, ticket], 
        ticket,
        true
      );
    });
}

if (isMainThread) {
    // Main thread

    const transporterOptions = {
        service: 'outlook',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secureConnection: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        },
        tls: {
            ciphers: 'SSLv3',
            rejectUnauthorized: false
        }
    };

    const emailModule = {
        sendEmail: (mailOptions, projectId, ticket) => {
            return new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { transporterOptions, mailOptions, projectId, ticket }
                });

                worker.on('message', (message) => {
                    console.log(message);
                    resolve(message);
                });

                worker.on('error', (error) => {
                    console.log(error);
                    reject(error);
                });

                worker.on('exit', (code) => {
                    console.log(code);
                    if (code !== 0) {
                        reject(new Error(`A thread do worker terminou com código de saída: ${code}`));
                    }
                });
            });
        }
    };

    module.exports = emailModule;
} else {
    // Thread

    const { transporterOptions, mailOptions, projectId, ticket } = workerData;

    sendEmail(transporterOptions, mailOptions, projectId, ticket);
}
