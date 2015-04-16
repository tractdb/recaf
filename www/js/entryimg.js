// entryimg.js     Choose an image to represent a journal entry
//
angular.module('recaf.entryimg', [ 'ionic' ])

.factory('Entryimg', function() {
    var MEDNAME = 'medpic.jpg';

    return {
        url:
            function(entry) {
                // Return the URL of a good image for the given journal
                // entry. For now we return 'medpic.jpg' if present,
                // otherwise any JPEG image we can find.
                //
                if (MEDNAME in entry && entry[MEDNAME].url)
                    return entry[MEDNAME].url;
                for (p in entry)
                    if (p.search(/\.jpg$/) >= 0 && entry[p].url)
                        return entry[p].url;
                return 'nosuch.jpg'; 
            }
    };
})
