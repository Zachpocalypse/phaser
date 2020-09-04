/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Class = require('../../utils/Class');
var GetFastValue = require('../../utils/object/GetFastValue');
var Events = require('../../animations/events');

/**
 * @classdesc
 * The Game Object Animation Component.
 *
 * This component lives as an instance within any Game Object that has it defined, such as Sprites.
 *
 * You can access its properties and methods via `anims`, i.e. `Sprite.anims`.
 *
 * This component handles the loading of animations from the Animation Manager into the Game Object,
 * the playback of them and all related events.
 *
 * To create animations, please see the Animation Manager class instead.
 *
 * @class Animation
 * @memberof Phaser.GameObjects.Components
 * @constructor
 * @since 3.0.0
 *
 * @param {Phaser.GameObjects.GameObject} parent - The Game Object to which this animation component belongs.
 */
var Animation = new Class({

    initialize:

    function Animation (parent)
    {
        /**
         * The Game Object to which this animation component belongs.
         *
         * @name Phaser.GameObjects.Components.Animation#parent
         * @type {Phaser.GameObjects.GameObject}
         * @since 3.0.0
         */
        this.parent = parent;

        /**
         * A reference to the global Animation Manager.
         *
         * @name Phaser.GameObjects.Components.Animation#animationManager
         * @type {Phaser.Animations.AnimationManager}
         * @since 3.0.0
         */
        this.animationManager = parent.scene.sys.anims;

        this.animationManager.on(Events.REMOVE_ANIMATION, this.remove, this);

        /**
         * Is an animation currently playing or not?
         *
         * @name Phaser.GameObjects.Components.Animation#isPlaying
         * @type {boolean}
         * @default false
         * @since 3.0.0
         */
        this.isPlaying = false;

        /**
         * Has the current animation started playing, or is it waiting for a delay to expire?
         *
         * @name Phaser.GameObjects.Components.Animation#hasStarted
         * @type {boolean}
         * @default false
         * @since 3.50.0
         */
        this.hasStarted = false;

        /**
         * The current Animation loaded into this Animation component.
         *
         * Will by `null` if no animation is yet loaded.
         *
         * @name Phaser.GameObjects.Components.Animation#currentAnim
         * @type {?Phaser.Animations.Animation}
         * @default null
         * @since 3.0.0
         */
        this.currentAnim = null;

        /**
         * The current AnimationFrame being displayed by this Animation component.
         *
         * Will by `null` if no animation is yet loaded.
         *
         * @name Phaser.GameObjects.Components.Animation#currentFrame
         * @type {?Phaser.Animations.AnimationFrame}
         * @default null
         * @since 3.0.0
         */
        this.currentFrame = null;

        /**
         * The key, instance, or config of the next Animation to be loaded into this Animation component
         * when the current animation completes.
         *
         * Will by `null` if no animation has been queued.
         *
         * @name Phaser.GameObjects.Components.Animation#nextAnim
         * @type {?(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)}
         * @default null
         * @since 3.16.0
         */
        this.nextAnim = null;

        /**
         * A queue of Animations to be loaded into this Animation component when the current animation completes.
         *
         * Populate this queue via the `chain` method.
         *
         * @name Phaser.GameObjects.Components.Animation#nextAnimsQueue
         * @type {array}
         * @since 3.24.0
         */
        this.nextAnimsQueue = [];

        /**
         * The Time Scale factor.
         *
         * You can adjust this value to modify the passage of time for the animation that is currently
         * playing. For example, setting it to 2 will make the animation play twice as fast. Or setting
         * it to 0.5 will slow the animation down.
         *
         * You can change this value at run-time, or set it via the `PlayAnimationConfig`.
         *
         * Prior to Phaser 3.50 this property was private and called `_timeScale`.
         *
         * @name Phaser.GameObjects.Components.Animation#timeScale
         * @type {number}
         * @default 1
         * @since 3.50.0
         */
        this.timeScale = 1;

        /**
         * The frame rate of playback, of the current animation, in frames per second.
         *
         * This value is set when a new animation is loaded into this component and should
         * be treated as read-only, as changing it once playback has started will not alter
         * the animation. To change the frame rate, provide a new value in the `PlayAnimationConfig` object.
         *
         * @name Phaser.GameObjects.Components.Animation#frameRate
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.frameRate = 0;

        /**
         * The duration of the current animation, in milliseconds.
         *
         * This value is set when a new animation is loaded into this component and should
         * be treated as read-only, as changing it once playback has started will not alter
         * the animation. To change the duration, provide a new value in the `PlayAnimationConfig` object.
         *
         * @name Phaser.GameObjects.Components.Animation#duration
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.duration = 0;

        /**
         * The number of milliseconds per frame, not including frame specific modifiers that may be present in the
         * Animation data.
         *
         * This value is calculated when a new animation is loaded into this component and should
         * be treated as read-only. Changing it will not alter playback speed.
         *
         * @name Phaser.GameObjects.Components.Animation#msPerFrame
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.msPerFrame = 0;

        /**
         * Skip frames if the time lags, or always advanced anyway?
         *
         * @name Phaser.GameObjects.Components.Animation#skipMissedFrames
         * @type {boolean}
         * @default true
         * @since 3.0.0
         */
        this.skipMissedFrames = true;

        /**
         * The delay before starting playback of the current animation, in milliseconds.
         *
         * This value is set when a new animation is loaded into this component and should
         * be treated as read-only, as changing it once playback has started will not alter
         * the animation. To change the delay, provide a new value in the `PlayAnimationConfig` object.
         *
         * Prior to Phaser 3.50 this property was private and called `_delay`.
         *
         * @name Phaser.GameObjects.Components.Animation#delay
         * @type {number}
         * @default 0
         * @since 3.50.0
         */
        this.delay = 0;

        /**
         * The number of times to repeat playback of the current animation.
         *
         * If -1, it means the animation will repeat forever.
         *
         * This value is set when a new animation is loaded into this component and should
         * be treated as read-only, as changing it once playback has started will not alter
         * the animation. To change the number of repeats, provide a new value in the `PlayAnimationConfig` object.
         *
         * Prior to Phaser 3.50 this property was private and called `_repeat`.
         *
         * @name Phaser.GameObjects.Components.Animation#repeat
         * @type {number}
         * @default 0
         * @since 3.50.0
         */
        this.repeat = 0;

        /**
         * The number of milliseconds to wait before starting the repeat playback of the current animation.
         *
         * This value is set when a new animation is loaded into this component, but can also be modified
         * at run-time.
         *
         * You can change the repeat delay by providing a new value in the `PlayAnimationConfig` object.
         *
         * Prior to Phaser 3.50 this property was private and called `_repeatDelay`.
         *
         * @name Phaser.GameObjects.Components.Animation#repeatDelay
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.repeatDelay = 0;

        /**
         * Should the current animation yoyo? An animation that yoyos will play in reverse, from the end
         * to the start, before then repeating or completing. An animation that does not yoyo will just
         * play from the start to the end.
         *
         * This value is set when a new animation is loaded into this component, but can also be modified
         * at run-time.
         *
         * You can change the yoyo by providing a new value in the `PlayAnimationConfig` object.
         *
         * Prior to Phaser 3.50 this property was private and called `_yoyo`.
         *
         * @name Phaser.GameObjects.Components.Animation#yoyo
         * @type {boolean}
         * @default false
         * @since 3.50.0
         */
        this.yoyo = false;


        /**
         * Should the GameObject's `visible` property be set to `true` when the animation starts to play?
         *
         * This will happen _after_ any delay that may have been set.
         *
         * This value is set when a new animation is loaded into this component, but can also be modified
         * at run-time, assuming the animation is currently delayed.
         *
         * @name Phaser.GameObjects.Components.Animation#showOnStart
         * @type {boolean}
         * @since 3.50.0
         */
        this.showOnStart = false;

        /**
         * Should the GameObject's `visible` property be set to `false` when the animation completes?
         *
         * This value is set when a new animation is loaded into this component, but can also be modified
         * at run-time, assuming the animation is still actively playing.
         *
         * @name Phaser.GameObjects.Components.Animation#hideOnComplete
         * @type {boolean}
         * @since 3.50.0
         */
        this.hideOnComplete = false;

        /**
         * Is the playhead moving forwards (`true`) or in reverse (`false`) ?
         *
         * @name Phaser.GameObjects.Components.Animation#forward
         * @type {boolean}
         * @default true
         * @since 3.0.0
         */
        this.forward = true;

        /**
         * An internal trigger that tells the component if it should plays the animation
         * in reverse mode ('true') or not ('false'). This is used because `forward` can
         * be changed by the `yoyo` feature.
         *
         * Prior to Phaser 3.50 this property was private and called `_reverse`.
         *
         * @name Phaser.GameObjects.Components.Animation#inReverse
         * @type {boolean}
         * @default false
         * @since 3.50.0
         */
        this.inReverse = false;

        /**
         * Internal time overflow accumulator.
         *
         * This has the `delta` time added to it as part of the `update` step.
         *
         * @name Phaser.GameObjects.Components.Animation#accumulator
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.accumulator = 0;

        /**
         * The time point at which the next animation frame will change.
         *
         * This value is compared against the `accumulator` as part of the `update` step.
         *
         * @name Phaser.GameObjects.Components.Animation#nextTick
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.nextTick = 0;

        /**
         * A counter keeping track of how much delay time, in milliseconds, is left before playback begins.
         *
         * This is set via the `delayedPlay` method, although it can be modified at run-time
         * if required, as long as the animation has not already started playing.
         *
         * @name Phaser.GameObjects.Components.Animation#delayCounter
         * @type {number}
         * @default 0
         * @since 3.50.0
         */
        this.delayCounter = 0;

        /**
         * A counter that keeps track of how many repeats are left to run.
         *
         * This value is set when a new animation is loaded into this component, but can also be modified
         * at run-time.
         *
         * @name Phaser.GameObjects.Components.Animation#repeatCounter
         * @type {number}
         * @default 0
         * @since 3.0.0
         */
        this.repeatCounter = 0;

        /**
         * An internal flag keeping track of pending repeats.
         *
         * @name Phaser.GameObjects.Components.Animation#pendingRepeat
         * @type {boolean}
         * @default false
         * @since 3.0.0
         */
        this.pendingRepeat = false;

        /**
         * Is the Animation paused?
         *
         * @name Phaser.GameObjects.Components.Animation#_paused
         * @type {boolean}
         * @private
         * @default false
         * @since 3.0.0
         */
        this._paused = false;

        /**
         * Was the animation previously playing before being paused?
         *
         * @name Phaser.GameObjects.Components.Animation#_wasPlaying
         * @type {boolean}
         * @private
         * @default false
         * @since 3.0.0
         */
        this._wasPlaying = false;

        /**
         * Internal property tracking if this Animation is waiting to stop.
         *
         * 0 = No
         * 1 = Waiting for ms to pass
         * 2 = Waiting for repeat
         * 3 = Waiting for specific frame
         *
         * @name Phaser.GameObjects.Components.Animation#_pendingStop
         * @type {integer}
         * @private
         * @since 3.4.0
         */
        this._pendingStop = 0;

        /**
         * Internal property used by _pendingStop.
         *
         * @name Phaser.GameObjects.Components.Animation#_pendingStopValue
         * @type {any}
         * @private
         * @since 3.4.0
         */
        this._pendingStopValue;
    },

    /**
     * Sets an animation, or an array of animations, to be played immediately after the current one completes or stops.
     *
     * The current animation must enter a 'completed' state for this to happen, i.e. finish all of its repeats, delays, etc,
     * or have the `stop` method called directly on it.
     *
     * An animation set to repeat forever will never enter a completed state.
     *
     * You can chain a new animation at any point, including before the current one starts playing, during it, or when it ends (via its `animationcomplete` event).
     *
     * Chained animations are specific to a Game Object, meaning different Game Objects can have different chained animations without impacting the global animation they're playing.
     *
     * Call this method with no arguments to reset all currently chained animations.
     *
     * @method Phaser.GameObjects.Components.Animation#chain
     * @since 3.16.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig|string[]|Phaser.Animations.Animation[]|Phaser.Types.Animations.PlayAnimationConfig[])} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object, or an array of them.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    chain: function (key)
    {
        var parent = this.parent;

        if (key === undefined)
        {
            this.nextAnimsQueue.length = 0;
            this.nextAnim = null;

            return parent;
        }

        if (!Array.isArray(key))
        {
            key = [ key ];
        }

        for (var i = 0; i < key.length; i++)
        {
            var anim = key[i];

            if (this.nextAnim === null)
            {
                this.nextAnim = anim;
            }
            else
            {
                this.nextAnimsQueue.push(anim);
            }
        }

        return this.parent;
    },

    /**
     * Returns the key of the animation currently loaded into this component.
     *
     * Prior to Phaser 3.50 this method was called `getCurrentKey`.
     *
     * @method Phaser.GameObjects.Components.Animation#getName
     * @since 3.50.0
     *
     * @return {string} The key of the Animation currently loaded into this component, or an empty string if none loaded.
     */
    getName: function ()
    {
        return (this.currentAnim) ? this.currentAnim.key : '';
    },

    /**
     * Internal method used to load an animation into this component.
     *
     * @method Phaser.GameObjects.Components.Animation#load
     * @protected
     * @since 3.0.0
     *
     * @param {(string|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or a `PlayAnimationConfig` object.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    load: function (key)
    {
        if (this.isPlaying)
        {
            this.stop();
        }

        var manager = this.animationManager;
        var animKey = (typeof key === 'string') ? key : GetFastValue(key, 'key', null);

        //  Get the animation from the Animation Manager
        var anim = manager.get(animKey);

        if (!anim)
        {
            console.warn('Missing animation: ' + animKey);
        }
        else
        {
            this.currentAnim = anim;

            //  And now override the animation values, if set in the config.

            var totalFrames = anim.getTotalFrames();
            var frameRate = GetFastValue(key, 'frameRate', anim.frameRate);
            var duration = GetFastValue(key, 'duration', anim.duration);

            anim.calculateDuration(this, totalFrames, duration, frameRate);

            this.delay = GetFastValue(key, 'delay', anim.delay);
            this.repeat = GetFastValue(key, 'repeat', anim.repeat);
            this.repeatDelay = GetFastValue(key, 'repeatDelay', anim.repeatDelay);
            this.yoyo = GetFastValue(key, 'yoyo', anim.yoyo);
            this.showOnStart = GetFastValue(key, 'showOnStart', anim.showOnStart);
            this.hideOnComplete = GetFastValue(key, 'hideOnComplete', anim.hideOnComplete);
            this.skipMissedFrames = GetFastValue(key, 'skipMissedFrames', anim.skipMissedFrames);

            this.timeScale = GetFastValue(key, 'timeScale', this.timeScale);

            var startFrame = GetFastValue(key, 'startFrame', 0);

            if (startFrame > anim.getTotalFrames())
            {
                startFrame = 0;
            }

            var frame = anim.frames[startFrame];

            if (startFrame === 0 && !this.forward)
            {
                frame = this.getLastFrame();
            }

            this.currentFrame = frame;
        }

        return this.parent;
    },

    /**
     * Pause the current animation and set the `isPlaying` property to `false`.
     * You can optionally pause it at a specific frame.
     *
     * @method Phaser.GameObjects.Components.Animation#pause
     * @since 3.0.0
     *
     * @param {Phaser.Animations.AnimationFrame} [atFrame] - An optional frame to set after pausing the animation.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    pause: function (atFrame)
    {
        if (!this._paused)
        {
            this._paused = true;
            this._wasPlaying = this.isPlaying;
            this.isPlaying = false;
        }

        if (atFrame !== undefined)
        {
            this.updateFrame(atFrame);
        }

        return this.parent;
    },

    /**
     * Resumes playback of a paused animation and sets the `isPlaying` property to `true`.
     * You can optionally tell it to start playback from a specific frame.
     *
     * @method Phaser.GameObjects.Components.Animation#resume
     * @since 3.0.0
     *
     * @param {Phaser.Animations.AnimationFrame} [fromFrame] - An optional frame to set before restarting playback.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    resume: function (fromFrame)
    {
        if (this._paused)
        {
            this._paused = false;
            this.isPlaying = this._wasPlaying;
        }

        if (fromFrame !== undefined)
        {
            this.updateFrame(fromFrame);
        }

        return this.parent;
    },

    /**
     * Waits for the specified delay, in milliseconds, then starts playback of the given animation.
     *
     * If the animation _also_ has a delay value set in its config, it will be **added** to the delay given here.
     *
     * If an animation is already running and a new animation is given to this method, it will wait for
     * the given delay before starting the new animation.
     *
     * If no animation is currently running, the given one begins after the delay.
     *
     * Prior to Phaser 3.50 this method was called 'delayedPlay'.
     *
     * @method Phaser.GameObjects.Components.Animation#playAfterDelay
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.50.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {integer} delay - The delay, in milliseconds, to wait before starting the animation playing.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    playAfterDelay: function (key, delay)
    {
        if (!this.isPlaying)
        {
            this.delayCounter = delay;

            this.play(key, true);
        }
        else
        {
            //  If we've got a nextAnim, move it to the queue
            var nextAnim = this.nextAnim;
            var queue = this.nextAnimsQueue;

            if (nextAnim)
            {
                queue.unshift(nextAnim);
            }

            this.nextAnim = key;

            this._pendingStop = 1;
            this._pendingStopValue = delay;
        }

        return this.parent;
    },

    /**
     * Waits for the current animation to complete one 'repeat' cycle, then starts playback of the given animation.
     *
     * You can use this to ensure there are no harsh 'jumps' between two sets of animations, i.e. going from an
     * idle animation to a walking animation.
     *
     * If no animation is currently running, the given one will start immediately.
     *
     * @method Phaser.GameObjects.Components.Animation#playAfterRepeat
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.50.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {integer} [repeatCount=1] - How many times should the animation repeat before the next one starts?
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    playAfterRepeat: function (key, repeatCount)
    {
        if (repeatCount === undefined) { repeatCount = 1; }

        if (!this.isPlaying)
        {
            this.play(key);
        }
        else
        {
            //  If we've got a nextAnim, move it to the queue
            var nextAnim = this.nextAnim;
            var queue = this.nextAnimsQueue;

            if (nextAnim)
            {
                queue.unshift(nextAnim);
            }

            if (this.repeatCounter !== -1 && repeatCount > this.repeatCounter)
            {
                repeatCount = this.repeatCounter;
            }

            this.nextAnim = key;

            this._pendingStop = 2;
            this._pendingStopValue = repeatCount;
        }

        return this.parent;
    },

    /**
     * Plays an Animation on a Game Object that has the Animation component, such as a Sprite.
     *
     * Animations are stored in the global Animation Manager and are referenced by a unique string-based key.
     *
     * @method Phaser.GameObjects.Components.Animation#play
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.0.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {boolean} [ignoreIfPlaying=false] - If this animation is already playing then ignore this call.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    play: function (key, ignoreIfPlaying)
    {
        if (ignoreIfPlaying === undefined) { ignoreIfPlaying = false; }

        //  Must be either an Animation instance, or a PlayAnimationConfig object
        var animKey = (typeof key === 'string') ? key : key.key;

        if (ignoreIfPlaying && this.isPlaying && this.currentAnim.key === animKey)
        {
            return this.parent;
        }

        this.forward = true;
        this.inReverse = false;

        this._paused = false;
        this._wasPlaying = true;

        return this.startAnimation(key);
    },

    /**
     * Plays an Animation in reverse on the Game Object that owns this Animation Component.
     *
     * @method Phaser.GameObjects.Components.Animation#playReverse
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.12.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {boolean} [ignoreIfPlaying=false] - If an animation is already playing then ignore this call.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    playReverse: function (key, ignoreIfPlaying)
    {
        if (ignoreIfPlaying === undefined) { ignoreIfPlaying = false; }

        //  Must be either an Animation instance, or a PlayAnimationConfig object
        var animKey = (typeof key === 'string') ? key : key.key;

        if (ignoreIfPlaying && this.isPlaying && this.currentAnim.key === animKey)
        {
            return this.parent;
        }

        this.forward = false;
        this.inReverse = true;

        this._paused = false;
        this._wasPlaying = true;

        return this.startAnimation(key);
    },

    /**
     * Load the animation based on the key and set-up all of the internal values
     * needed for playback to start. If there is no delay, it will also fire the start events.
     *
     * @method Phaser.GameObjects.Components.Animation#startAnimation
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.50.0
     *
     * @param {(string|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or a `PlayAnimationConfig` object.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    startAnimation: function (key)
    {
        this.load(key);

        var anim = this.currentAnim;
        var gameObject = this.parent;

        if (!anim)
        {
            return gameObject;
        }

        //  Should give us 9,007,199,254,740,991 safe repeats
        this.repeatCounter = (this.repeat === -1) ? Number.MAX_VALUE : this.repeat;

        anim.getFirstTick(this);

        this.isPlaying = true;
        this.pendingRepeat = false;
        this.hasStarted = false;

        this._pendingStop = 0;
        this._pendingStopValue = 0;
        this._paused = false;

        //  Add any delay the animation itself may have had as well
        this.delayCounter += this.delay;

        if (this.delayCounter === 0)
        {
            this.handleStart();
        }

        return gameObject;
    },

    /**
     * Handles the start of an animation playback.
     *
     * @method Phaser.GameObjects.Components.Animation#handleStart
     * @private
     * @since 3.50.0
     */
    handleStart: function ()
    {
        if (this.showOnStart)
        {
            this.parent.setVisible(true);
        }

        this.updateFrame(this.currentFrame);

        this.hasStarted = true;

        this.emitEvents(Events.ANIMATION_START, Events.SPRITE_ANIMATION_KEY_START, Events.SPRITE_ANIMATION_START);
    },

    /**
     * Handles the repeat of an animation.
     *
     * @method Phaser.GameObjects.Components.Animation#handleRepeat
     * @private
     * @since 3.50.0
     */
    handleRepeat: function ()
    {
        this.pendingRepeat = false;

        this.emitEvents(Events.ANIMATION_REPEAT, Events.SPRITE_ANIMATION_KEY_REPEAT, Events.SPRITE_ANIMATION_REPEAT);
    },

    /**
     * Handles the stop of an animation playback.
     *
     * @method Phaser.GameObjects.Components.Animation#handleStop
     * @private
     * @since 3.50.0
     */
    handleStop: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        this.emitEvents(Events.ANIMATION_STOP, Events.SPRITE_ANIMATION_KEY_STOP, Events.SPRITE_ANIMATION_STOP);
    },

    /**
     * Handles the completion of an animation playback.
     *
     * @method Phaser.GameObjects.Components.Animation#handleComplete
     * @private
     * @since 3.50.0
     */
    handleComplete: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        if (this.hideOnComplete)
        {
            this.parent.setVisible(false);
        }

        this.emitEvents(Events.ANIMATION_COMPLETE, Events.SPRITE_ANIMATION_KEY_COMPLETE, Events.SPRITE_ANIMATION_COMPLETE);
    },

    /**
     * Fires the given animation events.
     *
     * @method Phaser.GameObjects.Components.Animation#emitEvents
     * @private
     * @since 3.50.0
     *
     * @param {string} animEvent - The Animation Event to dispatch.
     * @param {string} spriteKeyEvent - The Sprite Key Event to dispatch.
     * @param {string} spriteEvent - The Sprite Event to dispatch.
     */
    emitEvents: function (animEvent, spriteKeyEvent, spriteEvent)
    {
        var anim = this.currentAnim;
        var frame = this.currentFrame;
        var gameObject = this.parent;

        anim.emit(animEvent, anim, frame, gameObject);

        gameObject.emit(spriteKeyEvent + anim.key, anim, frame, gameObject);
        gameObject.emit(spriteEvent, anim, frame, gameObject);
    },

    /**
     * Reverse the Animation that is already playing on the Game Object.
     *
     * @method Phaser.GameObjects.Components.Animation#reverse
     * @since 3.12.0
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    reverse: function ()
    {
        if (this.isPlaying)
        {
            this.inReverse = !this.inReverse;

            this.forward = !this.forward;
        }

        return this.parent;
    },

    /**
     * Returns a value between 0 and 1 indicating how far this animation is through, ignoring repeats and yoyos.
     *
     * The value is based on the current frame and how far that is in the animation, it is not based on
     * the duration of the animation.
     *
     * @method Phaser.GameObjects.Components.Animation#getProgress
     * @since 3.4.0
     *
     * @return {number} The progress of the current animation in frames, between 0 and 1.
     */
    getProgress: function ()
    {
        var frame = this.currentFrame;

        if (!frame)
        {
            return 0;
        }

        var p = frame.progress;

        if (this.inReverse)
        {
            p *= -1;
        }

        return p;
    },

    /**
     * Takes a value between 0 and 1 and uses it to set how far this animation is through playback.
     *
     * Does not factor in repeats or yoyos, but does handle playing forwards or backwards.
     *
     * The value is based on the current frame and how far that is in the animation, it is not based on
     * the duration of the animation.
     *
     * @method Phaser.GameObjects.Components.Animation#setProgress
     * @since 3.4.0
     *
     * @param {number} [value=0] - The progress value, between 0 and 1.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    setProgress: function (value)
    {
        if (!this.forward)
        {
            value = 1 - value;
        }

        this.setCurrentFrame(this.currentAnim.getFrameByProgress(value));

        return this.parent;
    },

    /**
     * Sets the number of times that the animation should repeat after its first play through.
     * For example, if repeat is 1, the animation will play a total of twice: the initial play plus 1 repeat.
     *
     * To repeat indefinitely, use -1.
     * The value should always be an integer.
     *
     * Calling this method only works if the animation is already running. Otherwise, any
     * value specified here will be overwritten when the next animation loads in. To avoid this,
     * use the `repeat` property of the `PlayAnimationConfig` object instead.
     *
     * @method Phaser.GameObjects.Components.Animation#setRepeat
     * @since 3.4.0
     *
     * @param {integer} value - The number of times that the animation should repeat.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    setRepeat: function (value)
    {
        this.repeatCounter = (value === -1) ? Number.MAX_VALUE : value;

        return this.parent;
    },

    /**
     * Handle the removal of an animation from the Animation Manager.
     *
     * @method Phaser.GameObjects.Components.Animation#remove
     * @since 3.0.0
     *
     * @param {string} [key] - The key of the removed Animation.
     * @param {Phaser.Animations.Animation} [animation] - The removed Animation.
     */
    remove: function (key, animation)
    {
        if (animation === undefined) { animation = this.currentAnim; }

        if (this.isPlaying && animation.key === this.currentAnim.key)
        {
            this.stop();

            this.setCurrentFrame(this.currentAnim.frames[0]);
        }
    },

    /**
     * Restarts the current animation from its beginning.
     *
     * You can optionally reset the delay and repeat counters as well.
     *
     * Calling this will fire the `ANIMATION_RESTART` series of events immediately.
     *
     * If you `includeDelay` then it will also fire the `ANIMATION_START` series of events once
     * the delay has expired, otherwise, playback will just begin immediately.
     *
     * @method Phaser.GameObjects.Components.Animation#restart
     * @fires Phaser.Animations.Events#ANIMATION_RESTART
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_RESTART
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_RESTART
     * @since 3.0.0
     *
     * @param {boolean} [includeDelay=false] - Whether to include the delay value of the animation when restarting.
     * @param {boolean} [resetRepeats=false] - Whether to reset the repeat counter or not?
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    restart: function (includeDelay, resetRepeats)
    {
        if (includeDelay === undefined) { includeDelay = false; }
        if (resetRepeats === undefined) { resetRepeats = false; }

        var anim = this.currentAnim;
        var gameObject = this.parent;

        if (!anim)
        {
            return gameObject;
        }

        if (resetRepeats)
        {
            this.repeatCounter = (this.repeat === -1) ? Number.MAX_VALUE : this.repeat;
        }

        anim.getFirstTick(this);

        this.emitEvents(Events.ANIMATION_RESTART, Events.SPRITE_ANIMATION_KEY_RESTART, Events.SPRITE_ANIMATION_RESTART);

        this.isPlaying = true;
        this.pendingRepeat = false;

        //  Set this to `true` if there is no delay to include, so it skips the `hasStarted` check in `update`.
        this.hasStarted = !includeDelay;

        this._pendingStop = 0;
        this._pendingStopValue = 0;
        this._paused = false;

        //  Set frame
        this.updateFrame(anim.frames[0]);

        return this.parent;
    },

    /**
     * The current animation has completed. This dispatches the `ANIMATION_COMPLETE` series of events.
     *
     * This method is called by the Animation instance and should not usually be invoked directly.
     *
     * If no animation is loaded, no events will be dispatched.
     *
     * If another animation has been queued for playback, it will be started after the events fire.
     *
     * @method Phaser.GameObjects.Components.Animation#complete
     * @fires Phaser.Animations.Events#ANIMATION_COMPLETE
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_COMPLETE
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_COMPLETE
     * @since 3.50.0
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    complete: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        if (this.currentAnim)
        {
            this.handleComplete();
        }

        if (this.nextAnim)
        {
            var key = this.nextAnim;

            this.nextAnim = (this.nextAnimsQueue.length > 0) ? this.nextAnimsQueue.shift() : null;

            this.play(key);
        }

        return this.parent;
    },

    /**
     * Immediately stops the current animation from playing and dispatches the `ANIMATION_STOP` series of events.
     *
     * If no animation is running, no events will be dispatched.
     *
     * If there is another animation in the queue (set via the `chain` method) then it will start playing.
     *
     * @method Phaser.GameObjects.Components.Animation#stop
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @since 3.0.0
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    stop: function ()
    {
        this._pendingStop = 0;

        this.isPlaying = false;

        if (this.currentAnim)
        {
            this.handleStop();
        }

        if (this.nextAnim)
        {
            var key = this.nextAnim;

            this.nextAnim = this.nextAnimsQueue.shift();

            this.play(key);
        }

        return this.parent;
    },

    /**
     * Stops the current animation from playing after the specified time delay, given in milliseconds.
     *
     * It then dispatches the `ANIMATION_STOP` series of events.
     *
     * If no animation is running, no events will be dispatched.
     *
     * If there is another animation in the queue (set via the `chain` method) then it will start playing,
     * when the current one stops.
     *
     * @method Phaser.GameObjects.Components.Animation#stopAfterDelay
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @since 3.4.0
     *
     * @param {integer} delay - The number of milliseconds to wait before stopping this animation.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    stopAfterDelay: function (delay)
    {
        this._pendingStop = 1;
        this._pendingStopValue = delay;

        return this.parent;
    },

    /**
     * Stops the current animation from playing when it next repeats.
     *
     * It then dispatches the `ANIMATION_STOP` series of events.
     *
     * If no animation is running, no events will be dispatched.
     *
     * If there is another animation in the queue (set via the `chain` method) then it will start playing,
     * when the current one stops.
     *
     * Prior to Phaser 3.50 this method was called `stopOnRepeat` and had no parameters.
     *
     * @method Phaser.GameObjects.Components.Animation#stopAfterRepeat
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @since 3.50.0
     *
     * @param {integer} [repeatCount=1] - How many times should the animation repeat before stopping?
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    stopAfterRepeat: function (repeatCount)
    {
        if (repeatCount === undefined) { repeatCount = 1; }

        if (this.repeatCounter !== -1 && repeatCount > this.repeatCounter)
        {
            repeatCount = this.repeatCounter;
        }

        this._pendingStop = 2;
        this._pendingStopValue = repeatCount;

        return this.parent;
    },

    /**
     * Stops the current animation from playing when it next sets the given frame.
     * If this frame doesn't exist within the animation it will not stop it from playing.
     *
     * It then dispatches the `ANIMATION_STOP` series of events.
     *
     * If no animation is running, no events will be dispatched.
     *
     * If there is another animation in the queue (set via the `chain` method) then it will start playing,
     * when the current one stops.
     *
     * @method Phaser.GameObjects.Components.Animation#stopOnFrame
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @since 3.4.0
     *
     * @param {Phaser.Animations.AnimationFrame} frame - The frame to check before stopping this animation.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object that owns this Animation Component.
     */
    stopOnFrame: function (frame)
    {
        this._pendingStop = 3;
        this._pendingStopValue = frame;

        return this.parent;
    },

    /**
     * Returns the total number of frames in this animation, or returns zero if no
     * animation has been loaded.
     *
     * @method Phaser.GameObjects.Components.Animation#getTotalFrames
     * @since 3.4.0
     *
     * @return {integer} The total number of frames in the current animation, or zero if no animation has been loaded.
     */
    getTotalFrames: function ()
    {
        return (this.currentAnim) ? this.currentAnim.getTotalFrames() : 0;
    },

    /**
     * The internal update loop for the Animation Component.
     *
     * This is called automatically by the `Sprite.preUpdate` method.
     *
     * @method Phaser.GameObjects.Components.Animation#update
     * @since 3.0.0
     *
     * @param {number} time - The current timestamp.
     * @param {number} delta - The delta time, in ms, elapsed since the last frame.
     */
    update: function (time, delta)
    {
        var anim = this.currentAnim;

        if (!this.isPlaying || !anim || anim.paused)
        {
            return;
        }

        this.accumulator += delta * this.timeScale;

        if (this._pendingStop === 1)
        {
            this._pendingStopValue -= delta;

            if (this._pendingStopValue <= 0)
            {
                return this.stop();
            }
        }

        if (!this.hasStarted)
        {
            if (this.accumulator >= this.delayCounter)
            {
                this.accumulator -= this.delayCounter;

                this.handleStart();
            }
        }
        else if (this.accumulator >= this.nextTick)
        {
            if (this.forward)
            {
                anim.nextFrame(this);
            }
            else
            {
                anim.previousFrame(this);
            }
        }
    },

    /**
     * Sets the given Animation Frame as being the current frame
     * and applies it to the parent Game Object, adjusting size and origin as needed.
     *
     * @method Phaser.GameObjects.Components.Animation#setCurrentFrame
     * @since 3.4.0
     *
     * @param {Phaser.Animations.AnimationFrame} animationFrame - The Animation Frame to set as being current.
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object this Animation Component belongs to.
     */
    setCurrentFrame: function (animationFrame)
    {
        var gameObject = this.parent;

        this.currentFrame = animationFrame;

        gameObject.texture = animationFrame.frame.texture;
        gameObject.frame = animationFrame.frame;

        if (gameObject.isCropped)
        {
            gameObject.frame.updateCropUVs(gameObject._crop, gameObject.flipX, gameObject.flipY);
        }

        gameObject.setSizeToFrame();

        if (gameObject._originComponent)
        {
            if (animationFrame.frame.customPivot)
            {
                gameObject.setOrigin(animationFrame.frame.pivotX, animationFrame.frame.pivotY);
            }
            else
            {
                gameObject.updateDisplayOrigin();
            }
        }

        return gameObject;
    },

    /**
     * Internal frame change handler.
     *
     * @method Phaser.GameObjects.Components.Animation#updateFrame
     * @fires Phaser.Animations.Events#ANIMATION_UPDATE
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_UPDATE
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_UPDATE
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @private
     * @since 3.0.0
     *
     * @param {Phaser.Animations.AnimationFrame} animationFrame - The animation frame to change to.
     */
    updateFrame: function (animationFrame)
    {
        var gameObject = this.setCurrentFrame(animationFrame);

        if (this.isPlaying)
        {
            if (animationFrame.setAlpha)
            {
                gameObject.alpha = animationFrame.alpha;
            }

            this.emitEvents(Events.ANIMATION_UPDATE, Events.SPRITE_ANIMATION_KEY_UPDATE, Events.SPRITE_ANIMATION_UPDATE);

            if (this._pendingStop === 3 && this._pendingStopValue === animationFrame)
            {
                this.stop();
            }
        }
    },

    /**
     * Advances the animation to the next frame, regardless of the time or animation state.
     * If the animation is set to repeat, or yoyo, this will still take effect.
     *
     * Calling this does not change the direction of the animation. I.e. if it was currently
     * playing in reverse, calling this method doesn't then change the direction to forwards.
     *
     * @method Phaser.GameObjects.Components.Animation#nextFrame
     * @since 3.16.0
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object this Animation Component belongs to.
     */
    nextFrame: function ()
    {
        if (this.currentAnim)
        {
            this.currentAnim.nextFrame(this);
        }

        return this.parent;
    },

    /**
     * Advances the animation to the previous frame, regardless of the time or animation state.
     * If the animation is set to repeat, or yoyo, this will still take effect.
     *
     * Calling this does not change the direction of the animation. I.e. if it was currently
     * playing in forwards, calling this method doesn't then change the direction to backwards.
     *
     * @method Phaser.GameObjects.Components.Animation#previousFrame
     * @since 3.16.0
     *
     * @return {Phaser.GameObjects.GameObject} The Game Object this Animation Component belongs to.
     */
    previousFrame: function ()
    {
        if (this.currentAnim)
        {
            this.currentAnim.previousFrame(this);
        }

        return this.parent;
    },

    /**
     * Destroy this Animation component.
     *
     * Unregisters event listeners and cleans up its references.
     *
     * @method Phaser.GameObjects.Components.Animation#destroy
     * @since 3.0.0
     */
    destroy: function ()
    {
        this.animationManager.off(Events.REMOVE_ANIMATION, this.remove, this);

        this.animationManager = null;
        this.parent = null;
        this.nextAnim = null;
        this.nextAnimsQueue.length = 0;

        this.currentAnim = null;
        this.currentFrame = null;
    },

    /**
     * `true` if the current animation is paused, otherwise `false`.
     *
     * @name Phaser.GameObjects.Components.Animation#isPaused
     * @readonly
     * @type {boolean}
     * @since 3.4.0
     */
    isPaused: {

        get: function ()
        {
            return this._paused;
        }

    }

});

module.exports = Animation;
