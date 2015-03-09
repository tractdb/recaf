angular.module('starter.services', [])


/* This service manages journal entries as Couchbase Lite documents.
 */
.factory('Entries', function($q, $http) {
  // Remote DB for replication.
  //
  var RDBNAME =
      // Note: need to edit your username+password into this URL for
      // now. A login dialog is coming soon.
      //
      'http://USER:PASSWORD@slicer.cs.washington.edu:5984/' +
      'USER_tractdb';
  var LDBNAME = 'journal';
  var FULLPICNAME = 'fullpic.jpg';
  var cblurl = null;
  var db_is_initialized = false;
  var ddocs_are_initialized = false;
  var replication_prom = null;   // $http promise for replication

  function cblurl_p()
  {
    // Return a promise that resolves to the url for Couchbase Lite.
    //
    var def = $q.defer();
    if (cblurl) {
      def.resolve(cblurl);
    } else {
      if (!window.cblite) {
        var msg = 'Couchbase Lite init error: no window.cblite';
        console.log(msg);
        def.reject(msg);
      } else {
        window.cblite.getURL(function(err, url) {
          if (err) {
            def.reject(err);
          } else {
            cblurl = url;
            def.resolve(url);
          }
        });
      }
    }
    return def.promise;
  }

  function initdb_p(cblurl)
  {
    // Return a promise to initialize the journal DB. The promise
    // resolves to the URL of the DB.
    // 
    var dburl = cblurl + LDBNAME;

    if (db_is_initialized) {
        var def = $q.defer();
        def.resolve(dburl);
        return def.promise;
    }

    return $http.put(dburl)
    .then(function good(resp) {
            db_is_initialized = true;
            return dburl;
          },
          function bad(resp) {
            if (resp.status == 412) {
              db_is_initialized = true;
              return dburl; // Not really bad: DB exists already.
            } else {
              var msg = 'DB creation failed, status: ' + resp.status
              throw new Error(msg);
            }
          }
      );
  }

  function initddocs_p(dburl)
  {
    // Return a promise to create some design documents in the DB. The
    // promise resolves to the URL of the DB.
    // 
    if (ddocs_are_initialized) {
        var def = $q.defer();
        def.resolve(dburl);
        return def.promise;
    }

    var ddocs = {
        language: 'javascript',
        views: {
            entries: {
                map:
                    "function(doc) { " +
                        "if (doc.type == 'entry') emit(doc.date, doc); " +
                    "}"
            }
        },
        filters: {
            keepsecrets:
                "function(doc) { " +
                    "if (doc._id.search(/^_design\\//) >= 0) " +
                        "return false; " +
                    "return !doc.comment || " +
                            "doc.comment.search(/secret/i) < 0; " +
                "}"
        }
    };

    // Delete any existing design documents and create new ones. That
    // way we know for sure what they are.
    //
    var ddocsurl = dburl + '/_design/ddocs';
    return $http.get(ddocsurl)
    .then(
        function exists(resp) {
            var ddocsrevurl = ddocsurl + '?rev=' + resp.data._rev;
            return $http.delete(ddocsrevurl);
        },
        function nosuch(resp) { return resp; } // Just continue, no delete
    )
    .then(function(_) {
        return $http.put(ddocsurl, ddocs);
    })
    .then(
        function good(resp) {
            ddocs_are_initialized = true;
            return dburl;
        },
        function bad(resp) {
            console.log('initddocs_p error:', resp.status);
            return dburl;
        }
    );
  }

  function init_p()
  {
    // Create the DB if necessary, resolving to its URL.
    //
    return cblurl_p().then(initdb_p).then(initddocs_p);
  }

  function fullPicURL(dburl, entryId)
  {
    // Return the URL of the full-size picture for entry with the given
    // id.
    //
    return dburl + '/' + entryId + '/' + FULLPICNAME;
  }

  function base64_decode(s)
  {
    // Decode a base64 string, returning a Uint8Array.
    //
    var length = s.length;
    while (length > 0 && s[length - 1] == '=') length--;

    var res = new Uint8Array(Math.floor(length * 6 / 8));
    var resix = 0;
    var bits = 0, bitct = 0;
    for(var i = 0; i < length; i++) {
        bits = bits << 6;
        var code = s.charCodeAt(i);
        if (code >= 65 && code <= 90) bits += code - 65;
        else if (code >= 97 && code <= 122) bits += code - 71;
        else if (code >= 48 && code <= 57) bits += code + 4;
        else if (code == 43) bits += 62;
        else if (code == 47) bits += 63;
        bitct += 6;
        while (bitct >= 8) {
            res[resix++] = (bits >> (bitct - 8)) & 0xFF;
            bitct -= 8;
        }
        bits &= 0x3F;  // At most 6 good bits remain
    }
    return res;
  }

  function docarray_of_docrows(rows)
  {
    // (Caller warrants that the rows are sorted into the desired
    // order.)
    //
    var docarray = [];

    rows.forEach(function(r) {
        var entry = {};
        entry.id = r.value._id;
        for (p in r.value) 
            if (p != '_id')
                entry[p] = r.value[p];
        docarray.push(entry);
    });
    return docarray;
  }

  return {
    fullPicURLFun: function() {
        // Return a promise for a function that calculates the fullsize
        // picture URL for an entry with a given id.
        //
        return init_p()
        .then(function(dburl) {
            return function(entryId) { return fullPicURL(dburl, entryId); };
        });
    },

    all: function() {
        // Return a promise for all the journal entries.
        //
        return init_p()
        .then(function(dburl) {
            var enturl = dburl + '/_design/ddocs/_view/entries';
            enturl += '?descending=true';  // Most recent first.
            return $http.get(enturl);
        })
        .then(
            function good(response) {
                return docarray_of_docrows(response.data.rows);
            },
            function bad(response) {
                var msg = 'Error retrieving entries: ' + response.statusText;
                throw new Error(msg);
            }
        );
    },

    get: function(entryId) {
        // Return a promise for the specified document.
        //
        return init_p()
        .then(function(dburl) {
            return $http.get(dburl + '/' + entryId);
        })
        .then(function(response) {
            response.data.id = response.data._id; // Expose _id as id
            return response.data;
        });
    },

    add: function(entry) {
      // Return a promise to add the specified entry. The promise
      // resolves to null.
      // 
      // entry.pic is a base64 encoded image, which we make into an
      // attachment. (Don't save directly in the DB, it's big.)
      //
      var pic = entry.pic;
      var myentry = {}; // Everything but the pic
      myentry.type = 'entry';
      Object.getOwnPropertyNames(entry).forEach(function(p) {
          if (p != 'pic')
              myentry[p] = entry[p];
      });

      var dburl;

      return init_p()
      .then(function(u) {
        dburl = u;
        return $http.post(dburl, myentry);
      })
      .then(function(response) {
        return $http({
            method: 'PUT',
            url: fullPicURL(dburl, response.data.id),
            params: { rev: response.data.rev },
            data: base64_decode(pic),
            headers: { 'Content-Type': 'image/jpeg' },
            transformRequest: []  // Don't transform to JSON
        });
      })
      .then(function good(resp) {
              return null;
            },
            function bad(err) {
              throw err;
            }
      );
    },

    replicate: function() {
        // Return a promise to start a bidirectional replication
        // process. If replication is already in progress, just return
        // the existing promise. The promise resolves to null.
        //
        if (replication_prom)
            return replication_prom;
        // var pushspec = { source: LDBNAME, target: RDBNAME };
        var pushspec = { source: LDBNAME, target: RDBNAME, filter: 'ddocs/keepsecrets' };
        var pullspec = { source: RDBNAME, target: LDBNAME };
        replication_prom =
            init_p()
            .then(function(dburl) {
                var cblurl = dburl.replace(/[^/]*$/, "");
                var pushp, pullp;
                pushp = $http.post(cblurl + '/_replicate', pushspec);
                pullp = $http.post(cblurl + '/_replicate', pullspec);
                return $q.all([pushp, pullp]);
            })
            .then(
                function(ra) {
                    replication_prom = null;
                    return null;
                },
                function(err) {
                    console.log(err); // (Displays in debugger or device log.)
                    replication_prom = null;
                    return null;
                }
            );
        return replication_prom;
    },

    replicating: function() {
        // Return true if replication is in progress, false otherwise.
        //
        return !!replication_prom;
    }
  };
})
