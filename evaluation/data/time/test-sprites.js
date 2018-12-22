const test = async function (t) {
    await t.runForTime(20000);
    t.end();
}

module.exports = [
    test
];
