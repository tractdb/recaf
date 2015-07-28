How to build Recaf under OS X
=============================

*July 28, 2015*

0.  Need to start with node.js installed. You can install it by any
    convenient method. One way is to use homebrew, which you can find at
    `http://brew.sh`

    If you're using homebrew, install node.js like this:

        $ brew install node

1.  Choose whether to install node.js packages locally (in a personal
    project directory) or globally. It seems safer to me to install them
    locally, so that's what these instructions will do.

    If you want to install locally, create a personal project directory.
    Let's call it PDIR:

        $ export PDIR=/Users/jeffsco/Ionic
        $ mkdir $PDIR

    If you want to install globally, you'll need to adjust these
    instructions a little as you go. For one thing, you'll need to
    specify `-g` for the `npm install` commands.

2.  The package manager for node.js is npm, which most recently is
    bundled with node.js. Use npm to install Cordova and Ionic:

        $ cd $PDIR
        $ npm install cordova ionic

3.  Add the cordova and ionic command-line binaries to your path:

        $ PATH=$PDIR/node_modules/.bin:$PATH

4.  Clone Recaf into the project directory:

        $ cd $PDIR
        $ git clone https://github.com/tractdb/recaf.git recaf
        $ cd recaf

5.  Add plugins

        # (In recaf directory.)
        # Base plugins
        $ cordova plugin add com.ionic.keyboard
        $ cordova plugin add cordova-plugin-console
        $ cordova plugin add cordova-plugin-device
        $ cordova plugin add cordova-plugin-statusbar
        $ cordova plugin add cordova-plugin-camera
        $ cordova plugin add cordova-plugin-file
        # Exotic plugins
        $ cordova plugin add https://github.com/couchbaselabs/Couchbase-Lite-PhoneGap-Plugin.git
        $ cordova plugin add https://github.com/protonet/cordova-plugin-image-resizer.git

6.  Add iOS platform

        # (In recaf directory.)
        $ ionic platform add ios

7.  Build the app

        # (In recaf directory.)
        $ ionic build

8.  Open Xcode to build and test the app

        # (In recaf directory.)
        $ cd platforms/ios
        $ open Recaf.xcodeproj
        <<Configure the code signing rigamarole>>
        <<Plug in iPhone>>
        <<Select iPhone as test run target>>
        <<Click on the "play" triangle to build and run>>
