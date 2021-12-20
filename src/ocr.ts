const NUMBER_SEQ =[
    ' _ ' +
    '| |' +
    '|_|',

    '   ' +
    '  |' +
    '  |',

    ' _ ' +
    ' _|' +
    '|_ ',

    ' _ ' +
    ' _|' +
    ' _|',

    '   ' +
    '|_|' +
    '  |',

    ' _ ' +
    '|_ ' +
    ' _|',

    ' _ ' +
    '|_ ' +
    '|_|',

    ' _ ' +
    '  |' +
    '  |',

    ' _ ' +
    '|_|' +
    '|_|',

    ' _ ' +
    '|_|' +
    ' _|',
];

export function checksum(account: number[]) {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += account[i] * (9 - i);
    }

    return sum % 11 === 0;
}

export interface ParsedResult {
    readonly numbers: Array<number | '?'>;
    readonly numberMatches: number[];
}

export function parseNumber(text: string): ParsedResult {
    const numberMatches = [];
    for (let i = 0; i < 9; i++) {
        numberMatches[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    }

    for (let i = 0; i < text.length; i++) {
        const numberIdx = Math.floor(i % 28 / 3);
        if (numberIdx >= 9) {
            continue;
        }

        const lineIdx = Math.floor(i / 28);
        const charPos = i - lineIdx * 28 - numberIdx * 3 + lineIdx * 3;
        for (let j = 0; j < NUMBER_SEQ.length; j++) {
            if (NUMBER_SEQ[j][charPos] === text[i]) {
                numberMatches[numberIdx][j] += 1;
            }
        }
    }

    let result: Array<number | '?'> = ['?', '?', '?', '?', '?', '?', '?', '?', '?'];
    let hasError = false;
    for (let i = 0; i < numberMatches.length; i++) {
        let found = false;
        for (let j = 0; j < 10; j++) {
            if (numberMatches[i][j] === 9) {
                result[i] = j;
                found = true;
                break;
            }
        }

        hasError = hasError || !found;
    }

    return {
        numbers: result,
        numberMatches,
    };
}

export function getAccountNumber(text: string) {
    const parseResult = parseNumber(text);
    const isIllegal = parseResult.numbers.filter(n => n === '?').length > 0;

    const isValid = !isIllegal && checksum(parseResult.numbers as number[]);
    if (!isValid) {
        const guessedNumbers = guessAccountNumber(parseResult.numberMatches);
        if (guessedNumbers.length === 1) {
            return guessedNumbers[0];
        }

        if (guessedNumbers.length > 1) {
            return parseResult.numbers.join('') + ' AMB [' + guessedNumbers.map(x => `'${x}'`).join(', ') + ']';
        }
    }

    let result = parseResult.numbers.join('');
    if (isIllegal) {
        result += ' ILL';
    } else if (!checksum(parseResult.numbers as number[])) {
        result += ' ERR';
    }

    return result;
}

function combinationPossibleNumbers(posibleNumbers: number[][]): number[][] {
    if (posibleNumbers.length === 1) {
        return posibleNumbers[0].map(n => [n]);
    }

    const result = [];
    const tailResults = combinationPossibleNumbers(posibleNumbers.slice(1));
    for (let i = 0; i < posibleNumbers[0].length; i++) {
        for (let j = 0; j < tailResults.length; j++) {
            result.push([posibleNumbers[0][i]].concat(tailResults[j]));
        }
    }

    return result;
}

export function guessAccountNumber(numberMatches: number[]): String[] {
    const posibleNumbers = [];
    for (let i = 0; i < numberMatches.length; i++) {
        posibleNumbers[i] = [];
        for (let j = 0; j < 10; j++) {
            // allow mission one part for each number
            if (numberMatches[i][j] >= 8) {
                posibleNumbers[i].push(j);
            }
        }
    }

    const posibleResult = combinationPossibleNumbers(posibleNumbers).filter(numbers => {
        const score = numbers.reduce((memo, curr, idx) => {
            return numberMatches[idx][curr] + memo;
        }, 0);

        return score >= 80; // only allow mission one part
    }).filter(checksum);

    return posibleResult.map(numbers => numbers.join(''));
}
