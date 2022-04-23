"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var Phaser = require("phaser");
var Example = /** @class */ (function (_super) {
    __extends(Example, _super);
    function Example(config) {
        return _super.call(this, config) || this;
    }
    Example.prototype.preload = function () {
        this.load.spritesheet('diamonds', 'https://labs.phaser.io/assets/sprites/diamonds32x24x5.png', { frameWidth: 32, frameHeight: 24 });
    };
    Example.prototype.create = function () {
        this.add.text(400, 32, 'Click to create animations', { color: '#00ff00' })
            .setOrigin(0.5, 0);
        //    const group = this.add.group({
        //        key: 'diamonds',
        //        frame: [0, 1, 2, 3, 4],
        //        frameQuantity: 20
        //    });
        //    Phaser.Actions.GridAlign(group.getChildren(), {
        //        width: 10,
        //        height: 10,
        //        cellWidth: 32,
        //        cellHeight: 32,
        //        x: 100,
        //        y: 100
        //    });
    };
    return Example;
}(Phaser.Scene));
exports.default = Example;
//# sourceMappingURL=Example.js.map