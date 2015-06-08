// app.js     Recaf App
//

angular.module('recaf', ['ionic', 'recaf.controllers', 'recaf.entries'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the
    // accessory bar above the keyboard for form inputs)
    //
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  //
  $stateProvider

    // setup an abstract state for the tabs directive
    .state('tab', {
      url: "/tab",
      abstract: true,
      templateUrl: "templates/tabs.html"
    })

    // Each tab has its own nav history stack:
    .state('tab.capture', {
      url: '/capture',
      views: {
        'tab-capture': {
          templateUrl: 'templates/tab-capture.html',
          controller: 'CaptureCtrl'
        }
      }
    })

    .state('tab.capreview', {
      url: '/capreview',
      views: {
        'tab-capture': {
          templateUrl: 'templates/cap-review.html',
          controller: 'CapReviewCtrl'
        }
      }
    })

    .state('tab.review', {
      url: '/review',
      views: {
        'tab-review': {
          templateUrl: 'templates/tab-review.html',
          controller: 'ReviewCtrl'
        }
      }
    })

    .state('tab.review-detail', {
      url: '/review/:entryId',
      views: {
        'tab-review': {
          templateUrl: 'templates/review-detail.html',
          controller: 'ReviewDetailCtrl'
        }
      }
    })

    .state('tab.settings', {
      url: '/settings',
      views: {
        'tab-settings': {
          templateUrl: 'templates/tab-settings.html',
          controller: 'SettingsCtrl'
        }
      }
    })

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/capture');
});

