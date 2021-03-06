'use strict';

const SingleStateContainer = require('./SingleStateContainer');

class PriorityStackedStateContainer extends SingleStateContainer {
    constructor(settings) {
        super(settings);

        this.activeState = this.defaultState = this.states[this.states.length-1];
        this.activeStates = [this.activeState.id];
        this.newActiveState = null;
    }

    getDefaultState() {
        return this.defaultState;
    }

    isBefore(stateId, comparisonState) {
        if (stateId === comparisonState.id) {
            return false;
        }

        for (let state of this.states) {
            if (state.id === stateId) {
                return true;
            } else if (state.id === comparisonState.id) {
                return false;
            }
        }

        return new Error('invalid_comparison');
    }

    isAfter(stateId, comparisonState) {
        if (stateId === comparisonState.id) {
            return false;
        }

        for (let state of this.states) {
            if (state.id === stateId) {
                return false;
            } else if (state.id === comparisonState.id) {
                return true;
            }
        }

        return new Error('invalid_comparison');
    }

    isEnabled(searchState) {
        if (this.activeStates.indexOf(searchState.id) >= 0) {
            return true;
        }

        for (const testState of this.states) {
            if (testState.id === searchState.id) {
                return false;
            }
        }

        return new Error('invalid_state');
    }

    activate(stateId) {
        // Default state can not be activated nor deactivated
        if (stateId === this.defaultState.id) {
            return new Error('cannot_activate_default');
        }

        if (this.activeStates.indexOf(stateId) >= 0) {
            return;
        }

        let activate = true;
        let found = false;
        let state = null;
        for (state of this.states) {
            if (state.id === stateId) {
                found = true;
                break;
            } else if (this.activeStates.indexOf(state.id) >= 0) {
                activate = false;
            }
        }

        if (!found) {
            return new Error('invalid_state');
        }

        this.activeStates.push(stateId);

        if (activate) {
            this.setActiveState(state, state.activationDelay);
        }
    }

    deactivate(stateId) {
        // Default state can not be activated nor deactivated
        if (stateId === this.defaultState.id) {
            return new Error('cannot_deactivate_default');
        }

        const index = this.activeStates.indexOf(stateId);
        if (index < 0) {
            return;
        }

        this.activeStates.splice(index, 1);

        if ((this.newActiveState || this.activeState).id !== stateId) {
            return;
        }

        // Search the topmost active state.
        // This should always find a state because the default state can not be removed
        let state = null;
        for (state of this.states) {
            if (this.activeStates.indexOf(state.id) >= 0) {
                break;
            }
        }

        this.setActiveState(state, this.activeState.deactivationDelay);
    }

    toggle(stateId) {
        if (this.activeStates.indexOf(stateId) >= 0) {
            this.deactivate(stateId);
        } else {
            this.activate(stateId);
        }
    }

    unwindToDefault(delay) {
        if (this.activeStates.length === 0 && this.activeStates[0] === this.defaultState.id) {
            return;
        }

        this.activeStates = [this.defaultState.id];
        this.setActiveState(this.defaultState, delay);
    }

    setActiveState(state, delay) {
        this.newActiveState = state;
        super.setActiveState(state, delay);
    }
}

module.exports = PriorityStackedStateContainer;
