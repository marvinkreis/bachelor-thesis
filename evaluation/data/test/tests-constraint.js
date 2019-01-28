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
 * Follows a sprite with the bowl by simulating left and right arrow key presses.
 * Tries to move the bowl to the same x position as the sprite.
 * Works with "good" movement (i.e. "if key pressed" in a loop) and "bad" movement (i.e. "when key pressed" hats).
 * @param {TestDriver} t The test driver.
 * @param {number} bowlX The x coordinate of the bowl,
 * @param {number} spriteX The x coordinate of the sprite to follow.
 */
const followSprite = function (t, bowlX, spriteX) {
    /* Stop if the bowl is near enough. */
    if (Math.abs(bowlX - spriteX) <= 10) {
        if (t.isKeyDown('Left')) {
            t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        }
        if (t.isKeyDown('Right')) {
            t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        }

    } else if (bowlX > spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: true});

    } else if (bowlX < spriteX) {
        t.inputImmediate({device: 'keyboard', key: 'Left', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});

        /* Trick "when key pressed" hats to fire by letting go of the key and immediately pressing it again. */
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: false});
        t.inputImmediate({device: 'keyboard', key: 'Right', isDown: true});
    }
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

    /* Track the spawn position of fruits. */
    let oldApples = t.getSprites(sprite => sprite.visible && isApple(sprite) && sprite.y > 100);
    let oldBananas = t.getSprites(sprite => sprite.visible && isApple(sprite) && sprite.y > 100);
    const appleSpawnPositions = [];
    const bananaSpawnPositions = [];
    t.addCallback(() => {
        let apples = t.getSprites(sprite => isApple(sprite) && sprite.visible && sprite.y > 100);
        let bananas = t.getSprites(sprite => isBanana(sprite) && sprite.visible && sprite.y > 100);

        for (const _apple of [...apples]) {
            apples = apples.filter(s => s === _apple || (s.x !== _apple.x && s.y !== _apple.y));
        }
        for (const _banana of [...bananas]) {
            bananas = bananas.filter(s => s === _banana || (s.x !== _banana.x && s.y !== _banana.y));
        }

        for (const _apple of apples) {
            if (oldApples.indexOf(_apple) === -1) {
                appleSpawnPositions.push(_apple.pos);
            }
        }
        for (const _banana of bananas) {
            if (oldBananas.indexOf(_banana) === -1) {
                bananaSpawnPositions.push(_banana.pos);
            }
        }

        oldApples = apples;
        oldBananas = bananas;
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

    // -------------------- Fruit Spawn --------------------------------------

    const appleSpawnRandomXPosition = t.addConstraint(() => {
        if (appleSpawnPositions.length >= 3) {
            const firstAppleX = appleSpawnPositions[0].x;
            let positionsDiffer = false;

            for (const pos of appleSpawnPositions) {
                if (pos.x !== firstAppleX) {
                    positionsDiffer = true;
                }
            }

            t.assert.ok(positionsDiffer, 'Apples must spawn at random x positions.');
        }
    }, 'Apple Spawn Random X Position Constraint');
    constraints.push(appleSpawnRandomXPosition);

    const appleSpawnYPosition = t.addConstraint(() => {
        for (const applePos of appleSpawnPositions) {
            t.assert.ok(applePos.y === 170 || applePos.y === 165, 'Apples must spawn at y = 170.');
        }
    }, 'Apple Spawn Y Position Constraint');
    constraints.push(appleSpawnYPosition);

    const bananaSpawnRandomXPosition = t.addConstraint(() => {
        if (bananaSpawnPositions.length >= 3) {
            const firstBananaX = bananaSpawnPositions[0].x;
            let positionsDiffer = false;

            for (const pos of bananaSpawnPositions) {
                if (pos.x !== firstBananaX) {
                    positionsDiffer = true;
                }
            }

            t.assert.ok(positionsDiffer, 'Bananas must spawn at random x positions.');
        }
    }, 'Banana Spawn Random X Position Constraint');
    constraints.push(bananaSpawnRandomXPosition);

    const bananaSpawnYPosition = t.addConstraint(() => {
        for (const bananaPos of bananaSpawnPositions) {
            t.assert.ok(bananaPos.y === 170 || bananaPos.y === 163, 'Bananas must spawn at y = 170.');
        }
    }, 'Banana Spawn Y Position Constraint');
    constraints.push(bananaSpawnYPosition);

    const onlyOneApple = t.addConstraint(() => {
        const apples = t.getSprites(s => s.visible && isApple(s));
        if (apples.length > 2) {
            const fruitPos = apples[0].pos;
            for (let i = 1; i < apples.length; i++) {
                t.assert.ok(apples[i].x === fruitPos.x && apples[i].y === fruitPos.y,
                    'There can only be one apple on the screen at a time.');
            }
        }
    }, 'Only One Apple Constraint');
    constraints.push(onlyOneApple);

    const onlyOneBanana = t.addConstraint(() => {
        const bananas = t.getSprites(s => s.visible && isBanana(s));
        if (bananas.length > 2) {
            const fruitPos = bananas[0].pos;
            for (let i = 1; i < bananas.length; i++) {
                t.assert.ok(bananas[i].x === fruitPos.x && bananas[i].y === fruitPos.y,
                    'There can only be one banana on the screen at a time.');
            }
        }
    }, 'Only One Banana Constraint');
    constraints.push(onlyOneBanana);

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
                if (timeElapsed - touched.time >= 4000) {
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

    const timerGameOver = t.addConstraint(() => {
        const timeElapsed = t.getTotalTimeElapsed();
        if (timeElapsed >= 40000) {
            assertGameOver(t, apple, banana, time, score);
        } else if (timeElapsed >= 30000) {
            t.assert.ok(appleFellTimestamp >= 20000 || bananaFellTimestamp >= 20000,
                'The game must run for at least 20 seconds.');
        }
    }, 'Timer Game Over Constraint');
    constraints.push(timerGameOver);

    let bowlMessageTimestamp = -1;
    const timerGameOverMessage = t.addConstraint(() => {
        if (bowlMessageTimestamp === -1) {
            if (bowl.sayText) {
                bowlMessageTimestamp = t.getTotalTimeElapsed();
                t.assert.greaterOrEqual(bowlMessageTimestamp, 20000,
                    'Bowl must not display a message before 20 seconds.');
            } else {
                t.assert.lessOrEqual(t.getRunTimeElapsed(), 40000, 'Bowl must display a message after 30 seconds.');
            }
        } else {
            const timeElapsed = t.getTotalTimeElapsed();
            if (timeElapsed - bowlMessageTimestamp >= 500 && timeElapsed - bowlMessageTimestamp <= 600) {
                t.assert.ok(bowl.sayText, 'Bowl must display a message when the time is up.');
                t.assert.matches(bowl.sayText.toLowerCase(), gameOverRegex,
                    'Bowl must display \'Ende!\' when the time is up.');
            }
        }
    }, 'Timer Game Over Message Constraint');
    constraints.push(timerGameOverMessage);

    // ==================== Test ===================================================

    /* Catch apples with the bowl. Always use the newest apple and banana if clones are used. */
    t.addCallback(() => {
        followSprite(t, bowl.x, apple.x);
        apple = getNewestClone(apple);
        banana = getNewestClone(banana);
    });

    await t.runForTime(45000);

    // ==================== Filter Constraints =====================================

    if (appleFellTimestamp === -1) {
        appleFallingDetails.disable();
        appleFallingDetails.skip = 'Apple did not fall';
    }

    if (bananaFellTimestamp === -1) {
        bananaFallingDetails.disable();
        bananaFallingDetails.skip = 'Banana did not fall.';
    }

    if (appleSpawnPositions.length < 2) {
        appleSpawnRandomXPosition.disable();
        appleSpawnRandomXPosition.skip = 'Too few apples spawned.';
        appleSpawnYPosition.disable();
        appleSpawnYPosition.skip = 'Too few apples spawned.';
        onlyOneApple.disable();
        onlyOneApple.skip = 'Too few apples spawned.';
    }

    if (bananaSpawnPositions.length < 2) {
        bananaSpawnRandomXPosition.disable();
        bananaSpawnRandomXPosition.skip = 'Too few bananas spawned.';
        bananaSpawnYPosition.disable();
        bananaSpawnYPosition.skip = 'Too few bananas spawned.';
        onlyOneBanana.disable();
        onlyOneBanana.skip = 'Too few bananas spawned.';
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

/*
 * 01: fruitSize
 * 02: bowlMove
 * 03: bowlMoveDetails
 * 04: appleFallingDetails
 * 05: bananaFallingDetails
 * 06: appleSpawnYPosition
 * 07: appleSpawnRandomXPosition
 * 08: bananaSpawnYPosition
 * 09: bananaSpawnRandomXPosition
 * 10: onlyOneApple
 * 11: onlyOneBanana
 * 12: applePoints
 * 13: appleGameOver
 * 14: appleGameOverMessage
 * 15: bananaBowlPoints
 * 16: bananaGroundPoints
 * 17: bananaGroundMessage
 * 18: timerTick
 * 19: timerGameOver
 * 20: timerGameOverMessage
 */
