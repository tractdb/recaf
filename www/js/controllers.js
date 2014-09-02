angular.module('starter.controllers', [])

.controller('CaptureCtrl', function($rootScope, $scope, $state, Entries) {
    function yespic(pic) {
        $rootScope.capturedPicture = pic;
        $state.go('tab.capture-detail');
    }
    function nopic() {
        alert('no pic');
    }
    $scope.getPicture = function() {
        // (Ask for base64-encoded image representation.)
        //
        var opts = { destinationType: Camera.DestinationType.DATA_URL };
        navigator.camera.getPicture(yespic, nopic, opts);
    };
})

.controller('CaptureDetailCtrl', function($rootScope, $scope, $state, Entries) {
    function zpad(s) { return ('0' + s).substr(-2); }
    var now = new Date();
    var datestr = now.getFullYear() + '-' + zpad(now.getMonth() + 1) + '-' +
                  zpad(now.getDate()) + 'T' + zpad(now.getHours()) + ':' +
                  zpad(now.getMinutes()) + ':' + zpad(now.getSeconds());
    $scope.newEntry = {
        pic: $rootScope.capturedPicture,
        date: datestr,
        comment: ''
    };
    $scope.addPicture = function() {
        Entries.add($scope.newEntry);
        $state.go('tab.capture');
    };
    $scope.cancelPicture = function() {
        $state.go('tab.capture');
    }
})

.controller('ReviewCtrl', function($scope, Entries) {
  $scope.entries = Entries.all();
})

.controller('ReviewDetailCtrl', function($scope, $stateParams, Entries) {
  $scope.entry = Entries.get($stateParams.entryId);
})

.controller('SettingsCtrl', function($scope) {
});
