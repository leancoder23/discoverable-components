# Discoverable component
Lib to make a component discoverable to others. When a component is loadeed in dom it notify others. This way all component on the page knows what other component exists and interact with them with given API set. 




# Concept


# Modules

## Core
The most essential module is _core_. This module provides the decorators to enhance web components by the discoverability.

## Dev Tools
The _dev tools_ are meant to be used during development only and introduce functionality that enhance visibility on:
* which dwc enhanced web components are currently instantiated in the browser
* what properties and methods they expose to other web components
* a log trail on what properties have been mutated at which point in time and which methods have been triggered

# Install

The project is being organised as [yarn workspace](https://classic.yarnpkg.com/en/docs/workspaces/). As such we profit from the native yarn capability to interlink the otherwise independend individual modules.

Please execute ```yarn``` on root level to install all dependencies.

# Build

## Core
In order to build _core_ please navigate to this module and execute ```yarn build```. This generated the _dist_ folder (if not existent, yet), which holds the library artifacts after a successful build.

## Dev Tools
In order to build _dev tools_ please navigate to this module and execute ```yarn build```. This generated the _dist_ folder (if not existent, yet), which holds the library artifacts after a successful build.


## Example