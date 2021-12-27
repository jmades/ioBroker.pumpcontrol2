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
var switchState;
(function (switchState) {
    switchState[switchState["OFF"] = 0] = "OFF";
    switchState[switchState["AUTO"] = 1] = "AUTO";
    switchState[switchState["FORCEDON"] = 2] = "FORCEDON";
})(switchState || (switchState = {}));
var autoState;
(function (autoState) {
    autoState[autoState["AUTO_OFF"] = 0] = "AUTO_OFF";
    autoState[autoState["AUTO_RUN"] = 1] = "AUTO_RUN";
    autoState[autoState["AUTO_OVERTIME"] = 2] = "AUTO_OVERTIME";
})(autoState || (autoState = {}));
// Load your modules here, e.g.:
// import * as fs from "fs";
class Pumpcontrol2 extends utils.Adapter {
    constructor(options = {}) {
        super({
            ...options,
            name: "pumpcontrol2",
        });
        this.processTime = -1;
        this.state = switchState.OFF;
        this.autoState = autoState.AUTO_OFF;
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
        /*
        const actTime = new Date().getTime();
        if(this.processTime>0)
        {
            this.log.info("Time DIFF = "+(actTime - this.processTime));
        }

        this.processTime = actTime;
        */
        const pressurePromise = await this.getForeignStatesAsync(this.config.pressureObject);
        const pumpOnPromise = await this.getForeignStatesAsync(this.config.inGpioPumpOnObject);
        const pumpAutoPromise = await this.getForeignStatesAsync(this.config.inGpioPumpAutoObject);
        if (pressurePromise && pumpOnPromise && pumpAutoPromise) {
            const pressure = pressurePromise[this.config.pressureObject].val;
            const switchOn = pumpOnPromise[this.config.inGpioPumpOnObject].val;
            const switchAuto = pumpAutoPromise[this.config.inGpioPumpAutoObject].val;
            this.log.info("################# pressure = " + pressure);
            this.log.info("################# switchOn  = " + switchOn);
            this.log.info("################# switchAuto = " + switchAuto);
            // Call the Main Statemachine
            const nextState = this.stateMachine(switchOn, switchAuto);
            this.log.info("Next main state = " + nextState);
            // Initial actions
            if (this.state != nextState) {
                await this.initializeNewState(this.state, nextState);
            }
            else {
                this.doStateAction(this.state);
            }
            /*
                // Call the AUTO state machine
                if(this.state == switchState.AUTO)
                {
                    const nextAutoState = this.autoStateMachine(pressure);

                    this.autoState = nextAutoState;
                    this.setState("autoState",this.autoState);
                }
            */
            // Update States
            this.state = nextState;
            this.setState("mainState", this.state);
            /*
            if(pumpOn)
            {
                this.log.info("Switch Pump ON");
                this.setForeignStateAsync(this.config.outGpioPumpOnObject, true);
            }
            else
            {
                this.log.info("Switch Pump OFF");
                this.setForeignStateAsync(this.config.outGpioPumpOnObject, false);
            }
            */
        }
        else {
            this.log.info("somethins is wrong - Undefined???");
        }
    }
    stateMachine(swOn, swAuto) {
        this.log.info("Calculate new states " + swOn + " - " + swAuto);
        let newState = this.state;
        // Conditions
        switch (this.state) {
            case switchState.OFF:
                {
                    if (swOn) {
                        newState = switchState.FORCEDON;
                    }
                    else if (swAuto) {
                        newState = switchState.AUTO;
                    }
                    break;
                }
            case switchState.FORCEDON:
                {
                    if (!swOn && swAuto) {
                        newState = switchState.AUTO;
                    }
                    else if (!swOn && !swAuto) {
                        newState = switchState.OFF;
                    }
                    break;
                }
            case switchState.AUTO:
                {
                    if (swOn) {
                        newState = switchState.FORCEDON;
                    }
                    else if (!swOn && !swAuto) {
                        newState = switchState.OFF;
                    }
                    break;
                }
        }
        return newState;
    }
    autoStateMachine(pressure) {
        this.log.info("autoStateMachine " + pressure);
        let newState = this.autoState;
        if (pressure < this.config.pressureThreshold) {
            newState = autoState.AUTO_RUN;
        }
        else {
            newState = autoState.AUTO_OFF;
        }
        return newState;
    }
    async initializeNewState(actual, next) {
        this.log.info("initializeNewState " + actual + " --> " + next);
        switch (actual) {
            case switchState.OFF:
                {
                    switch (next) {
                        case switchState.FORCEDON:
                            {
                                this.log.info("From OFF to FORCEDON --> switch pump ON ");
                                this.runtime = 0;
                                this.startTime = new Date().getTime();
                                // Switch Pump ON
                                await this.setForeignStateAsync(this.config.outGpioPumpOnObject, true);
                                break;
                            }
                        case switchState.AUTO:
                            {
                                // Do nothing??
                            }
                    }
                    break;
                }
            case switchState.FORCEDON:
                {
                    switch (next) {
                        case switchState.OFF:
                            {
                                this.log.info("From FORCEDON to OFF --> switch pump OFF ");
                                const opHours = await this.getStateAsync("pumpOperatinghours");
                                if (opHours) {
                                    opHours.val = opHours.val + this.runtime;
                                    this.log.info("Setting ophours to " + opHours.val);
                                    this.setState("pumpOperatinghours", opHours.val);
                                }
                                this.startTime = 0;
                                // switch Pump Off
                                await this.setForeignStateAsync(this.config.outGpioPumpOnObject, false);
                                break;
                            }
                        case switchState.AUTO:
                            {
                                // Do nothing??
                            }
                    }
                    break;
                }
        }
    }
    doStateAction(actual) {
        this.log.info("do state action " + actual);
        switch (actual) {
            case switchState.FORCEDON:
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
        this.log.info("Hello Pump Controller 6");
        this.log.info("pressure: " + this.config.pressureObject);
        this.log.info("IN GPIO ON: " + this.config.inGpioPumpOnObject);
        this.log.info("IN GPIO AUTO: " + this.config.inGpioPumpAutoObject);
        this.log.info("OUT GPIO : " + this.config.outGpioPumpOnObject);
        this.log.info("Threshold : " + this.config.pressureThreshold);
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
                type: "string",
                role: "value",
                read: true,
                write: true,
            },
            native: {},
        });
        await this.setObjectAsync("autoState", {
            type: "state",
            common: {
                name: "autoState",
                type: "string",
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