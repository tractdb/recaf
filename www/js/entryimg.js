// entryimg.js     Images in entries
//
angular.module('recaf.entryimg', [ 'ionic' ])

.factory('Entryimg', function() {
    var MEDNAME = 'medpic.jpg';

    return {
        MEDLENGTH:
            // Longest dim of medium sized image (480 x 640, 640 x 480).
            640,
        MEDNAME:
            // Attachment name of medium sized image.
            //
            MEDNAME,
        url:
            // Return the URL of a good image for the given journal
            // entry. For now we return 'medpic.jpg' if present,
            // otherwise any JPEG image we can find.
            //
            function(entry)
            {
                if (MEDNAME in entry && entry[MEDNAME].url)
                    return entry[MEDNAME].url;
                for (p in entry)
                    if (p.search(/\.jpg$/) >= 0 && entry[p].url)
                        return entry[p].url;
                return 'nosuch.jpg'; 
            }
    };
})
