/**
 * @author       Richard Davey <rich@photonstorm.com>
 * @copyright    2020 Photon Storm Ltd.
 * @license      {@link https://opensource.org/licenses/MIT|MIT License}
 */

var Class = require('../../utils/Class');
var Components = require('../components');
var GameObject = require('../GameObject');
var GameObjectEvents = require('../events');
var SpriteRender = require('./SpriteRender');

/**
 * @classdesc
 * A Sprite Game Object.
 *
 * A Sprite Game Object is used for the display of both static and animated images in your game.
 * Sprites can have input events and physics bodies. They can also be tweened, tinted, scrolled
 * and animated.
 *
 * The main difference between a Sprite and an Image Game Object is that you cannot animate Images.
 * As such, Sprites take a fraction longer to process and have a larger API footprint due to the Animation
 * Component. If you do not require animation then you can safely use Images to replace Sprites in all cases.
 *
 * @class Sprite
 * @extends Phaser.GameObjects.GameObject
 * @memberof Phaser.GameObjects
 * @constructor
 * @since 3.0.0
 *
 * @extends Phaser.GameObjects.Components.Alpha
 * @extends Phaser.GameObjects.Components.BlendMode
 * @extends Phaser.GameObjects.Components.Depth
 * @extends Phaser.GameObjects.Components.Flip
 * @extends Phaser.GameObjects.Components.GetBounds
 * @extends Phaser.GameObjects.Components.Mask
 * @extends Phaser.GameObjects.Components.Origin
 * @extends Phaser.GameObjects.Components.Pipeline
 * @extends Phaser.GameObjects.Components.ScrollFactor
 * @extends Phaser.GameObjects.Components.Size
 * @extends Phaser.GameObjects.Components.TextureCrop
 * @extends Phaser.GameObjects.Components.Tint
 * @extends Phaser.GameObjects.Components.Transform
 * @extends Phaser.GameObjects.Components.Visible
 *
 * @param {Phaser.Scene} scene - The Scene to which this Game Object belongs. A Game Object can only belong to one Scene at a time.
 * @param {number} x - The horizontal position of this Game Object in the world.
 * @param {number} y - The vertical position of this Game Object in the world.
 * @param {(string|Phaser.Textures.Texture)} texture - The key, or instance of the Texture this Game Object will use to render with, as stored in the Texture Manager.
 * @param {(string|integer)} [frame] - An optional frame from the Texture this Game Object is rendering with.
 */
