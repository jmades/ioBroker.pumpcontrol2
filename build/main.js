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
var mainState;
(function (mainState) {
    mainState[mainState["MAN_OFF"] = 0] = "MAN_OFF";
    mainState[mainState["MAN_ON"] = 1] = "MAN_ON";
    mainState[mainState["AUTO_OFF"] = 2] = "AUTO_OFF";
    mainState[mainState["AUTO_ON"] = 3] = "AUTO_ON";
    mainState[mainState["OVERTIME_OFF"] = 4] = "OVERTIME_OFF";
})(mainState || (mainState = {}));
// Load your modules here, e.g.:
// import * as fs from "fs";
class Pumpcontrol2 extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "pumpcontrol2",
        });
        this.processTime = -1;
        this.state = mainState.MAN_OFF;
        this.runtime = 0;
        this.startTime = 0;
        this.on("ready", this.onReady.bind(this));
        this.on("stateChange", this.onStateChange.bind(this));
        // this.on("objectChange", this.onObjectChange.bind(this));
        // this.on("message", this.onMessage.bind(this));
        this.on("unload", this.onUnload.bind(this));
    }
    async controlPump() {
        this.log.info("Let's control the pump, moi Liewer");
        const pressurePromise = await this.getForeignStatesAsync(this.config.pressureObject);
        const pumpOnPromise = await this.getForeignStatesAsync(this.config.inGpioPumpOnObject);
        const pumpAutoPromise = await this.getForeignStatesAsync(this.config.inGpioPumpAutoObject);
        if (pressurePromise && pumpOnPromise && pumpAutoPromise) {
            const pressure = pressurePromise[this.config.pressureObject].val;
            const switchOn = pumpOnPromise[this.config.inGpioPumpOnObject].val;
            const switchAuto = pumpAutoPromise[this.config.inGpioPumpAutoObject].val;
            /*
            this.log.info("################# pressure = "+pressure);
            this.log.info("################# switchOn  = "+switchOn);
            this.log.info("################# switchAuto = "+switchAuto);
            */
            // Call the Main Statemachine
            const nextState = this.stateMachine(switchOn, switchAuto, pressure, this.config.pressureThreshold, this.runtime, this.config.maxRuntime);
            this.log.info("Next main state = " + nextState);
            // Initial actions
            if (this.state != nextState) {
                await this.initializeNewState(this.state, nextState);
            }
            else {
                this.doStateAction(this.state);
            }
            // Update States
            this.state = nextState;
            this.setState("mainState", this.state);
        }
        else {
            this.log.info("somethins is wrong - Undefined???");
        }
    }
    stateMachine(swOn, swAuto, pressure, pressureThreshold, runtime, maxRuntime) {
        this.log.info("Calculate new states swMan= " + swOn +
            " - swAuto= " + swAuto + " - p= " + pressure + " - pTh= " + pressureThreshold + "- rTime= " + runtime + " -state" + this.state);
        let newState = this.state;
        // Conditions
        switch (this.state) {
            case mainState.MAN_OFF:
                {
                    if (swOn) {
                        newState = mainState.MAN_ON;
                    }
                    else if (swAuto) {
                        newState = mainState.AUTO_OFF;
                    }
                    break;
                }
            case mainState.MAN_ON:
                {
                    if (!swOn && swAuto) {
                        newState = mainState.AUTO_OFF;
                    }
                    else if (!swOn && !swAuto) {
                        newState = mainState.MAN_OFF;
                    }
                    else if (runtime > maxRuntime) {
                        newState = mainState.OVERTIME_OFF;
                    }
                    break;
                }
            case mainState.AUTO_OFF:
                {
                    if (swOn) {
                        newState = mainState.MAN_ON;
                    }
                    else if (!swOn && !swAuto) {
                        newState = mainState.MAN_OFF;
                    }
                    else if (pressure < pressureThreshold) {
                        newState = mainState.AUTO_ON;
                    }
                    break;
                }
            case mainState.AUTO_ON:
                {
                    if (swOn) {
                        newState = mainState.MAN_ON;
                    }
                    else if (!swOn && !swAuto) {
                        newState = mainState.MAN_OFF;
                    }
                    else if (runtime > maxRuntime) {
                        newState = mainState.OVERTIME_OFF;
                    }
                    else if (pressure >= pressureThreshold) {
                        newState = mainState.AUTO_OFF;
                    }
                    break;
                }
            case mainState.OVERTIME_OFF:
                {
                    if (!swOn && !swAuto) {
                        newState = mainState.MAN_OFF;
                    }
                    break;
                }
        }
        return newState;
    }
    async initializeNewState(actual, next) {
        this.log.info("initializeNewState " + actual + " --> " + next);
        switch (actual) {
            case mainState.MAN_OFF:
            case mainState.AUTO_OFF:
                {
                    switch (next) {
                        case mainState.MAN_ON:
                        case mainState.AUTO_ON:
                            {
                                this.log.info("From OFF to FORCEDON --> switch pump ON ");
                                this.runtime = 0;
                                this.startTime = new Date().getTime();
                                // Switch Pump ON
                                await this.setForeignStateAsync(this.config.outGpioPumpOnObject, true);
                                break;
                            }
                    }
                    break;
                }
            case mainState.MAN_ON:
            case mainState.AUTO_ON:
                {
                    switch (next) {
                        case mainState.OVERTIME_OFF:
                        case mainState.MAN_OFF:
                        case mainState.AUTO_OFF:
                            {
                                this.log.info("From MAN_ON to MAN_/OVERTIME_OFF --> switch pump OFF ");
                                this.updateOperatingHours();
                                this.startTime = 0;
                                // switch Pump Off
                                await this.setForeignStateAsync(this.config.outGpioPumpOnObject, false);
                                break;
                            }
                    }
                    break;
                }
        }
    }
    async updateOperatingHours() {
        const opHours = await this.getStateAsync("pumpOperatinghours");
        if (opHours) {
            opHours.val = opHours.val + this.runtime;
            this.log.info("Setting ophours to " + opHours.val);
            this.setState("pumpOperatinghours", opHours.val);
        }
    }
    doStateAction(actual) {
        this.log.info("do state action " + actual);
        switch (actual) {
            case mainState.AUTO_ON:
            case mainState.MAN_ON:
                {
                    // Update runtimes
                    this.runtime = new Date().getTime() - this.startTime;
                    this.log.info("Runtime = " + this.runtime);
                    break;
                }
        }
    }
    /**
     * Is called when databases are connected and adapter received configuration.
     */
    async onReady() {
        // Initialize your adapter here
        // The adapters config (in the instance object everything under the attribute "native") is accessible via
        // this.config:
        this.log.info("Hello Pump Controller");
        this.log.info("pressure: " + this.config.pressureObject);
        this.log.info("IN GPIO ON: " + this.config.inGpioPumpOnObject);
        this.log.info("IN GPIO AUTO: " + this.config.inGpioPumpAutoObject);
        this.log.info("OUT GPIO : " + this.config.outGpioPumpOnObject);
        this.log.info("Pressure Threshold : " + this.config.pressureThreshold);
        this.log.info("Max Runtime : " + this.config.maxRuntime);
        // My Objects
        await this.setObjectAsync("pumpOperatinghours", {
            type: "state",
            common: {
                name: "pumpOperatinghours",
                type: "number",
                role: "value",
                read: true,
                write: true,
            },
            native: {},
        });
        await this.setObjectAsync("mainState", {
            type: "state",
            common: {
                name: "mainState",
                type: "number",
                role: "value",
                read: true,
                write: true,
            },
            native: {},
        });
        // TODO load the old value
        this.setState("pumpOperatinghours", 0);
        // be sensitve to pressure
        if (this.config.pressureObject)
            this.subscribeForeignStates(this.config.pressureObject);
        // be sensitive to GPIOs
        if (this.config.inGpioPumpOnObject)
            this.subscribeForeignStates(this.config.inGpioPumpOnObject);
        if (this.config.inGpioPumpAutoObject)
            this.subscribeForeignStates(this.config.inGpioPumpAutoObject);
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