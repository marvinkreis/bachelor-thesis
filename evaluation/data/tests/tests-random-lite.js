/* eslint-disable eqeqeq */
/* eslint-disable no-loop-func */
/* eslint-disable max-len */

// ==================== Helper Functions =======================================

const isBowl = sprite => sprite.name.toLowerCase().match(/bowl/);
const isApple = sprite => sprite.name.toLowerCase().match(/(apfel|apple)/);
const isBanana = sprite => sprite.name.toLowerCase().match(/banan/);
const isTime = sprite => sprite.name.toLowerCase().match(/(zeit|time)/);
const isScore = sprite => sprite.name.toLowerCase().match(/(punkt|point|score)/);
const gameOverRegex = /(end|over)/;

/**
 * Retrieves requested sprites and variables used in the program by their name.
 * @param {TestDriver} t The test driver.
 * @param {string[]} request A list containing the names of sprites to retrieve.
 * @return {{stage: Sprite, bowl: Sprite, apple: Sprite, banana: Sprite, time: Variable, score: Variable}}
 *         The sprites and variables.
 */
const getSpritesAndVariables = function (t, request) {
    const rv = {};
    rv.stage = t.getStage();

    if (request.indexOf('bowl') !== -1) {
        rv.bowl = t.getSprites(s => s.isOriginal && isBowl(s))[0];
        t.assume.ok(typeof rv.bowl !== 'undefined', 'Could not find sprite bowl.');
    }

    if (request.indexOf('apple') !== -1) {
        rv.apple = t.getSprites(s => s.isOriginal && isApple(s))[0];
        t.assume.ok(typeof rv.apple !== 'undefined', 'Could not find sprite apple.');
    }

    if (request.indexOf('banana') !== -1) {
        rv.banana = t.getSprites(s => s.isOriginal && isBanana(s))[0];
        t.assume.ok(typeof rv.banana !== 'undefined', 'Could not find sprite banana.');
    }

    if (request.indexOf('time') !== -1) {
        rv.time = rv.stage.getVariables(isTime)[0];
        t.assume.ok(typeof rv.time !== 'undefined', 'Could not find variable time.');
    }

    if (request.indexOf('score') !== -1) {
        rv.score = rv.stage.getVariables(isScore)[0];
        t.assume.ok(typeof rv.score !== 'undefined', 'Could not find variable score.');
    }

    return rv;
};

/**
 * Returns the newest clone of the given sprite/clone, or the sprite/clone itself, if it is the newest clone or there
 * are no clones of the sprite.
 * @param {Sprite} sprite The sprite.
 * @return {Sprite} The newest clone of the given sprite.
 */
const getNewestClone = function (sprite) {
    const newClones = sprite.getNewClones();
    if (newClones.length) {
        /* There should not be more than one new clone after one execution step. */
        return newClones[0];
    }
    return sprite;
};

/**
 * Checks if a given sprite touches the bowl or the ground (red line).
 * @param {Sprite} sprite The sprite.
 * @param {Sprite} bowl The bowl.
 * @return {(string|boolean)} 'bowl', 'ground' or false, depending on if the sprite touches the bowl, ground or nothing.
 */
const spriteTouchingGround = function (sprite, bowl) {
    if (sprite.visible && sprite.exists) {
        if (sprite.isTouchingColor([255, 0, 0])) {
            return 'ground';
        } else if (sprite.isTouchingSprite(bowl.name)) {
            return 'bowl';
        }
    }
    return 'nothing';
};

/**
 * Asserts that the game is over by checking that no apple or banana moved and no variable changed in the last step.
 * @param {TestDriver} t The test driver.
 * @param {Sprite} apple And apple sprite from the game.
 * @param {Sprite} banana And apple sprite from the game.
 * @param {Variable} time The time variable from the game.
 * @param {Variable} score The score variable from the game.
 */
