// annotate.js     Annotate captured photo to make new journal entry
//

function annotate_dialog_p(scope, $ionicModal)
{
    // Return a promise for an Ionic modal pane for getting annotations
    // from the user.
    //
    var opts = { scope: scope };
    return $ionicModal.fromTemplateUrl('templates/annotate.html', opts);
}


angular.module('recaf.annotate', [ 'ionic', 'recaf.dateforms' ])

.factory('Annotate', function($q, $ionicModal, Dateforms) {
    return {
        details_p:
            // Return promised annotations for a picture, as retrieved
            // from the user. The promise resolves to an object like
            // this:
            //
            //     { date: <JS Date object>, comment: '...' }
            //
            // The user can also cancel, in which case the promise
            // resolves to null.
            //
            function(scope, picurl, inidate) {
                // Note: we write some values named annotate_xxx into the
                // scope.
                //
                return annotate_dialog_p(scope, $ionicModal)
                .then(
                    function(modal) {
                        var def = $q.defer();
                        scope.annotate_picurl = picurl;
                        scope.annotate_info = {
                            date: Dateforms.html5_string(inidate),
                            comment: ''
                        };
                        scope.annotate_add = function() {
                            cordova.plugins.Keyboard.close();
                            modal.remove();
                            var ad = scope.annotate_info.date;
                            var info = {
                                date: Dateforms.html5_date(ad),
                                comment: scope.annotate_info.comment
                            };
                            def.resolve(info);
                        };
                        scope.annotate_cancel = function() {
                            cordova.plugins.Keyboard.close();
                            modal.remove();
                            def.resolve(null);
                        };
                        modal.show();
                        return def.promise;
                    },
                    function(err) {
                        // For now, treat failure as if user canceled.
                        //
                        return null;
                    }
                );
            }
    };
})