var Sprite = new Class({

    Extends: GameObject,

    Mixins: [
        Components.Alpha,
        Components.BlendMode,
        Components.Depth,
        Components.Flip,
        Components.GetBounds,
        Components.Mask,
        Components.Origin,
        Components.Pipeline,
        Components.ScrollFactor,
        Components.Size,
        Components.TextureCrop,
        Components.Tint,
        Components.Transform,
        Components.Visible,
        SpriteRender
    ],

    initialize:

    function Sprite (scene, x, y, texture, frame)
    {
        GameObject.call(this, scene, 'Sprite');

        /**
         * The internal crop data object, as used by `setCrop` and passed to the `Frame.setCropUVs` method.
         *
         * @name Phaser.GameObjects.Sprite#_crop
         * @type {object}
         * @private
         * @since 3.11.0
         */
        this._crop = this.resetCropObject();

        /**
         * The Animation Controller of this Sprite.
         *
         * @name Phaser.GameObjects.Sprite#anims
         * @type {Phaser.GameObjects.Components.Animation}
         * @since 3.0.0
         */
        this.anims = new Components.Animation(this);

        this.setTexture(texture, frame);
        this.setPosition(x, y);
        this.setSizeToFrame();
        this.setOriginFromFrame();
        this.initPipeline();

        this.on(GameObjectEvents.ADDED_TO_SCENE, this.addedToScene, this);
        this.on(GameObjectEvents.REMOVED_FROM_SCENE, this.removedFromScene, this);
    },

    //  Overrides Game Object method
    addedToScene: function ()
    {
        this.scene.sys.updateList.add(this);
    },

    //  Overrides Game Object method
    removedFromScene: function ()
    {
        this.scene.sys.updateList.remove(this);
    },

    /**
     * Update this Sprite's animations.
     *
     * @method Phaser.GameObjects.Sprite#preUpdate
     * @protected
     * @since 3.0.0
     *
     * @param {number} time - The current timestamp.
     * @param {number} delta - The delta time, in ms, elapsed since the last frame.
     */
    preUpdate: function (time, delta)
    {
        this.anims.update(time, delta);
    },

    /**
     * Start playing the given animation on this Sprite.
     *
     * Animations in Phaser belong to the global Animation Manager. This means multiple Sprites can all play the same
     * animation. The following code shows how to create a global repeating animation. The animation will be created
     * from all of the frames within the sprite sheet that was loaded with the key 'muybridge':
     *
     * ```javascript
     * var config = {
     *     key: 'run',
     *     frames: 'muybridge',
     *     frameRate: 15,
     *     repeat: -1
     * };
     *
     * this.anims.create(config);
     * ```
     *
     * With the animation created, you can now play it on this Sprite:
     *
     * ```javascript
     * this.add.sprite(x, y).play('run');
     * ```
     *
     * Alternatively, if you wish to run it at a different frame rate, for example, you can pass a config
     * object instead:
     *
     * ```javascript
     * this.add.sprite(x, y).play({ key: 'run', frameRate: 24 });
     * ```
     *
     * See the documentation for the `PlayAnimationConfig` config object for more details about this.
     *
     * Also, see the documentation in the Animation Manager for further details on creating animations.
     *
     * @method Phaser.GameObjects.Sprite#play
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.0.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {boolean} [ignoreIfPlaying=false] - If an animation is already playing then ignore this call.
     * @param {integer} [startFrame=0] - Optionally start the animation playing from this frame index.
     *
     * @return {this} This Game Object.
     */
    play: function (key, ignoreIfPlaying, startFrame)
    {
        return this.anims.play(key, ignoreIfPlaying, startFrame);
    },

    /**
     * Start playing the given animation on this Sprite in reverse.
     *
     * Animations in Phaser belong to the global Animation Manager. This means multiple Sprites can all play the same
     * animation. The following code shows how to create a global repeating animation. The animation will be created
     * from all of the frames within the sprite sheet that was loaded with the key 'muybridge':
     *
     * ```javascript
     * var config = {
     *     key: 'run',
     *     frames: 'muybridge',
     *     frameRate: 15,
     *     repeat: -1
     * };
     *
     * this.anims.create(config);
     * ```
     *
     * With the animation created, you can now play it on this Sprite:
     *
     * ```javascript
     * this.add.sprite(x, y).playReverse('run');
     * ```
     *
     * Alternatively, if you wish to run it at a different frame rate, for example, you can pass a config
     * object instead:
     *
     * ```javascript
     * this.add.sprite(x, y).playReverse({ key: 'run', frameRate: 24 });
     * ```
     *
     * See the documentation for the `PlayAnimationConfig` config object for more details about this.
     *
     * Also, see the documentation in the Animation Manager for further details on creating animations.
     *
     * @method Phaser.GameObjects.Sprite#playReverse
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.50.0
     *
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {boolean} [ignoreIfPlaying=false] - If an animation is already playing then ignore this call.
     * @param {integer} [startFrame=0] - Optionally start the animation playing from this frame index.
     *
     * @return {this} This Game Object.
     */
    playReverse: function (key, ignoreIfPlaying, startFrame)
    {
        return this.anims.playReverse(key, ignoreIfPlaying, startFrame);
    },

    /**
     * Waits for the specified delay, in milliseconds, then starts playback of the requested animation.
     *
     * If the animation _also_ has a delay value set in its config, this value will override that and be used instead.
     *
     * The delay only takes effect if the animation has not already started playing.
     *
     * @method Phaser.GameObjects.Sprite#delayedPlay
     * @fires Phaser.Animations.Events#ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_START
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_START
     * @since 3.50.0
     *
     * @param {integer} delay - The delay, in milliseconds, to wait before starting the animation playing.
     * @param {(string|Phaser.Animations.Animation|Phaser.Types.Animations.PlayAnimationConfig)} key - The string-based key of the animation to play, or an Animation instance, or a `PlayAnimationConfig` object.
     * @param {integer} [startFrame=0] - The frame of the animation to start from.
     *
     * @return {this} This Game Object.
     */
    delayedPlay: function (delay, key, startFrame)
    {
        return this.anims.delayedPlay(delay, key, startFrame);
    },

    /**
     * Immediately stops the current animation from playing and dispatches the `ANIMATION_STOP` events.
     *
     * If no animation is playing, no event will be dispatched.
     *
     * If there is another animation queued (via the `chain` method) then it will start playing immediately.
     *
     * @method Phaser.GameObjects.Sprite#stop
     * @fires Phaser.Animations.Events#ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_STOP
     * @fires Phaser.Animations.Events#SPRITE_ANIMATION_KEY_STOP
     * @since 3.50.0
     *
     * @return {this} This Game Object.
     */
    stop: function ()
    {
        return this.anims.stop();
    },

    /**
     * Build a JSON representation of this Sprite.
     *
     * @method Phaser.GameObjects.Sprite#toJSON
     * @since 3.0.0
     *
     * @return {Phaser.Types.GameObjects.JSONGameObject} A JSON representation of the Game Object.
     */
    toJSON: function ()
    {
        return Components.ToJSON(this);
    },

    /**
     * Handles the pre-destroy step for the Sprite, which removes the Animation component.
     *
     * @method Phaser.GameObjects.Sprite#preDestroy
     * @private
     * @since 3.14.0
     */
    preDestroy: function ()
    {
        this.anims.destroy();

        this.anims = undefined;
    }

});

module.exports = Sprite;
