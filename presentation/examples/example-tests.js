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
        'Sprite must move to the right when right arrow key is pressed.');
};





const constraintTestSimple = async function (t) {
    await t.runForTime(100)
    const sprite = t.getSprite('Sprite1');

    let oldX = sprite.x;

    t.addCallback(() => {
        oldX = sprite.x;
    });

    t.addConstraint(() => {
        if (t.isKeyDown('right arrow')) {
            t.assert.ok(sprite.x > oldX,
                'Sprite must move to the right when right arrow key is pressed.');
        } else {
            t.assert.ok(sprite.x === oldX,
                'Sprite must not move to the right when no key is pressed.');
        }
    });

    t.detectRandomInputs();
    await t.runForTime(2000);
};





const constraintTest = async function (t) {
    /* (1) Give the program some time to initialize. */
    await t.runForTime(100);

    let sprite = t.getSprite('Sprite1');

    t.assume.less(sprite.x, t.getStageSize().width / 2,
        'Sprite must not start at the right edge of the screen.');

    /* When the last right arrow key press started. */
    let startPressedTime = undefined;
    /* When the right arrow key was last recorded being pressed. */
    let pressedTime = undefined;
    /* When the sprite was last recorded moving right. */
    let movedRightTime = undefined;
    /* If the right arrow key was pressed in the previous step. */
    let previouslyPressed = t.isKeyDown('right arrow');
    /* If the right arrow key was pressed (and released) at all. */
    let pressed = false, released = false;

    /* (2) Track when the right arrow key is being pressed,
     * and when the sprite is moving to the right. */

    const trackRightKeyCb = t.addCallback(() => {
        const currentTime = t.getTotalTimeElapsed();
        if (t.isKeyDown('right arrow')) {
            pressedTime = currentTime;
            if (!previouslyPressed) {
                startPressedTime = currentTime;
            }
            previouslyPressed = true;
            pressed = true;
        } else {
            previouslyPressed = false;
            released = true;
        }
    });

    const trackSpriteMoveCb = t.addCallback(() => {
        if (sprite.x > sprite.old.x) {
            movedRightTime = t.getTotalTimeElapsed();
        }
    });

    /* (3) Check if the sprite only moves when the right arrow
     * key was pressed, and if it doesn't move when the key was
     * not pressed. */

    const moveTimingsConstraint = t.addConstraint(() => {
        if (sprite.x < t.getStageSize().width / 2) {
            const currentTime = t.getTotalTimeElapsed();
            if (currentTime > startPressedTime + 100) {
                t.assert.ok(Math.abs(movedRightTime - pressedTime) <= 100,
                    'Sprite must move right when, and only when, the right arrow key is pressed.');
            }
        }
    });

    const moveDirectionConstraint = t.addConstraint(() => {
        t.assert.ok(sprite.x >= sprite.old.x,
            'Sprite must only stand still or move right');
        t.assert.ok(sprite.y == sprite.old.y,
            'Sprite must not move vertically.');
    });

    /* (4) Some code, which registers inputs. Or nothing if
     * inputs are done manually. For example, generated input: */
    t.setRandomInputInterval(250);
    t.detectRandomInputs();

    /* (5) Run the program. */
    await t.runForTime(2000);

    /* (6) Check if the right arrow key was pressed at all,
     * and if it was ever released. */
    t.assume.ok(pressed, 'Right arrow key must be pressed.');
    t.assume.ok(released, 'Right arrow key must be released.');
};





