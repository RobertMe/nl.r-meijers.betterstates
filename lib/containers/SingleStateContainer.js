'use strict';

const StateContainer = require('./StateContainer');

class SingleStateContainer extends StateContainer {
    constructor(settings) {
        super(settings);
        this.activationDelayTimer = null;
    }

    getActiveState() {
        return this.activeState;
    }

    setActiveState(state, delay) {
        if (this.activationDelayTimer) {
            clearTimeout(this.activationDelayTimer);
            this.activationDelayTimer = null;
        }

        if (this.activeState && this.activeState.id === state.id) {
            return;
        }

        const setState = () => {
            const currentState = this.activeState;
            this.activeState = state;

            this.emit('stateChanged', currentState, state);
        };

        if (delay) {
            this.activationDelayTimer = setTimeout(setState, delay * 1000);
        } else {
            setState();
        }
    }
}

module.exports = SingleStateContainer;
