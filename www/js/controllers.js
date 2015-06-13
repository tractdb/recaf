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

.controller('CaptureCtrl', function($q, $rootScope, $scope, $state, $location,
                                    $ionicBackdrop,
                                    Annotate, Resize, Entryimg, Entries,
                                    FileIO, Dateforms) {

    function image_dims_p(imgurl)
    {
        // Return a promise for the width and height of the given image.
        // The promise resolves to an array: [ width, height ]
        //
        var def = $q.defer();
        var im = new Image();
        im.onerror = function(err) { def.reject(err); }
        im.onload = function() { def.resolve([ im.width, im.height ]); }
        im.src = imgurl
        return def.promise;
    }

    function yespic(picurl)
    {
        // The user accepted the picture. Get annotations from user,
        // then add as journal entry.
        //

        // (The camera plugin always creates an image with the same
        // name, since we delete the image when we're done. Need to make
        // the image name artificially unique or the image cache of
        // WebView gets confused. Or so it seems.)
        //
        var upicurl = url_uniquify(picurl);
        var ubase = upicurl.substring(upicurl.lastIndexOf('/') + 1);

        FileIO.rename_p(picurl, ubase)
        .then(function() {
            return Annotate.details_p($scope, upicurl, new Date());
        })
        .then(function(details) {
            if (!details) {
                // User canceled (or error)
                //
                $ionicBackdrop.release();
                return;
            }

            // Let user see what they've got.
            //
            // Note: should be using state parameters instead of root scope.
            //
            $rootScope.caprev_picurl = upicurl
            $rootScope.caprev_date = Dateforms.html5_string(details.date);
            $rootScope.caprev_comment = details.comment;
            $state.go('tab.capreview');
            $ionicBackdrop.release();

            // Meanwhile in pseudo-background, create journal entry and
            // clean up.
            //
            var rpicurl;
            var entry = {};
            entry.date = Dateforms.html5_string(details.date);
            entry.comment = details.comment;

            image_dims_p(upicurl)
            .then(function(wdht) {
                var width = wdht[0];
                var height = wdht[1];
                var resizewd, resizeht;
                if (width > height) {
                    resizewd = Entryimg.MEDLENGTH;
                    resizeht = 1e9;
                } else {
                    resizewd = 1e9;
                    resizeht = Entryimg.MEDLENGTH;
                }
                return Resize.resized_pic_p(upicurl, resizewd, resizeht);
            })
            .then(function(rpu) {
                rpicurl = rpu;
                return FileIO.read_array_buffer_p(rpicurl);
            })
            .then(function(buf) {
                entry[Entryimg.MEDNAME] = new Uint8Array(buf);
                return Entries.add(entry);
            })
            .then(function() {
                return FileIO.delete_p(rpicurl);
            });
        })
    }
    function nopic() {
        // User cancelled. Go back to current state.
        //
        $ionicBackdrop.release();
    }
    $scope.getPicture = function() {
        var opts = {
            destinationType: Camera.DestinationType.FILE_URI,
            correctOrientation: true
        };
        $ionicBackdrop.retain();
        navigator.camera.getPicture(yespic, nopic, opts);
    };
})

.controller('CapReviewCtrl', function($rootScope, $scope) {
    $scope.newentry = {};
    $scope.newentry.picurl = $rootScope.caprev_picurl;
    $scope.newentry.date = $rootScope.caprev_date;
    $scope.newentry.comment = $rootScope.caprev_comment;
    $scope.$on("$destroy", function() {
        // Clean up original camera image when exiting this page.
        //
        navigator.camera.cleanup(
            function yesCleanup() {},
            function noCleanup() {}
        );
    });
})

.controller('ReviewCtrl', function($scope, Entries, Entryimg) {
    $scope.EIURL = Entryimg.url;
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
