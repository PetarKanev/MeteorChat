import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';


// Client
if(Meteor.isClient){

    //Collections = new Mongo.Collection('collections');
    ChatRooms = new Meteor.Collection("chatrooms");
    GeneralChat = new Meteor.Collection("genChat");

    Tracker.autorun(function() {
        //Meteor.subscribe("users");
        Meteor.subscribe("chatrooms");
        Meteor.subscribe("genChat");
    });

    Deps.autorun(function(){
        Meteor.subscribe("allUsers");
        Meteor.subscribe("onlineUsers");
    });

    //Email verification
    Template.registerHelper('isVerified',function(){ 
      return Meteor.user().emails && Meteor.user().emails[0].verified; // look at the current user
    });


    /*Template.registerHelper('isVerified',function(){ 
      return this.emails && this.emails[0].verified; // we're in a user context
      else return Meteor.user().emails && Meteor.user().emails[0].verified; // look at the current user
    }); */

    // Easy Search 
    CollectionIndex = new EasySearch.Index({
    collection: Meteor.users,
    fields: ['username'],
    engine: new EasySearch.Minimongo()
    });

    Template.searchBox.helpers({
      collectionIndex: () => CollectionIndex
    });

    Template.searchBox.helpers({
        inputAttributes: () => {
        return {
            placeholder: 'Enter user name',
            type: 'text'
        };
       }
    });

    // Get all users, except currently logged in user
    Template.collections.helpers({
        collections: function(){
            return Meteor.users.find({_id: {$ne: Meteor.userId()}},
                {
                    sort: [
                        ["username", "asc"]
                    ]
                }
            );
        },
        online: function(){
            return Meteor.users.find({/*_id: {$ne: Meteor.userId()}, */ "status.online":true},
                {
                    sort: [
                        ["username", "asc"]
                    ]
                }
            );
        }
    });

	Template.register.onRendered(function(){
	    var validator = $('.register').validate({
		submitHandler: function(event){
            var username = $('[name=user]').val();
		    var email = $('[name=email]').val();
		    var password = $('[name=password]').val();
		    Accounts.createUser({
		        email: email,
                username: username,
		        password: password
		    }, function(error){
			if(error){
			    if(error.reason == "Email already exists."){
				validator.showErrors({
				    email: "That email already belongs to a registered user."   
				});

			    }
                Meteor.call('doesUserExist', username, function (err, result) {
                    if (err) {
                        alert('There is an error while checking username');
                    } else {
                        if (result === true) {

                            alert('A user with this username already exists!');
                                
                        }
                    }
                });
			}
 			else {
                    Meteor.logout();
		            Router.go("login");
		        }
		    });
		}    
	    });
	});

	Template.login.onRendered(function(){
        Session.clear();
        Meteor.logout();
	    var validator = $('.login').validate({
		submitHandler: function(event){
		    var username = $('[name=user]').val();
		    var password = $('[name=password]').val();
		    Meteor.loginWithPassword(username, password, function(error){
			if(error){
			    if(error.reason == "User not found"){
				validator.showErrors({
				    email: "That user does not exist."   
				});
			    }
			    if(error.reason == "Incorrect password"){
				validator.showErrors({
				    password: "You entered an incorrect password."    
				});
			    }
			}
			 else {
		            var currentRoute = Router.current().route.getName();
		            if(currentRoute == "login"){
		                Router.go("home");
		            }
		        }
		    });
		}
	    });
	});

	Template.login.onDestroyed(function(){
	    console.log("The 'login' template was just destroyed.");
	});

    Template.registerHelper("isEmpty", function (object) {
    return jQuery.isEmpty(object);
    });

       /* Template.searchBox.events({
          'click .collections': function () {
            // index instanceof EasySearch.Index
            CollectionIndex
            .getComponentMethods(/* optional name if specified on the components )
            .search(this.id);
            console.log("Click");
            ;
          }
        }); */

    // General chat events and helpers



    // ChatRooms events and helpers
    Template.collections.events({
        'click .collections':function(){
            Session.set('currentId',this._id);
            var res=ChatRooms.findOne({chatIds:{$all:[this._id,Meteor.userId()]}});
            if(res)
            {
                //already room exists
                Session.set("roomid",res._id);
                console.log("Room exists");
            }
            else{
                //no room exists
                var newRoom= ChatRooms.insert({chatIds:[this._id , Meteor.userId()],messages:[]});
                Session.set('roomid',newRoom);
                console.log("Room created.");
            }
        }
    });

    Template.messages.helpers({
        'msgs':function(){
            var result=ChatRooms.findOne({_id:Session.get('roomid')});
            if(result){
              return result.messages;
            }
        }
    });

    Template.recent.helpers({
        'msgsAll':function(){
            var rooms = ChatRooms.find({chatIds: Meteor.user()._id});
            
            console.log(rooms);
            
            var results = rooms.fetch();

            if(results){
              return _.chain(results).pluck('messages').flatten().uniq().sortBy('-createdAt').value();
            }
        }
    }); 

    Template.input.events = {
      'keydown input#message' : function (event) {
        if (event.which == 13) { 
            if (Meteor.user())
            {
                  var name = Meteor.user().username;
                  var message = document.getElementById('message');
        
                  if (message.value !== '') {
                    var date = new Date()
                    var timestamp = moment(date).format("dddd, MMMM Do YYYY, h:mm:ss a");

                    var de=ChatRooms.update({"_id":Session.get("roomid")},{$push:{messages:{
                     name: name,
                     text: message.value,
                     createdAt: timestamp.toString()
                    }}});
                    document.getElementById('message').value = '';
                    message.value = '';
                  }
            }
            else
            {
               alert("login to chat");
               Router.go('login');
            }
        }
      }
    }
    // End ChatDemo methods
}

// Server
if(Meteor.isServer){
    Meteor.startup(function(){

        CollectionIndex = new EasySearch.Index({
        collection: Collections,
        fields: ['username'],
        engine: new EasySearch.Minimongo()
        });

    });
}

// Routes
Router.route('/register');
Router.route('/login');
Router.route('/account');
Router.route('/', {
    name: 'home',
    template: 'home'
});

// Router Config
Router.configure({
    layoutTemplate: 'main'
});


Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});

// Register
Template.register.events({
    'submit form': function(event){
        event.preventDefault();
    }
});

// Login
Template.login.events({
    'submit form': function(event){
        event.preventDefault();
    }
});


// Logout
Template.navigation.events({
    'click .logout': function(event){
        //event.preventDefault();
        Session.clear();
        Meteor.logout();
        Router.go('login');
    }
});

// Account Settings
Template.navigation.events({
    'click .account': function(event){
        event.preventDefault();
        Router.go('account');
    }
});


// Validator Defaults 
$.validator.setDefaults({
    rules: {
        email: {
            required: true,
            email: true
        },
        username: {
            required: true,
            minlength: 3
        },
        password: {
            required: true,
            minlength: 6
        }
    },
    messages: {
        email: {
            required: "You must enter an email address.",
            email: "You've entered an invalid email address."
        },
        username: {
            required: "Enter a username",
            minlength: "Your password must be at least {0} characters."
        },
        password: {
            required: "You must enter a password.",
            minlength: "Your password must be at least {0} characters."
        }
    }
});

Template.home.helpers({
    users: function () {
        return db.getCollection('users').find({});
    }
});















