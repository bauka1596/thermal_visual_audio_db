// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2015 Giovanni Campagna <gcampagn@cs.stanford.edu>
//
// See LICENSE for details
"use strict";

const Tp = require('thingpedia');

module.exports = class GoogleAccountDevice extends Tp.BaseDevice {
    static get runOAuth2() {
        return Tp.Helpers.OAuth2({
            kind: 'com.google',
            scope: ['openid','profile','email'],
            authorize: 'https://accounts.google.com/o/oauth2/auth',
            get_access_token: 'https://www.googleapis.com/oauth2/v3/token',
            set_access_type: true,
            callback(engine, accessToken, refreshToken) {
                var auth = 'Bearer ' + accessToken;
                return Tp.Helpers.Http.get('https://www.googleapis.com/oauth2/v2/userinfo', { auth: auth, accept: 'application/json' }).then((response) => {
                    const parsed = JSON.parse(response);
                    return engine.devices.loadOneDevice({ kind: 'com.google',
                                                          accessToken: accessToken,
                                                          refreshToken: refreshToken,
                                                          profileId: parsed.id }, true);
                });
            }
        });
    }

    constructor(engine, state) {
        super(engine, state);

        // NOTE: for legacy reasons, this is google-account-*, not com.google-* as one would
        // hope
        // please do not follow this example
        this.uniqueId = 'google-account-' + this.profileId;
        this.name = "Google Account %s".format(this.profileId);
        this.description = "This is your Google Account. You can use it to access emails, files, calendars and more.";
    }

    get profileId() {
        return this.state.profileId;
    }

    get accessToken() {
        return this.state.accessToken;
    }
};
