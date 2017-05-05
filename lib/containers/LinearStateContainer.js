'use strict';

const SingleStateContainer = require('./SingleStateContainer');

class LinearStateContainer extends SingleStateContainer {
    constructor(settings) {
        super(settings);

        this.setActiveState(this.states[0]);
    }

    activate(stateId) {
        const state = this.findState(stateId);
        this.setActiveState(state, state.activationDelay);
    }
}

module.exports = LinearStateContainer;
