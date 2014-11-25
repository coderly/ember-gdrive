# Ember-gdrive

This README outlines the details of collaborating on this Ember addon.

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember server`
* Visit your app at http://localhost:4200.

## Running Tests

* `ember test`
* `ember test --server`

## Building

* `ember build`

## Development with symbolic links on Windows

In order to make development easier with the addon, on windows (and probably other operating systems in a similar fashion), we can make use of symbolic links to quickly 'deploy' ember-cli addons into a project that uses them.

1. Navigate to addon root (in our case `ember-gdrive\\`).
2. `npm link` will add the folder into the global addon library under the folder name (`ember-gdrive'`).
3. Navigate to project folder (in our case `storypad\\`).
4. `npm link ember-gdrive`. This will create a symbolic link to the `ember-gdrive` folder inside the `node-modules` folder. Any change to ember-gdrive will automatically update here.

### Notes about this

* Some sort of file watch might be necessary. It looks like changes I make do not really reflect until I stop the storypad application and then start it again via `ember-server`.
* Since `ember-cli` addons do not compile or build in any way and all it takes is to copy the folder's contents, this works especially well in this case. An addon that requires building, for instance the old version of `ember-gdrive` would not be as straightforward to link.
* For the `npm link` command to work, the console process needs to be run with administrative privileges.
