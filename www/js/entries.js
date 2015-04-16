// entries.js     Food journal entries as Couchbase Lite documents
//
angular.module('recaf.entries', [])

/* The following fields have a known meaning right now:
 *
 *   date:         Date of the entry, YYYY-MM-DD + 'T' + HH:MM:SS
 *   comment:      Comment string
 *   fullpic.jpg:  Bytes of JPEG from camera (iPhone5: 2448 x 3264)
 *   medpic.jpg:   Bytes of JPEG 480 x 640 
 *   id:           Unique identifier of the entry
 *
 * The JPEG fields of new entries are supplied as byte arrays. They are
 * changed into attachments with the same names. When the entry is
 * fetched later, the fields contain objects like this:
 *
 *   { url: 'url-of-attachment',
 *     content_type: 'mime-type',
 *     length: <length in bytes>
 *   }
 *
 * The id is created by this service, not supplied by callers. In fact
 * it's the CouchDB id of the document.
 *
 * Any other fields supplied by caller are preserved.
 */
.factory('Entries', function($q, $http) {
    var LDBNAME = 'journal';
    var RDBNAME = 'http://{USER}:{PASS}@tractdb.org/couch/{USER}_tractdb';
    var cblurl = null;
    var db_is_initialized = false;
    var ddocs_are_initialized = false;
    var replication_prom = null;   // $http promises for replication

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
                      var msg = 'DB creation failed, status: ' + resp.status;
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

        // Delete any existing design documents and create new ones.
        // That way we know for sure what they are.
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
        // Create and initialize the DB if necessary, resolving to its
        // URL.
        //
        return cblurl_p().then(initdb_p).then(initddocs_p);
    }

    function attachment_url(dburl, entryId, attachment)
    {
        // Return the URL of the given attachment.
        //
        return dburl + '/' + entryId + '/' + attachment;
    }

    function entry_of_response(dburl, resp)
    {
        // Transform a DB response into a journal entry.
        //
        var entry = {};
        for (var p in resp)
            if (p != '_id' && p != '_attachments')
                entry[p] = resp[p];
        entry.id = resp._id; // Expose internal _id as id
        if (resp._attachments) {
            for (var a in resp._attachments) {
                entry[a] = {};
                for (p in resp._attachments[a])
                    entry[a][p] = resp._attachments[a][p];
                entry[a].url = attachment_url(dburl, entry.id, a);
            }
        }
        return entry;
    }

    function entries_of_responserows(dburl, rows)
    {
        // (Caller warrants that the rows of the response are sorted
        // into the desired order.)
        //
        var docarray = [];

        rows.forEach(function(r) {
            docarray.push(entry_of_response(dburl, r.value));
        });
        return docarray;
    }

    return {
        all: function() {
            // Return a promise for all the journal entries.
            //
            var dburl;

            return init_p()
            .then(function(d) {
                dburl = d;
                var enturl = dburl + '/_design/ddocs/_view/entries';
                enturl += '?descending=true';  // Most recent first.
                return $http.get(enturl);
            })
            .then(
                function good(response) {
                    return entries_of_responserows(dburl, response.data.rows);
                },
                function bad(response) {
                    var msg = 'Error retrieving entries: ' +
                                response.statusText;
                    throw new Error(msg);
                }
            );
        },

        get: function(entryId) {
            // Return a promise for the specified document.
            //
            var dburl;

            return init_p()
            .then(function(d) {
                dburl = d;
                return $http.get(dburl + '/' + entryId);
            })
            .then(function(response) {
                return entry_of_response(dburl, response.data);
            });
        },

        add: function(entry) {
            // Return a promise to add the specified entry. The promise
            // resolves to null.
            // 
            // Recall that fields named *.jpg are JPEG image values
            // represented as byte arrays.
            //
            var images = [];  // Image fields [[name, bytes], ... ]
            var myentry = {}; // Everything but the images
            Object.getOwnPropertyNames(entry).forEach(function(p) {
                if (p.search(/\.jpg$/) >= 0)
                    images.push([p, entry[p]]);
                else
                    myentry[p] = entry[p];
            });
            myentry.type = 'entry';

            var dburl;

            function put_attachments_p(docid, docrev, i)
            {
                if (i >= images.length)
                    return null;
                return $http({
                    method: 'PUT',
                    url: attachment_url(dburl, docid, images[i][0]),
                    params: { rev: docrev },
                    data: images[i][1],
                    headers: { 'Content-Type': 'image/jpeg' },
                    transformRequest: []  // Don't transform to JSON
                })
                .then(function(resp) {
                    return put_attachments_p(docid, resp.data.rev, i + 1);
                });
            }

          return init_p()
          .then(function(u) {
            dburl = u;
            return $http.post(dburl, myentry);
          })
          .then(function(resp) {
            return put_attachments_p(resp.data.id, resp.data.rev, 0);
          })
          .then(function good(resp) {
                  return null;
                },
                function bad(resp) {
                  throw new Error('Error: status ' + resp.status);
                }
          );
        },

        replicate: function(loginfo) {
            // Return a promise to start a bidirectional replication
            // process. If replication is already in progress, just
            // return the existing promise. The promise resolves to
            // null.
            //
            // Caller provides an object giving the username and
            // password for the CouchDB server. Currently we assume that
            // the database name is {USER}_tractdb.
            //
            if (replication_prom)
                return replication_prom;
            if (!loginfo) {
                var def = $q.defer();
                def.resolve(null);
                return def.promise;
            }
            var rdbname = RDBNAME.replace(/{USER}/g, loginfo.username);
            rdbname = rdbname.replace(/{PASS}/g, loginfo.password);
            // var pushspec = { source: LDBNAME, target: rdbname };
            var pushspec = { source: LDBNAME, target: rdbname,
                             filter: 'ddocs/keepsecrets' };
            var pullspec = { source: rdbname, target: LDBNAME };
            replication_prom =
                init_p()
                .then(function(dburl) {
                    var cblurl = dburl.replace(/[^/]*$/, '');
                    var pushp, pullp;
                    pushp = $http.post(cblurl + '_replicate', pushspec);
                    pullp = $http.post(cblurl + '_replicate', pullspec);
                    return $q.all([pushp, pullp]);
                })
                .then(
                    function(ra) {
                        replication_prom = null;
                        return null;
                    },
                    function(resp) {
                        console.log('replication error, status ', resp.status);
                        replication_prom = null;
                        return null;
                    }
                );
            return replication_prom;
        },

        replicating: function() {
            // Return true if replication is in progress, false
            // otherwise.
            //
            return !!replication_prom;
        }
    };
})
