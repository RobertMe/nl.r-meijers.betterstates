'use strict';

const StateContainer = require('./StateContainer');

class SingleStateContainer extends StateContainer {
    constructor(settings) {
        super(settings);
    }

    getActiveState() {
        return this.activeState;
    }

    setActiveState(state) {
        const currentState = this.activeState;
        this.activeState = state;

        this.emit('stateChanged', currentState, state);
    }
}

module.exports = SingleStateContainer;
