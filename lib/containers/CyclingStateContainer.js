'use strict';

const SingleStateContainer = require('./SingleStateContainer');

class CyclingStateContainer extends SingleStateContainer {
    constructor(settings) {
        super(settings);

        this.setActiveState(this.states[0]);
    }

    activate(stateId) {
        const state = this.findState(stateId);
        this.setActiveState(state, state.activationDelay);
    }

    forward() {
        const activeIndex = this._activeIndex();
        const newState = this.states[(activeIndex+1) % this.states.length];

        this.setActiveState(newState, newState.activationDelay);
    }

    backward() {
        const activeIndex = this._activeIndex();
        const newState = this.states[(activeIndex > 0 ? activeIndex : this.states.length) - 1];

        this.setActiveState(newState, newState.activationDelay);
    }

    _activeIndex() {
        let i = 0;
        for (let state of this.states) {
            if (state.id === this.activeState.id) {
                return i;
            }
            i++;
        }
    }
}

module.exports = CyclingStateContainer;
