angular.module('starter.controllers', [])

.controller('CaptureCtrl', function($scope) {
})

.controller('CaptureDetailCtrl', function($scope, $stateParams) {
})

.controller('ReviewCtrl', function($scope, Entries) {
  $scope.entries = Entries.all();
})

.controller('ReviewDetailCtrl', function($scope, $stateParams, Entries) {
  $scope.entry = Entries.get($stateParams.entryId);
})

.controller('SettingsCtrl', function($scope) {
});
