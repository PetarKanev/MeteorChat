import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  // code to run on server at startup

	ChatRooms = new Meteor.Collection("chatrooms");  
	GeneralChat = new Meteor.Collection("genChat");

  Meteor.methods({
        doesUserExist(name) {
        return Accounts.findUserByUsername(name) != null;
        }
	});

  	/*Meteor.publish("users", function () {
          var self = this;
          var handle = Meteor.users.find({}, {
            fields: {username: 1}
          }).observeChanges({
            added: function (id, fields) {
              self.added('collections', id, fields);
            },
            changed: function (id, fields) {
              self.changed('collections', id, fields);
            },
            removed: function (id) {
              self.removed('collections', id);
            }
          });

          self.ready();

          self.onStop(function () {
            handle.stop();
          });

        });
    */

  	Meteor.publish('allUsers', function() {
		return Meteor.users.find();
	});

  	ChatRooms.allow({
        'insert':function(userId,doc){
            return true;
        },
        'update':function(userId,doc,fieldNames, modifier){
            return true;
        },
        'remove':function(userId,doc){
            return false;
        }
    }); 

    Meteor.publish("chatrooms",function(){
    return ChatRooms.find({});
	});

    // NOT FUNCTIONAL YET 
	Meteor.publish("genChat",function(){
    return GeneralChat.find({});
	});

	Meteor.publish("onlineUsers",function(){
	    return Meteor.users.find({"status.online":true},{username:1});
	})


});
