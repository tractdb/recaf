// resize.js     Resize images using the info.protonet.imageresizer plugin
//
angular.module('recaf.resize', [ 'ionic' ])

.factory('Resize', function($q) {
    return {
        resized_pic_p:
            function(picurl, width, height) {
                // Return a promise that resolves to the URL of a
                // resized version of picurl.
                //
                //  Either width or height can be specified as an
                //  absurdly large number, in which case it is set to a
                //  value that preserves the aspect ratio.
                //
                // Currently the result is always a JPEG image.
                //
                // This code depends on the info.protonet.imageresizer
                // plugin.
                //
                var opts = {
                    uri: picurl,
                    folderName: '', // Not used
                    quality: 85,    // Might try different qualities 0-100
                    width: width,
                    height: height
                };
                var def = $q.defer();
                window.ImageResizer.resize(
                    opts,
                    function good(url) {
                        def.resolve(url);
                    },
                    function bad() {
                        def.reject(new Error('Image resize failure'));
                    }
                );
                return def.promise;
            }
    };
})