const assertGameOver = function (t, apple, banana, time, score) {
    for (const appleInstance of apple.getClones(true)) {
        t.assert.equal(appleInstance.x, appleInstance.old.x,
            'Apple must not move after game is over (should be over).');
    }
    for (const bananaInstance of banana.getClones(true)) {
        t.assert.equal(bananaInstance.x, bananaInstance.old.x,
            'Bananas must not move after game is over (should be over).');
    }
    t.assert.equal(time.value, time.old.value, 'Time must not change after game is over (should be over).');
    t.assert.equal(score.value, score.old.value, 'Score must not change after game is over (should be over).');
};

const test = async function (t) {
    let {bowl, apple, banana, time, score} = getSpritesAndVariables(t, ['bowl', 'apple', 'banana', 'time', 'score']);

    t.onConstraintFailure('nothing');

    /* Give the program some time to initialize. */
    await t.runForTime(500);

    // ==================== Information Tracking ===================================

    /* Track when which fruit touched which object (nothing, bowl, ground). */
    const appleTouched = [{
        object: spriteTouchingGround(apple, bowl),
        time: t.getTotalTimeElapsed(),
        score: score.value
    }];
    const bananaTouched = [{
        object: spriteTouchingGround(banana, bowl),
        time: t.getTotalTimeElapsed(),
        score: score.value
    }];
    t.onSpriteMoved(sprite => {
        const spriteIsApple = isApple(sprite);
        const spriteIsBanana = isBanana(sprite);
        if (spriteIsApple || spriteIsBanana) {
            const spriteTouched = spriteIsApple ? appleTouched : bananaTouched;
            const spriteTouching = spriteTouchingGround(sprite, bowl);
            if (spriteTouching !== spriteTouched[spriteTouched.length - 1].object) {
                spriteTouched.unshift({ // unshift instead of push so we can iterate backwards with a for-each loop
                    object: spriteTouchingGround(sprite, bowl),
                    time: t.getTotalTimeElapsed(),
                    score: score.value
                });
            }
        }
    });

    /* Track if apples / bananas fall at all. */
    let appleFellTimestamp = -1;
    let bananaFellTimestamp = -1;
    t.addCallback(() => {
        if (apple.y !== apple.old.y) {
            appleFellTimestamp = t.getTotalTimeElapsed();
        }
        if (banana.y !== banana.old.y) {
            bananaFellTimestamp = t.getTotalTimeElapsed();
        }
    });

    /* Track if the time ever changed. */
    let timeChanged = false;
    t.addCallback(() => {
        if (time.value !== time.old.value) {
            timeChanged = true;
        }
    });

    // ==================== Constraints ============================================

    const constraints = [];

    // -------------------- Initialization -----------------------------------------

    const fruitSize = t.addConstraint(() => {
        t.assert.equal(apple.size, 50, 'Apples must have a size of 50%');
        t.assert.equal(banana.size, 50, 'Bananas must have a size of 50%');
    }, 'Fruit Size Constraint');
    constraints.push(fruitSize);

    // -------------------- Bowl Movement ------------------------------------------

    const bowlMove = t.addConstraint(() => {
        if (t.getTotalTimeElapsed() <= 20000) {
            const leftDown = t.isKeyDown('Left');
            const rightDown = t.isKeyDown('Right');

            if (leftDown && !rightDown) {
                t.assert.less(bowl.x, bowl.old.x, 'Bowl must move left when left arrow key is pressed.');
            } else if (rightDown && !leftDown) {
                t.assert.greater(bowl.x, bowl.old.x, 'Bowl must move right when right arrow key is pressed.');
            } else if (!leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x, 'Bowl must not move when no arrow key is pressed.');
            }

            t.assert.equal(bowl.y, bowl.old.y, 'Bowl must never move vertically.');
        }
    }, 'Bowl Movement Constraint');
    constraints.push(bowlMove);

    const bowlMoveDetails = t.addConstraint(() => {
        if (t.getTotalTimeElapsed() <= 20000) {
            const leftDown = t.isKeyDown('Left');
            const rightDown = t.isKeyDown('Right');

            if (leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x - 10,
                    'Bowl must move left with a speed of 10 when left arrow key is pressed.');
            } else if (rightDown && !leftDown) {
                t.assert.equal(bowl.x, bowl.old.x + 10,
                    'Bowl must move right with a speed of 10 when right arrow key is pressed.');
            } else if (!leftDown && !rightDown) {
                t.assert.equal(bowl.x, bowl.old.x, 'Bowl must not move when no arrow key is pressed.');
            }

            t.assert.equal(bowl.y, bowl.old.y, 'Bowl must never move vertically.');
        }
    }, 'Bowl Movement Details Constraint');
    constraints.push(bowlMoveDetails);

    // -------------------- Fruit Falling ------------------------------------------

    const appleFallingDetails = t.addConstraint(() => {
        t.assert.ok(apple.y === apple.old.y ||
            apple.y - apple.old.y === -5 || // apple falling down
            apple.y - apple.old.y > 100, // apple teleported up after touching bowl / ground
        'Apple must fall down in steps of size 5.');
        if (apple.y < apple.old.y) {
            t.assert.equal(apple.x, apple.old.x, 'Apple must fall down in a straight line.');
        }
    }, 'Apple Falling Details');
    constraints.push(appleFallingDetails);

    const bananaFallingDetails = t.addConstraint(() => {
        t.assert.ok(banana.y === banana.old.y ||
            banana.y - banana.old.y === -7 || // banana falling down
            banana.y - banana.old.y > 100, // banana teleported up after touching bowl / ground
        'Banana must fall down in steps of size 7.');
        if (banana.y < banana.old.y) {
            t.assert.equal(banana.x, banana.old.x, 'Banana must fall down in a straight line.');
        }
    }, 'Banana Falling Details');
    constraints.push(bananaFallingDetails);

    // -------------------- Fruit Interaction ---------------------------------

    const applePoints = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'bowl' && timeElapsed - touched.time >= 100) {
                    if (timeElapsed - bananaTouched[0].time >= 200) {
                        t.assert.ok(Number(score.value) === Number(touched.score) + 5,
                            'Apples must give 5 points when they hit the bowl.');
                        break;
                    }
                }
            }
        }
    }, 'Apple Points Constraint');
    constraints.push(applePoints);

    const appleGameOver = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 2000) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 3000) {
                    assertGameOver(t, apple, banana, time, score);
                    break;
                }
            }
        }
    }, 'Apple Game Over Constraint');
    constraints.push(appleGameOver);

    const appleGameOverMessage = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of appleTouched) {
                if (timeElapsed - touched.time >= 600) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 500) {
                    t.assert.ok(apple.sayText, 'Apple must display a message if it hits the ground.');
                    t.assert.matches(apple.sayText.toLowerCase(), gameOverRegex,
                        'Apple must display \'Game over!\' when an it hits the ground.');
                }
            }
        }
    }, 'Apple Game Over Message Constraint');
    constraints.push(appleGameOverMessage);

    const bananaBowlPoints = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'bowl' && timeElapsed - touched.time >= 100) {
                    if (timeElapsed - appleTouched[0].time >= 200) {
                        t.assert.ok(Number(score.value) === Number(touched.score) + 8,
                            'Bananas must give 8 points when they hit the bowl.');
                        break;
                    }
                }
            }
        }
    }, 'Banana Bowl Points Constraint');
    constraints.push(bananaBowlPoints);

    const bananaGroundPoints = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 200) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 100) {
                    if (timeElapsed - appleTouched[0].time >= 200) {
                        t.assert.ok(Number(score.value) === Number(touched.score) - 8,
                            'Bananas must subtract 8 points when they hit the floor.');
                    }
                }
            }
        }
    }, 'Banana Ground Points Constraint');
    constraints.push(bananaGroundPoints);

    const bananaGroundMessage = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed <= 20000) {
            for (const touched of bananaTouched) {
                if (timeElapsed - touched.time >= 600) {
                    break;
                } else if (touched.object === 'ground' && timeElapsed - touched.time >= 500) {
                    t.assert.ok(banana.sayText, 'Banana must display a message when it hits the ground.');
                    t.assert.matches(banana.sayText, /-\s?8/, 'Banana must display \'-8\' when it hits the ground.');
                }
            }
        }
    }, 'Banana Ground Message Constraint');
    constraints.push(bananaGroundMessage);

    // -------------------- Timer --------------------------------------------------

    const timerTick = t.addConstraint(() => {
        t.assert.ok(time.value == time.old.value || time.value == time.old.value - 1, 'Time must only tick down.');
    }, 'Timer Tick Constraint');
    constraints.push(timerTick);

    const scoreNotChanging = t.addConstraint(() => {
        const timeElapsed = t.getRunTimeElapsed();
        if (timeElapsed - appleTouched[0].time >= 200 && timeElapsed - bananaTouched[0].time >= 200) {
            t.assert.equal(score.value, score.old.value,
                'Score must not change if no fruit touches the bowl or the ground.');
        }
    }, 'Score Not Changing Constraint');
    constraints.push(scoreNotChanging);

    // ==================== Test ===================================================

    t.setRandomInputInterval(150);
    t.registerRandomInputs([
        {
            device: 'keyboard',
            key: 'Left',
            duration: [50, 100]
        },
        {
            device: 'keyboard',
            key: 'Right',
            duration: [50, 100]
        }
    ]);

    /* Always use the newest apple and banana if clones are used. */
    t.addCallback(() => {
        apple = getNewestClone(apple);
        banana = getNewestClone(banana);
    });

    await t.runForTime(5000);

    // ==================== Filter Constraints =====================================

    if (appleFellTimestamp === -1) {
        appleFallingDetails.disable();
        appleFallingDetails.skip = 'Apple did not fall';
    }

    if (bananaFellTimestamp === -1) {
        bananaFallingDetails.disable();
        bananaFallingDetails.skip = 'Banana did not fall.';
    }

    let appleTouchedBowl = false;
    let appleTouchedGround = false;
    for (const touched of appleTouched) {
        if (touched.object === 'bowl') {
            appleTouchedBowl = true;
        } else if (touched.object === 'ground') {
            appleTouchedGround = true;
        }
    }
    if (appleFellTimestamp === -1 || !appleTouchedBowl) {
        applePoints.disable();
        applePoints.skip = 'Apple did not touch the bowl.';
    }
    if (appleFellTimestamp === -1 || !appleTouchedGround) {
        appleGameOver.disable();
        appleGameOver.skip = 'Apple did not touch the ground.';
        appleGameOverMessage.disable();
        appleGameOverMessage.skip = 'Apple did not touch the ground.';
    }

    let bananaTouchedBowl = false;
    let bananaTouchedGround = false;
    for (const touched of bananaTouched) {
        if (touched.object === 'bowl') {
            bananaTouchedBowl = true;
        } else if (touched.object === 'ground') {
            bananaTouchedGround = true;
        }
    }
    if (bananaFellTimestamp === -1 || !bananaTouchedBowl) {
        bananaBowlPoints.disable();
        bananaBowlPoints.skip = 'Banana did not touch the bowl.';
    }
    if (bananaFellTimestamp === -1 || !bananaTouchedGround) {
        bananaGroundPoints.disable();
        bananaGroundPoints.skip = 'Banana did not touch the ground.';
        bananaGroundMessage.disable();
        bananaGroundMessage.skip = 'Banana did not touch the ground.';
    }

    if (!timeChanged) {
        timerTick.disable();
        timerTick.skip = 'Timer did not tick at all.';
    }


    // ==================== Log the Constraints ====================================

    for (let i = 0; i < constraints.length; i++) {
        const constraint = constraints[i];

        let status;
        let message;

        if (constraint.isActive()) {
            status = 'pass';
        } else if (constraint.hasOwnProperty('skip')) {
            status = 'skip';
        } else {
            status = 'fail';
        }

        if (constraint.hasOwnProperty('skip')) {
            message = constraint.skip;
        } else if (constraint.error === null) {
            message = '';
        } else {
            message = constraint.error.message;
        }

        const log = {
            id: i + 1,
            name: constraint.name,
            status: status,
            message: message
        };

        t.log(log);
    }
};

module.exports = [
    {
        test: test,
        name: 'Test',
        description: 'Test a whole run with constraints.',
        categories: []
    }
];
