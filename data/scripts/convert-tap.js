#!/usr/bin/env node

/*
 * Usage: convert-tap.js [FILE]...
 *
 * Splits TAP13 output from multiple projects into single files and converts them to CSV.
 * The output files are renamed according to the map below.
 * A single TAP13 file for every project is placed into ${PWD}/tap.
 * A single CSV file for every project is placed into ${PWD}/csv.
 */

const fs = require('fs');
const path = require('path');
const {Readable} = require('stream');

const Parser = require('tap-parser');
const csvStringify = require('csv-stringify/lib/sync');

const nameMap = {
    'FS_001': 'K6_S01',
    'FS_002': 'K6_S02',
    'FS_003': 'K6_S03',
    'FS_005': 'K6_S05',
    'FS_006': 'K6_S06',
    'FS_010': 'K6_S10',
    'FS_011': 'K6_S11',
    'FS_012': 'K6_S12',
    'FS_013': 'K6_S13',
    'FS_014': 'K6_S14',
    'FS_015': 'K6_S15',
    'FS_016': 'K6_S16',
    'FS_017': 'K6_S17',
    'FS_018': 'K6_S18',
    'FS_019': 'K6_S19',
    'FS_020': 'K6_S20',
    'FS_027': 'K6_S27',
    'FS_029': 'K6_S29',
    'FS_030': 'K6_S30',
    'FS_031': 'K6_S31',
    'FS_033': 'K6_S33',
    '2': 'K7_S02',
    '3': 'K7_S03',
    '4': 'K7_S04',
    '5': 'K7_S05',
    '6': 'K7_S06',
    '7': 'K7_S07',
    '8': 'K7_S08',
    '10': 'K7_S10',
    '11': 'K7_S11',
    '12': 'K7_S12',
    '14': 'K7_S14',
    '15': 'K7_S15',
    '16': 'K7_S16',
    '17': 'K7_S17',
    '18': 'K7_S18',
    '19': 'K7_S19',
    '20': 'K7_S20',
    '24': 'K7_S24',
    '26': 'K7_S26',
    '27': 'K7_S27'
}

const convertToCsv = function (str) {
    return new Promise ((resolve, reject) => {
        const result = [];
        const parser = new Parser();

        parser.on('assert', test => {
            const id = test.id;
            const name = test.name;
            const status = test.ok ? 'pass' : test.diag.severity;
            const message = test.ok ? '' : test.diag.error.message;
            const constraint = test.ok ? '' : Number(typeof test.diag.error.constraint !== 'undefined');
            result.push([id, name, status, message, constraint]);
        });

        parser.on('complete', () => {
            result.sort((a, b) => a[0] - b[0]);
            result.unshift(['id', 'name', 'status', 'message', 'constraint']);
            resolve(csvStringify(result));
        });

        parser.on('bailout', reason => {
            reject(reason);
        });

        parser.end(str);
        parser.push(null);
    });
}

const exportTapAndCsv = async function (str) {
    const projectName = str.match(/#project: (.*)\./)[1];
    const name = nameMap[projectName];

    if (typeof name === 'undefined') {
        console.log(`Can't match project name: ${projectName}`);
        return;
    }

    const tapPath = path.join('.', 'tap', name + '.tap');
    const csvPath = path.join('.', 'csv', name + '.csv');
    const csvStr = await convertToCsv(str);

    fs.writeFileSync(tapPath, str);
    console.log(tapPath);
    fs.writeFileSync(csvPath, csvStr);
    console.log(csvPath);
}

const main = function () {
    try {
        fs.mkdirSync(path.join('.', 'tap'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }
    try {
        fs.mkdirSync(path.join('.', 'csv'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    const files = process.argv.slice(2);

    for (const file of files) {
        const str = fs.readFileSync(file, 'utf-8');
        const taps = str.split(/(?=#project)/);
        for (const tap of taps) {
            exportTapAndCsv(tap);
        }
    }
}

main();
