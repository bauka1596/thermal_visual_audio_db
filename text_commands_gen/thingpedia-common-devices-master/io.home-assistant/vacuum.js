// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// This file is part of io.home-assistant
//
// Copyright 2019 Swee Kiat Lim <sweekiat@stanford.edu>
//
// See LICENSE for details
"use strict";

const HomeAssistantDevice = require('./base');

module.exports = class HomeAssistantVacuum extends HomeAssistantDevice {
    async get_state() {
        return [{ state: this.state.state, status : this.state.attributes.status ? this.state.attributes.status.toLowerCase() : undefined }];
    }
    // note: subscribe_ must NOT be async, or an ImplementationError will occur at runtime
    subscribe_state() {
        return this._subscribeState(() => {
            return { state: this.state.state, status : this.state.attributes.status ? this.state.attributes.status.toLowerCase() : undefined };
        });
    }
    async do_set_power({ power }) {
        if (power === 'on')
            await this._callService('vacuum', 'turn_on');
        else
            await this._callService('vacuum', 'turn_off');
    }
    async do_return_to_base() {
        await this._callService("vacuum", "return_to_base");
    }
    async do_stop() {
        await this._callService("vacuum", "stop");
    }
    async do_start() {
        await this._callService("vacuum", "start");
    }
    async do_pause() {
        await this._callService("vacuum", "pause");
    }
};
