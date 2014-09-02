angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Entries', function() {
  var entries = [
  ];

  return {
    all: function() {
      return entries;
    },
    get: function(entryId) {
      return entries[entryId];
    },
    add: function(entry) {
      // TEMP
      console.log('new entry, date', entry.date);
      // TEMP
      entry.id = entries.length;
      entries.push(entry);
    }
  }
});
