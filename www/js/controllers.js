angular.module('starter.controllers', [])

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
        cordova.plugins.Keyboard.close();
        Entries.add($scope.newEntry);
        $state.go('tab.capture');
    };
    $scope.cancelPicture = function() {
        cordova.plugins.Keyboard.close();
        $state.go('tab.capture');
    }
})

.controller('ReviewCtrl', function($scope, Entries) {
  Entries.fullPicURLFun()
  .then(function(fpufn) {
      $scope.fullPicURL = fpufn;
      return Entries.all();
  })
  .then(function(es) { $scope.entries = es; });
})

.controller('ReviewDetailCtrl', function($scope, $stateParams, Entries) {
  Entries.fullPicURLFun()
  .then(function(fpufn) {
      $scope.fullPicURL = fpufn;
      $scope.entryId = $stateParams.entryId;
      return Entries.get($stateParams.entryId);
    })
  .then(function(e) { $scope.entry = e; });
})

.controller('SettingsCtrl', function($scope) {
})
