const test = async function (t) {
    t.registerRandomInputs(new Array(500000).fill({
        device: 'keyboard',
        key: 'space',
        isDown: 'random'
    }));
    t.setRandomInputInterval(0);
    await t.runForTime(10000);
    t.end();
}

module.exports = [
    test
];
