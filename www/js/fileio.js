// fileio.js     Operations on local files
//
// This code depends on the plugin 'cordova-plugin-file'
//
angular.module('recaf.fileio', ['ionic'])

.factory('FileIO', function($q) {
    return {
        read_array_buffer_p:
            // Return a promise for a byte array to be read from the
            // given URL.
            //
            function(url)
            {
                var def = $q.defer();
                window.resolveLocalFileSystemURL(url,
                    function yesResolve(file_entry) {
                        file_entry.file(
                            function yesFile(file) {
                                var rdr = new FileReader();
                                rdr.onload = function(evt) {
                                    def.resolve(rdr.result);
                                }
                                rdr.onerror = function(evt) {
                                    var err = new Error(rdr.error.name);
                                    def.reject(err);
                                }
                                rdr.readAsArrayBuffer(file);
                            },
                            function noFile(err) {
                                def.reject(err);
                            }
                        );
                    },
                    function noResolve(err) {
                        def.reject(err);
                    }
                );
                return def.promise;
            },

        rename_p:
            // Return a promise to rename the file given by the URL to
            // the given new basename. The promise resolves to null.
            //
            function(url, newbase)
            {
                var def = $q.defer();
                var rsl = url.lastIndexOf('/');
                if (rsl < 0) {
                    def.reject(new Error('could not rename ' + url));
                    return def.promise;
                }
                var dirurl = url.substring(0, rsl);
                window.resolveLocalFileSystemURL(dirurl,
                    function yesResolveDir(dir_entry) {
                        window.resolveLocalFileSystemURL(url,
                            function yesResolveFile(file_entry) {
                                file_entry.moveTo(dir_entry, newbase,
                                    function yesMoveTo(nde) {
                                        def.resolve(null);
                                    },
                                    function noMoveTo(err) {
                                        def.reject(err);
                                    }
                                );
                            },
                            function noResolveFile(err) {
                                def.reject(err);
                            }
                        );
                    },
                    function noResolveDir(err) {
                        def.reject(err);
                    }
                );
                return def.promise;
            },

        delete_p:
            // Return a promise to delete the file given by the URL. The
            // promise resolves to null.
            //
            function(url)
            {
                var def = $q.defer();
                window.resolveLocalFileSystemURL(url,
                    function yesResolve(file_entry) {
                        file_entry.remove(
                            function yesRemove() { def.resolve(null); },
                            function noRemove(err) { def.reject(err); }
                        );
                    },
                    function noResolve(err) {
                        def.reject(err);
                    }
                );
                return def.promise;
            }
    };
})

