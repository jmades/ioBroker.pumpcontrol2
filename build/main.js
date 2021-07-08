"use strict";
/*
 * Created with @iobroker/create-adapter v1.34.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
const utils = __importStar(require("@iobroker/adapter-core"));
// import "iobroker";
// Load your modules here, e.g.:
// import * as fs from "fs";
class Pumpcontrol2 extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "pumpcontrol2",
        });
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }
    async controlPump() {
        this.log.info("Let's control the pump");
        this.getForeignStatesAsync(this.config.pressureObject).then((x) => {
            this.log.info("Was ist das hier?");
        });
        const xxx = await this.getForeignStatesAsync(this.config.pressureObject);
        if (xxx) {
            for (const [key, value] of (Object.entries(xxx))) {
                this.log.info(key);
                this.log.info(JSON.stringify(value));
            }
        }
        // this.log.info("pressure = "+pressure);
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("Hello Pump Controller 6");
        this.log.info("pressure: " + this.config.pressureObject);
        this.log.info("IN GPIO : " + this.config.inGpioObject);
        this.log.info("OUT GPIO : " + this.config.outGpioObject);
        // modbus.0.holdingRegisters.17666_p1
        this.subscribeForeignStates(this.config.pressureObject);
        // rpi2.0.gpio.4.state
        this.subscribeForeignStates(this.config.inGpioObject);
        // GPIO OUT rpi2.0.gpio.17.state
    }
    /**
     * Is called when adapter shuts down - callback has to be called under any circumstances!
     */
    onUnload(callback) {
        try {
            // Here you must clear all timeouts or intervals that may still be active
            // clearTimeout(timeout1);
            // clearTimeout(timeout2);
            // ...
            // clearInterval(interval1);
            callback();
        }
        catch (e) {
            callback();
        }
    }
    // If you need to react to object changes, uncomment the following block and the corresponding line in the constructor.
    // You also need to subscribe to the objects with `this.subscribeObjects`, similar to `this.subscribeStates`.
    // /**
    //  * Is called if a subscribed object changes
    //  */
    // private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
    //     if (obj) {
    //         // The object was changed
    //         this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
    //     } else {
    //         // The object was deleted
    //         this.log.info(`object ${id} deleted`);
    //     }
    // }
    /**
     * Is called if a subscribed state changes
     */
    onStateChange(id, state) {
        if (state) {
            // The state was changed
            this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
            // this.controlPump(state.val);
            this.controlPump();
        }
        else {
            // The state was deleted
            this.log.info(`state ${id} deleted`);
        }
    }
}
if (require.main !== module) {
    // Export the constructor in compact mode
    module.exports = (options) => new Pumpcontrol2(options);
}
else {
    // otherwise start the instance directly
    (() => new Pumpcontrol2())();
}
//# sourceMappingURL=main.js.map