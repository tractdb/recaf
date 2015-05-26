// controllers.js     Controllers for the different tabs
//

function url_uniquify(url)
{
    // Make the given file URL unique by adding a unique string before
    // the last '.'.
    //
    var dotx = url.lastIndexOf('.');
    if (dotx < 0)
        return url + Date.now();
    return url.substring(0, dotx) + Date.now() + url.substring(dotx);
}

angular.module('recaf.controllers',
    [ 'recaf.entryimg', 'recaf.login', 'recaf.annotate', 'recaf.resize',
      'recaf.entries', 'recaf.fileio', 'recaf.dateforms' ]
)

.controller('CaptureCtrl', function($scope, $state, $ionicBackdrop,
                                    Annotate, Resize, Entries, FileIO,
                                    Dateforms) {
    var MEDHEIGHT = 640; // Resized picture height (medium = 480 x 640)

    function yespic(picurl) {
        // The camera plugin uses the same name every time (since we
        // clean up old photos each time). Need to guarantee that image
        // name is unique; otherwise the image cache of WebView gets
        // confused (it seems).
        //
        var upicurl = url_uniquify(picurl);
        var ubase = upicurl.substring(upicurl.lastIndexOf('/') + 1);

        FileIO.rename_p(picurl, ubase)
        .then(function() {
            return Annotate.details_p($scope, upicurl, new Date());
        })
        .then(function(details) {
            $ionicBackdrop.release();
            if (!details)
                return; // User canceled (or error)
            var entry = {};
            entry.date = Dateforms.html5_string(details.date);
            entry.comment = details.comment;

            // Save journal entry and clean up.
            //
            // Note: not waiting for this chain of promises to resolve.
            //
            var rpicurl;
            Resize.resized_pic_p(upicurl, 1e9, MEDHEIGHT)
            .then(function(rpu) {
                rpicurl = rpu;
                return FileIO.read_array_buffer_p(rpicurl);
            })
            .then(function(buf) {
                entry['medpic.jpg'] = new Uint8Array(buf);
                return Entries.add(entry);
            })
            .then(function() {
                return FileIO.delete_p(rpicurl);
            })
            .then(function() {
                navigator.camera.cleanup(
                    function yesCleanup() {},
                    function noCleanup() {}
                );
            });
        })
    }
    function nopic() {
        $ionicBackdrop.release();
    }
    $scope.getPicture = function() {
        var opts = { destinationType: Camera.DestinationType.FILE_URI };
        $ionicBackdrop.retain();
        navigator.camera.getPicture(yespic, nopic, opts);
    };
})

.controller('ReviewCtrl', function($scope, Entries, Entryimg) {
    $scope.entryImgURL = Entryimg.url;
    Entries.all()
    .then(function(es) {
        $scope.entries = es;
    });
})

.controller('ReviewDetailCtrl', function($scope, $stateParams, Entries,
                                            Entryimg) {
    $scope.entryImgURL = Entryimg.url;
    $scope.entryId = $stateParams.entryId;
    Entries.get($stateParams.entryId)
    .then(function(e) { $scope.entry = e; });
})

.controller('SettingsCtrl', function($scope, Login, Entries) {
    $scope.replicationInProgress = Entries.replicating();
    $scope.beginReplication = function() {
        Login.loginfo_p("couchuser", $scope, 'CouchDB Login')
        .then(function(loginfo) {
            if (!loginfo)
                return null;
            $scope.replicationInProgress = true;
            return Entries.replicate(loginfo)
            .then(function(_) {
                $scope.replicationInProgress = false;
                return null;
            });
        });
    };
    $scope.clearCredentials = function() {
        Login.loginfo_clear("couchuser");
    };
})
