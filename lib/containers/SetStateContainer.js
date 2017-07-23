'use strict';

const StateContainer = require('./StateContainer');

class SetStateContainer extends StateContainer {
    constructor(settings) {
        super(settings);
        this.activeStates = [];
        this.activatingStates = {};
        this.deactivatingStates = {};
    }

    getActiveStates() {
        return this.activeStates;
    }

    isActive(searchState) {
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
        if (this.activeStates.indexOf(stateId) >= 0) {
            if (stateId in this.deactivatingStates) {
                clearTimeout(this.deactivatingStates[stateId]);
                delete this.deactivatingStates[stateId];
            }

            return;
        }

        if (stateId in this.activatingStates) {
            return;
        }

        let found = false;
        let state = null;
        for (state of this.states) {
            if (state.id === stateId) {
                found = true;
                break;
            }
        }

        if (!found) {
            return new Error('invalid_state');
        }

        const setState = () => {
            this.activeStates.push(stateId);
            this.emit('stateActivated', state);
            delete this.activatingStates[stateId];
        };

        if (state.activationDelay) {
            this.activatingStates[stateId] = setTimeout(setState, state.activationDelay * 1000);
        } else {
            setState();
        }
    }

    deactivate(stateId) {
        if (this.activeStates.indexOf(stateId) < 0) {
            if (stateId in this.activatingStates) {
                clearTimeout(this.activatingStates[stateId]);
                delete this.activatingStates[stateId];
            }

            return;
        }

        if (stateId in this.deactivatingStates) {
            return;
        }

        let found = false;
        let state = null;
        for (state of this.states) {
            if (state.id === stateId) {
                found = true;
                break;
            }
        }

        if (!found) {
            return new Error('invalid_state');
        }

        const unsetState = () => {
            // If timeout is used the index could have changed in the meantime
            const index = this.activeStates.indexOf(stateId);
            this.activeStates.splice(index, 1);
            this.emit('stateDeactivated', state);
            delete this.deactivatingStates[stateId];
        };

        if (state.deactivationDelay) {
            this.deactivatingStates[stateId] = setTimeout(unsetState, state.deactivationDelay * 1000);
        } else {
            unsetState();
        }
    }
}

module.exports = SetStateContainer;
