const test = async function (t) {
    const sprite = t.getSprite('Sprite1');

    await t.runForTime(100);
    let oldX = sprite.x;

    await t.runForTime(1000);

    t.assert.ok(oldX === sprite.x);

    t.inputImmediate({
        device: 'keyboard',
        key: 'right arrow',
        isDown: true
    });

    await t.runForTime(1000);

    t.assert.ok(oldX < sprite.x);
};

module.exports = [
    {
        test: test,
        name: 'Example Test',
        description: '',
        categories: []
    }
];
