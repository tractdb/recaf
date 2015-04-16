angular.module('recaf.controllers',
    [ 'recaf.entryimg', 'recaf.login', 'recaf.resize', 'recaf.base64' ]
)

.controller('CaptureCtrl', function($rootScope, $scope, $state, Entries) {
    function yespic(pic) {
        $rootScope.capturedPicture = pic;
        $state.go('tab.capture-detail');
    }
    function nopic() {
    }
    $scope.getPicture = function() {
        // (Ask for base64-encoded image representation.)
        //
        var opts = { destinationType: Camera.DestinationType.DATA_URL };
        navigator.camera.getPicture(yespic, nopic, opts);
    };
})

.controller('CaptureDetailCtrl', function($rootScope, $scope, $state,
                                          Entries, Resize, Base64) {
    var MEDHEIGHT = 640; // Resized picture height (medium = 480 x 640)

    function zpad(s) { return ('0' + s).substr(-2); }
    var now = new Date();
    var datestr = now.getFullYear() + '-' + zpad(now.getMonth() + 1) + '-' +
                  zpad(now.getDate()) + 'T' + zpad(now.getHours()) + ':' +
                  zpad(now.getMinutes()) + ':' + zpad(now.getSeconds());

    $scope.newEntry = {
        fullpic: $rootScope.capturedPicture,
        date: datestr,
        comment: ''
    };
    $scope.addPicture = function() {
        cordova.plugins.Keyboard.close();

        // Make a local copy of the new entry.
        //
        var entry = {};
        for (p in $scope.newEntry) {
            if (p == 'fullpic')
                continue;
            entry[p] = $scope.newEntry[p];
        }

        // Note: we're not waiting for this promise to complete.
        //
        Resize.resized_pic_p($rootScope.capturedPicture, 0, MEDHEIGHT)
        .then(function(image) {
            entry['medpic.jpg'] = Base64.decode(image);
            Entries.add(entry);
        });

        $state.go('tab.capture');
    };
    $scope.cancelPicture = function() {
        $rootScope.capturedPicture = null;
        cordova.plugins.Keyboard.close();
        $state.go('tab.capture');
    }
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
