import { parseNumber, getAccountNumber, guessAccountNumber } from '../src/ocr';
import { readFile } from 'fs/promises';
import { main } from '../index';

describe('Given `getAccountNumber` function', () => {
    describe('When pass an ocr account number to it', () => {
        test('Then a valid number should be returned', async () => {
            const fixtures = [
                '000000000',
                '111111111',
                '123456789',
                '222222222',
                '333333333',
                '444444444',
                '555555555',
                '666666666',
                '777777777',
                '888888888',
                '999999999'
            ];

            for (let i = 0; i < fixtures.length; i++) {
                const content = await readFile('test/fixtures/' + fixtures[i] + '.txt', 'utf-8');
                const result = parseNumber(content).numbers;
                expect(result.join('')).toBe(fixtures[i]);
            }
        });
    });

    describe('When pass an account which missing some small part', () => {
        test('Then it should auto complete it for a valid token', async () => {
            const content = await readFile('test/fixtures/490867715.txt', 'utf-8');
            const result = parseNumber(content);
            expect(result.numbers.join('')).toBe('49086771?');

            const guessResult = guessAccountNumber(result.numberMatches);
            expect(guessResult).toEqual(['490867715']);
        });
    });
});

describe('Given `index.ts` cli command', () => {
    const _log = console.log;
    const mockedLog = jest.fn();
    beforeEach(() => {
        console.log = mockedLog;
    });

    afterEach(() => {
        console.log = _log;
        mockedLog.mockClear();
    });

    test('Then it should output a valid result', async () => {
        await main(['node', 'index.ts', 'test/fixtures/use_case_1_in.txt']);

        const outputs = await readFile('test/fixtures/use_case_1_out.txt', 'utf-8');
        expect(mockedLog.mock.calls.map(args => args[0])).toEqual(outputs.split('\n').filter(Boolean));
    });

    test('Then it should recognize invalid input', async () => {
        await main(['node', 'index.ts', 'test/fixtures/use_case_3_in.txt']);

        const outputs = await readFile('test/fixtures/use_case_3_out.txt', 'utf-8');
        expect(mockedLog.mock.calls.map(args => args[0])).toEqual(outputs.split('\n').filter(Boolean));
    });

    test('Then it try to recognize ambiguous input', async () => {
        await main(['node', 'index.ts', 'test/fixtures/use_case_4_in.txt']);

        const outputs = await readFile('test/fixtures/use_case_4_out.txt', 'utf-8');
        expect(mockedLog.mock.calls.map(args => args[0])).toEqual(outputs.split('\n').filter(Boolean));
    });
});