const constraintTestReset = async function (t) {
    let sprite = t.getSprite('Sprite1');

    /* When the last right arrow key press started. */
    let startPressedTime = undefined;
    /* When the right arrow key was last recorded being pressed. */
    let pressedTime = undefined;
    /* When the sprite was last recorded moving right. */
    let movedRightTime = undefined;
    /* If the right arrow key was pressed in the previous step. */
    let previouslyPressed = t.isKeyDown('right arrow');
    /* If the right arrow key was pressed (and released) at all. */
    let pressed = false, released = false;

    /* (2) Track when the right arrow key is being pressed,
     * and when the sprite is moving to the right. */

    const trackRightKeyCb = t.addCallback(() => {
        const currentTime = t.getTotalTimeElapsed();
        if (t.isKeyDown('right arrow')) {
            pressedTime = currentTime;
            if (!previouslyPressed) {
                startPressedTime = currentTime;
            }
            previouslyPressed = true;
            pressed = true;
        } else {
            previouslyPressed = false;
            released = true;
        }
    });

    const trackSpriteMoveCb = t.addCallback(() => {
        if (sprite.x > sprite.old.x) {
            movedRightTime = t.getTotalTimeElapsed();
        }
    });

    /* (3) Check if the sprite only moves when the right arrow
     * key was pressed, and if it doesn't move when the key was
     * not pressed. */

    const moveTimingsConstraint = t.addConstraint(() => {
        if (sprite.x < t.getStageSize().width / 2) {
            const currentTime = t.getTotalTimeElapsed();
            if (currentTime > startPressedTime + 100) {
                t.assert.ok(Math.abs(movedRightTime - pressedTime) <= 100,
                    'Sprite must move right when, and only when, the right arrow key is pressed.');
            }
        }
    });

    const moveDirectionConstraint = t.addConstraint(() => {
        t.assert.ok(sprite.x >= sprite.old.x,
            'Sprite must only stand still or move right');
        t.assert.ok(sprite.y == sprite.old.y,
            'Sprite must not move vertically.');
    });

    /* (4) Some code, which registers inputs. Or nothing if
     * inputs are done manually. For example, generated input: */
    t.setRandomInputInterval(250);
    t.detectRandomInputs();

    /* (5) Run the program. */
    for (let i = 0; i < 5; i++) {
        const constraints = [moveTimingsConstraint, moveDirectionConstraint];

        /* (1) Suspend information tracking. */
        trackRightKeyCb.disable();
        trackSpriteMoveCb.disable();

        /* (2) Suspend constraints.
         * Get a list active constraints first.
         * (Constraints that did not fail) */
        const ac = constraints.filter(c => c.isActive());
        for (const constraint of ac) {
            constraint.disable();
        }

        /* (3) Reset per-run information
           (keep values of 'pressed' and 'released'). */
        startPressedTime = undefined;
        pressedTime = undefined;
        movedRightTime = undefined;
        previouslyPressed = t.isKeyDown('right arrow');

        /* (4) Press the green flag and give the program
           some time to Initialize. */
        t.greenFlag();
        await t.runForTime(100);

        /* (5) Get new sprites. */
        sprite = t.getSprite('Sprite1');

        t.assume.less(sprite.x, t.getStageSize().width / 2,
            'Sprite must not start at the right edge of the screen.');

        /* (6) Activate information tracking. */
        trackRightKeyCb.enable();
        trackSpriteMoveCb.enable();

        /* (7) Activate constraints. */
        for (const constraint of ac) {
            constraint.enable();
        }

        /* (8) Run the program. */
        await t.runForTime(2000);
    }

    /* (6) Check if the right arrow key was pressed at all,
     * and if it was ever released. */
    t.assume.ok(pressed, 'Right arrow key must be pressed.');
    t.assume.ok(released, 'Right arrow key must be released.');
};





module.exports = [
    {
        test: test,
        name: 'Example Test (Normal)',
        description: 'Tests the sprite movement.',
    },
    {
        test: constraintTestSimple,
        name: 'Example Test (Property-based, simple)',
        description: 'Tests the sprite movement.',
    },
    {
        test: constraintTest,
        name: 'Example Test (Property-based)',
        description: 'Tests the sprite movement.',
    },
    {
        test: constraintTestReset,
        name: 'Example Test (Property-based, with resets)',
        description: 'Tests the sprite movement.',
    }
];
