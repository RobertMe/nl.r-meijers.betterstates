'use strict';

const SingleStateContainer = require('./SingleStateContainer');

class LinearStateContainer extends SingleStateContainer {
    constructor(settings) {
        super(settings);

        this.setActiveState(this.states[0]);
    }

    activate(stateId) {
        this.setActiveState(this.findState(stateId));
    }
}

module.exports = LinearStateContainer;
