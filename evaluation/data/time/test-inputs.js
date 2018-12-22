const test = async function (t) {
    for (let i = 0; i < 2500000; i++) {
        t.addInput(100000, {
            device: 'keyboard',
            key: 'space',
            isDown: 'toggle'
        });
    }
    await t.runForTime(10000);
    t.end();
}

module.exports = [
    test
];
