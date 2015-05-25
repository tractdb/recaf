// dateforms.js     Different formats for dates
//
angular.module('recaf.dateforms', [])

.factory('Dateforms', function() {
    return {
        html5_string:
            // Convert the date to a string giving local time for HTML5
            // input element.
            //
            function(date)
            {
                function zpad(s) { return ('0' + s).substr(-2); }
                var datestr = date.getFullYear() + '-' +
                              zpad(date.getMonth() + 1) + '-' +
                              zpad(date.getDate()) + 'T' +
                              zpad(date.getHours()) + ':' +
                              zpad(date.getMinutes()) + ':' +
                              zpad(date.getSeconds());
                return datestr;
            },
        html5_date:
            // Convert the local time string (as from HTML5 input
            // element) to a date.
            //
            // Note: in current JavaScript, 'new Date(str)' expects str
            // to be in UTC if it looks like ISO 8601. But we have an
            // ISO 8601 looking string for a local time. Hence the
            // complexity.
            //
            function(str)
            {
                var pcs = str.split(/[-Tt:]/);
                return new Date(pcs[0], pcs[1] - 1, pcs[2],
                                pcs[3], pcs[4], pcs[5]);
            }
    };
})
