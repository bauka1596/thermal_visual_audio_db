# Various Thingpedia Devices

[![Build Status](https://travis-ci.com/stanford-oval/thingpedia-common-devices.svg?branch=master)](https://travis-ci.com/stanford-oval/thingpedia-common-devices) [![Coverage Status](https://coveralls.io/repos/github/stanford-oval/thingpedia-common-devices/badge.svg?branch=master)](https://coveralls.io/github/stanford-oval/thingpedia-common-devices?branch=master)

## Knowledge for your Virtual Assistant

Thingpedia is the open, crowdsourced knowledge base for virtual assistants.
Anyone can contribute the interface code to access any device or
web service to Thingpedia.

This repository contains a subset of the interfaces hosted
on Thingpedia, that are maintained by the Thingpedia authors.

These interfaces cannot be used alone: each interface must be packaged
and uploaded separately to Thingpedia, to be used by some installation
of the Almond virtual assistant.
While a package.json is present at the top of this repository, its purpose
is only to declare dependencies used in automatic testing. Directly importing
this package, or any of the Thingpedia interfaces, is likely to fail without
the necessary surrounding code.

Thingpedia is part of Almond, a research project led by
prof. Monica Lam, from Stanford University.  You can find more
information at <https://almond.stanford.edu>.

## Test your device
This repository also provides a simple test framework for devices 
that require no authentication or basic username-password style 
[basic authentication](https://almond.stanford.edu/thingpedia/developers/thingpedia-device-intro-auth-n-discovery.md#username-and-password). 

Once your device has been created, you can add the test under directory `test`. 
A couple examples have been added for your reference. 
For example, if you want to test your device named `com.xxx`, 
first create a test file `com.xxx.js`, and `com.xxx.cred.json` containing
the username and password (for basic authentication only) under directory `test`, 
and then run `yarn test com.xxx` (or `node test/index.js com.xxx` if you are not a fan of `yarn`).

Make sure your device either (1) has name and description annotation in `manifest.tt`
(see `com.wikicfp/manifest.tt` as an example) or (2) has a constructor
in the JavaScript class defining the name and description (see `com.bing` as an example).

## Prepare the package and upload to Thingpedia
Once you are ready, you can pack your interface and submit it to Thingpedia. 
If the device only has one JavaScript file and no dependencies (i.e., `node_modules`), 
you can go ahead and upload the JavaScript file at <https://almond.stanford.edu/thingpedia/upload/create>.
Otherwise, you will need to upload a zip file containing all the files and dependencies.
You can create the zip file by running `make com.xxx.zip`.

## Add your device to this repository
Create a pull request if you want to add your device to this repository.
If the device uses basic authentication and comes with a test, i.e., requires a `.cred.json` file,
run `travis encrypt-file test/com.xxx.cred.json --add`.
This will create a file named `com.xxx.cred.json.enc` and update `.travis.yml`.
Commit both files before your pull request. 
