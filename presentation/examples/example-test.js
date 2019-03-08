const test = async function (t) {

    await t.runForTime(100);

    const sprite = t.getSprite('Sprite1');
    let oldX = sprite.x;

    await t.runForTime(250);

    t.assert.ok(oldX === sprite.x,
        'Sprite must not move when no key is pressed.');

    t.inputImmediate({
        device: 'keyboard',
        key: 'right arrow',
        isDown: true
    });

    await t.runForTime(250);

    t.assert.ok(oldX < sprite.x,
        'Sprite must move when right arrow key is pressed.');
};

module.exports = [
    {
        test: test,
        name: 'Example Test',
        description: 'Tests the sprite movement.',
        categories: []
    }
];
