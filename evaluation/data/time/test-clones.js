const test = async function (t) {
    await t.runForTime(10000);
    t.end();
}

module.exports = [
    test
];
