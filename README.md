# 🐴 Module of the I ❤ Petri nets website

This module implements the synthesis of Petri nets from labelled Petri nets and its most recent version is hosted on the [I ❤ Petri nets](https://www.fernuni-hagen.de/ilovepetrinets/horse) website.


## Cloning and building the project
The repository operates in tandem with the [ILPN-Components](https://github.com/ILPN/ILPN-Components) repository that is a git submodule in this project. The build configuration is a part of this project.

When cloning the project run:

```
git clone --recurse-submodules <git repo link>
```

to initialize the submodules.

This project uses Angular v17. Prepare your local development environment by following [their instructions](https://v17.angular.io/guide/setup-local).

To build and run the project locally, run the `start` script in the `package.json` file. This will first build the components library, add it as a dependency to the module project, and then build and run the module project.
