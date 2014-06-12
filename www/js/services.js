angular.module('starter.services', [])

/**
 * A simple example service that returns some data.
 */
.factory('Entries', function() {
  // Might use a resource here that returns a JSON array

  // Some fake testing data
  var entries = [
    { id: 0, name: 'Lunch' },
    { id: 1, name: 'Breakfast' },
    { id: 2, name: 'Dessert' },
    { id: 3, name: 'Dinner' }
  ];

  return {
    all: function() {
      return entries;
    },
    get: function(entryId) {
      // Simple index lookup
      return entries[entryId];
    }
  }
});
