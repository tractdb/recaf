// resize.js     Resize images using the com.synconset.imageResizer plugin
//
// A promise interface that works around some bugs in the plugin.
//
angular.module('recaf.resize', [ 'ionic' ])

.factory('Resize', function($q) {
    return {
        resized_pic_p:
            function(pdata, width, height) {
                // Return a promise that resolves to a resized version
                // of pdata, a picture encoded as a base64 string. The
                // result is also a base64-encoded string. Either width
                // or height can be given as 0 to modify the other
                // dimension while retaining the aspect ratio.
                //
                // Currently the result is always a JPEG image.
                //
                // This code depends on the ImageResizer plugin.
                //
                var opts = {
                    imageType: 'base64Image', // Type of pdata
                    format: 'jpg',
                    pixelDensity: false // Workaround for bug in imageresize.js
                };
                var def = $q.defer();
                window.imageResizer.resizeImage(
                    function good(res) { def.resolve(res.imageData); },
                    function bad(err) { def.reject(new Error(err)); },
                    pdata, width, height, opts
                );
                return def.promise;
            }
    };
})
