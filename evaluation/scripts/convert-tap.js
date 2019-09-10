#!/usr/bin/env node

/*
 * Usage: convert-tap.js [--constraint] [FILE]...
 *
 * Splits TAP13 output from multiple projects into single files and converts them to CSV.
 * The output files are renamed according to the map below.
 * A single TAP13 file for every project is placed into ${PWD}/tap.
 * A single CSV file for every project is placed into ${PWD}/csv.
 * A single CSV file for the coverage of every project is placed into ${PWD}/cov.
 *
 * If "--constraint" is specified, parse the TAP13 output according to a different format that
 * is used by the constraint tests.
 *
 * Required modules:
 * tap-parser
 * csv-stringify
 * js-yaml
 * minimist
 */

const fs = require('fs');
const path = require('path');

const Parser = require('tap-parser');
const csvStringify = require('csv-stringify/lib/sync');
const yaml = require('js-yaml');
const minimist = require('minimist');

let isConstraintTests = false;

/**
 * Converts a TAP13 string into a CSV string.
 */
const convertToCsv = function (str) {
    return new Promise ((resolve, reject) => {
        const result = [];
        const parser = new Parser();

        parser.on('assert', test => {
            if (isConstraintTests) {
                for (const entry of test.diag.log) {
                    const id = entry.id;
                    const name = entry.name;
                    const status = entry.status
                    const message = entry.message
                    result.push([id, name, status, message]);
                }
            } else {
                const id = test.id;
                const name = test.name;
                const status = test.ok ? 'pass' : test.diag.severity;
                const message = test.ok ? '' : test.diag.error.message;
                result.push([id, name, status, message]);
            }
        });

        parser.on('complete', () => {
            result.sort((a, b) => a[0] - b[0]);
            result.unshift(['id', 'name', 'status', 'message']);
            resolve(csvStringify(result));
        });

        parser.on('bailout', reason => {
            reject(reason);
        });

        parser.end(str);
        parser.push(null);
    });
}

/**
 * Converts the coverage statistics of a commented out YAML string into a CSV string.
 */
const convertCoverageToCsv = function (str) {
    let coverageString = str.split('# coverage:\n')[1];
    if (typeof coverageString === 'undefined') {
        return null;
    }

    coverageString = coverageString.replace(/^# /gm, '');
    const coverage = yaml.safeLoad(coverageString);

    const result = [['sprite', 'percent', 'total', 'covered']];

    const getRowFromString = (name, coverageStr) => {
        const row = [name];
        const coverage = coverageStr.match(/(.*)\s\((\d+)\/(\d+)\)/);
        row.push(coverage[1]);
        row.push(coverage[2]);
        row.push(coverage[3]);
        return row;
    }

    result.push(getRowFromString("combined", coverage.combined));
    for (const spriteName in coverage.individual) {
        result.push(getRowFromString(spriteName, coverage.individual[spriteName]));
    }

    return(csvStringify(result));
}

/**
 * Splits a raw output string into TAP13, CSV, and coverage CSV files for each project and saves them.
 */
const exportTapAndCsv = async function (str) {
    const name = str.match(/# project: (.*)\./)[1];

    const tapPath = path.join('.', 'tap', name + '.tap');
    const csvPath = path.join('.', 'csv', name + '.csv');
    const covPath = path.join('.', 'cov', name + '.csv');
    const csvStr = await convertToCsv(str);
    const covStr = convertCoverageToCsv(str);

    fs.writeFileSync(tapPath, str);
    console.log(tapPath);
    fs.writeFileSync(csvPath, csvStr);
    console.log(csvPath);
    fs.writeFileSync(covPath, covStr);
    console.log(covPath);
}

const main = function () {
    const argv = minimist(process.argv.slice(2), {boolean: true});

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
    try {
        fs.mkdirSync(path.join('.', 'cov'));
    } catch (err) {
        if (err.code !== 'EEXIST') throw err;
    }

    if (argv.constraint || argv.c) {
        isConstraintTests = true;
    }

    for (const file of argv._) {
        const str = fs.readFileSync(file, 'utf-8');
        const taps = str.split(/(?=# project)/);
        for (const tap of taps) {
            exportTapAndCsv(tap);
        }
    }
}

main();
