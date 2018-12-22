const test = async function (t) {
    t.addConstraint(() => {
        for (let i = 0; i < 100000000; i++) { }
    });
    await t.runForTime(10000);
    t.end();
}

module.exports = [
    test
];
