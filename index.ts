import { open } from 'fs/promises';
import { getAccountNumber } from './src/ocr';

export async function main(argv: string[]) {
    const file = argv[2];
    const fd = await open(file, 'r');
    const stream = fd.createReadStream({
        autoClose: true,
        encoding: 'utf-8',
    });

    await new Promise((resolve, reject) => {
        let bufferData = '';
        let lineCount = 0;
        stream.on('data', (chunk: string) => {
            let chunkOffset = 0;
            for (let i = 0; i < chunk.length; i++) {
                if (chunk[i] === '\n') {
                    lineCount += 1;
                }

                if (lineCount === 3 && chunk[i] === '\n') {
                    const text = bufferData + chunk.substring(chunkOffset, i + 1);
                    const accountNumber = getAccountNumber(text);
                    console.log(accountNumber);
                }

                if (lineCount === 4) {
                    lineCount = 0;
                    chunkOffset = i + 1;
                    bufferData = '';
                }
            }

            if (chunkOffset < chunk.length) {
                bufferData += chunk.substring(chunkOffset);
            }
        });
        stream.on('end', () => {
            resolve();
        });
        stream.on('error', reject);
    });

    await fd.close();
}

if (require.main === module) {
    main(process.argv);
}
