'use strict';

const events = require('events');

class StateContainer extends events.EventEmitter {
    constructor(settings) {
        super();

        this.settings = settings;
        this.states = settings.states;
        this.nameMapping = {};
        for (const state of this.states) {
            this.nameMapping[state.name] = state.id;
        }
    }

    getSettings() {
        return this.settings;
    }

    getName() {
        return this.settings.name;
    }

    getStates() {
        return this.states;
    }

    getStateId(name) {
        return name in this.nameMapping ? this.nameMapping[name] : new Error('invalid_state_name');
    }

    findState(id) {
        for (const state of this.states) {
            if (state.id === id) {
                return state;
            }
        }

        return null;
    }
}

module.exports = StateContainer;
