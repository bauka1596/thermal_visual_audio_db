// -*- mode: js; indent-tabs-mode: nil; js-basic-offset: 4 -*-
//
// Copyright 2018 Google LLC
//
// See LICENSE for details
"use strict";

process.on('unhandledRejection', (up) => { throw up; });
process.env.TEST_MODE = '1';

const assert = require('assert');
const util = require('util');
const fs = require('fs');
const path = require('path');

const Tp = require('thingpedia');

const _engine = require('./mock');
const _tpFactory = new Tp.DeviceFactory(_engine, _engine.thingpedia, {});

async function createDeviceInstance(deviceKind, manifest, devClass) {
    const config = manifest.config;
    if (config.module === 'org.thingpedia.config.none')
        return new devClass(_engine, { kind: deviceKind });
    if (config.module === 'org.thingpedia.config.basic_auth' ||
        config.module === 'org.thingpedia.config.form') {
        // credentials are stored in test/[DEVICE ID].cred.json
        const credentialsPath = path.resolve('./test', deviceKind + '.cred.json');
        const args = require(credentialsPath);
        args.kind = deviceKind;
        return new devClass(_engine, args);
    }

    // otherwise do something else...
    return null;
}

async function testQuery(instance, functionName, input, expected) {
    if (typeof input === 'function')
        input = input(instance);

    const result = await instance['get_' + functionName](input);
    if (typeof expected === 'function') {
        expected(result, input, instance);
        return;
    }

    if (!Array.isArray(expected))
        expected = [expected];

    assert.deepStrictEqual(result, expected);
}

async function runTest(instance, test) {
    if (typeof test === 'function') {
        await test(instance);
        return;
    }

    let [testType, functionName, input, expected] = test;

    switch (testType) {
    case 'query':
        await testQuery(instance, functionName, input, expected);
        break;
    case 'monitor':
        // do something
        break;
    case 'action':
        // do something
        break;
    }
}

function assertNonEmptyString(what) {
    assert(typeof what === 'string' && what, 'Expected a non-empty string, got ' + what);
}

let _anyFailed = false;
async function testOne(deviceKind) {
    // load the test class first
    let testsuite;
    try {
        testsuite = require('./' + deviceKind);
    } catch(e) {
        console.log('No tests found for ' + deviceKind);
        // exit with no error and without loading the device
        // class (which would pollute code coverage statistics)
        return;
    }

    // now load the device through the TpClient loader code
    // (which will initialize the device class with stuff like
    // the OAuth helpers and the polling implementation of subscribe_*)

    const manifest = await _engine.thingpedia.getDeviceManifest(deviceKind);
    const devClass = await _tpFactory.getDeviceClass(deviceKind);

    // require the device once fully (to get complete code coverage)
    if (manifest.loader.module === 'org.thingpedia.v2')
        require('../' + deviceKind);

    if (typeof testsuite === 'function') {
        // if the testsuite is a function, we're done here
        await testsuite(devClass);
        return;
    }

    let instance = null;
    if (!Array.isArray(testsuite)) {
        const meta = testsuite;
        testsuite = meta.tests;
        if (meta.setUp)
            instance = await meta.setUp(devClass);
    }
    if (instance === null)
        instance = await createDeviceInstance(deviceKind, manifest, devClass);
    if (instance === null) {
        console.log('FAILED: skipped tests for ' + deviceKind + ': missing credentials');
        _anyFailed = true;
        return;
    }

    assertNonEmptyString(instance.name);
    assertNonEmptyString(instance.description);
    assertNonEmptyString(instance.uniqueId);

    console.log('# Starting tests for ' + deviceKind);
    for (let i = 0; i < testsuite.length; i++) {
        console.log(`## Test ${i+1}/${testsuite.length}`);
        const test = testsuite[i];
        try {
            await runTest(instance, test);
        } catch(e) {
            console.log('## FAILED: ' + e.message);
            console.log(e.stack);
            _anyFailed = true;
        }
    }
    console.log('# Completed tests for ' + deviceKind);
}

async function existsSafe(path) {
    try {
        await util.promisify(fs.access)(path);
        return true;
    } catch(e) {
        if (e.code === 'ENOENT')
            return false;
        if (e.code === 'ENOTDIR')
            return false;
        throw e;
    }
}

function deviceChanged(fileChanged) {
    if (fileChanged.startsWith('test/') && fileChanged.endsWith('.js')) {
        let maybeDevice = fileChanged.substring('test/'.length, fileChanged.length - '.js'.length);
        let fullPath = path.resolve(path.dirname(module.filename), '..', maybeDevice);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory())
            return maybeDevice;
        else
            return null;
    } else if (fileChanged.includes('/')) {
        let maybeDevice = fileChanged.substring(0, fileChanged.indexOf('/'));
        let fullPath = path.resolve(path.dirname(module.filename), '..', maybeDevice);
        if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory())
            return maybeDevice;
        else
            return null;
    } else {
        return null;
    }
}

async function toTest(argv) {
    let devices = new Set();

    if (argv.length > 2) {
        const filesChanged = argv.slice(2);
        for (let file of filesChanged) {
            let fullPath = path.resolve(path.dirname(module.filename), '..', file);
            if (fs.existsSync(fullPath) && fs.lstatSync(fullPath).isDirectory()) {
                // if it's a device name, add it directly
                devices.add(file);
            } else {
                // if it's a path to a file, try to get the device name out of it
                // if we failed to get the device name, test all
                const maybeDevice = deviceChanged(file);
                if (maybeDevice) {
                    devices.add(maybeDevice);
                } else {
                    devices.clear();
                    break;
                }
            }
        }
    }

    if (devices.size === 0)
        return await util.promisify(fs.readdir)(path.resolve(path.dirname(module.filename), '..'));
    else
        return devices;
}

async function main() {
    // takes either (1) device names to test, or (2) changed files
    for (let name of await toTest(process.argv)) {
        if (!await existsSafe(name + '/manifest.tt')) //'
            continue;

        console.log(name);
        await testOne(name);
    }

    if (_anyFailed)
        process.exit(1);
}
main();
