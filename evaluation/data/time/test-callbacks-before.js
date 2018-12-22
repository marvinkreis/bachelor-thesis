const test = async function (t) {
    t.addCallback(() => {
        for (let i = 0; i < 100000000; i++) { }
    }, false);
    await t.runForTime(10000);
    t.end();
}

module.exports = [
    test
];
