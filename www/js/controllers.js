angular.module('starter.controllers', [])

.controller('CaptureCtrl', function($scope) {
})

.controller('ReviewCtrl', function($scope, Friends) {
  $scope.friends = Friends.all();
})

.controller('ReviewDetailCtrl', function($scope, $stateParams, Friends) {
  $scope.friend = Friends.get($stateParams.friendId);
})

.controller('SettingsCtrl', function($scope) {
});
