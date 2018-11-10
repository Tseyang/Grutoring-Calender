import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

import firebase,  { auth, provider } from "./firebase.js";

import Navbar from './navbar.js';
import ClassPopUp from './AddClassPopUp';

import ScrapedCourses from "./courses.js";

import './css/App.css';
import './css/react-big-calendar.css';

const localizer = BigCalendar.momentLocalizer(moment)
const classesRef = firebase.database().ref("Classes");
const usersRef = firebase.database().ref("Users");

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
		    current_user: null,
		    classes: [], // info about classes user is in
			classInfo: [], // info about grutoring sessions for classes user is IN
			grutorClasses: [], // info about classes that user GRUTORS
		    showPopup: false,
		    scrapedCourses: [],
			usersSnapshot: null,
			courses: [],
			calendarGruteeEvents: [], // events display format of grutee events
			calendarGrutorEvents: [] // events display format of grutor events
		};
		// logic for using offline json document for course listings
		var HMcourses = ScrapedCourses["courses"];
		for(let course in HMcourses){
		    var curr_course = HMcourses[course];
		    this.state.scrapedCourses.push(curr_course);
		}

		// capture users Table
		usersRef.on("value", (snapshot) => {
			this.state.usersSnapshot = snapshot;
		})

		this.togglePopup = this.togglePopup.bind(this);
		this.addCourse = this.addCourse.bind(this);
		this.logout = this.logout.bind(this);
		this.setCourses = this.setCourses.bind(this);
		this.removeCourse = this.removeCourse.bind(this);
		this.getGrutoringInfo = this.getGrutoringInfo.bind(this);
		this.displayData = this.displayData.bind(this);
		this.mapGruteeEvents = this.mapGruteeEvents.bind(this);
		this.addIsChecked = this.addIsChecked.bind(this);
		this.getChecked = this.getChecked.bind(this);
	}

	addIsChecked(){
		let test = [];
		for(let event in this.state.classes){
			let obj = {value: this.state.classes[event], isChecked: false};
			test.push(obj);
			console.log(test);
		};
	};

	mapGrutorEvents(calendarGrutorEvents){
		var grutorClasses = calendarGrutorEvents.map((hour) => {
		return (
		  <label>{hour.title}<input type="checkbox" value=
		  {hour.title} checked ={hour.isChecked} onChange = {this.toggleClass.bind(this)}/> <br></br></label>)});
		return grutorClasses};

	mapGruteeEvents(){
		var gruteeClasses = this.state.classes.map((enrolledClass) => {
			return(
				<div key={enrolledClass.value}>
					<label>{enrolledClass.value}<input type="checkbox" value={enrolledClass.value} 
					checked ={enrolledClass.isChecked} onChange = {this.toggleGruteeClass.bind(this)}/> <br></br></label>
					<button key={enrolledClass.value+"_button"} value={enrolledClass.value} onClick={this.removeClass}>Remove class</button>
				</div>
			)
		})
		//  calendarGruteeEvents.map((hour) => {
		// 	console.log(this.state.tempClassList.indexOf(hour.title));
		// 	if(this.state.tempClassList.indexOf(hour.title) == -1){
		// 		console.log(this.state.tempClassList.includes(hour.title), "for", hour.title);
		// 		this.state.tempClassList.push(hour.title);
		// 		return (
		// 			<label>{hour.title}<input type="checkbox" value={hour.title} 
		// 			checked ={hour.isChecked} onChange = {this.toggleClass.bind(this)}/> <br></br></label>
		// 		)
		// 	}});
		console.log("made it to the end");
		return gruteeClasses;
	};

	
	toggleClass(event) {
		const title = event.target.value;
		for(let entry in this.state.calendarGrutorEvents){
			if (this.state.calendarGrutorEvents[entry].title === title){
				this.state.calendarGrutorEvents[entry].isChecked = !(this.state.calendarGrutorEvents[entry].isChecked);
			}
		}
		this.setState({calendarGrutorEvents: this.state.calendarGrutorEvents})
	}

	toggleGruteeClass(event) {
		const title = event.target.value;
		for(let entry in this.state.classes){
			if (this.state.classes[entry].value == title){
				this.state.classes[entry].isChecked = !(this.state.classes[entry].isChecked);
			}
		}
		this.setState({calendarGruteeEvents: this.state.calendarGruteeEvents})
	}

	eventList(calendarGrutorEvents){
		var newEvents = calendarGrutorEvents.filter(attr => {
		  return attr.isChecked === true;
		});
		  return newEvents
		  
		  };
	
	getChecked(className){
		for(let entry in this.state.classes){
			if(this.state.classes[entry].value == className){
				return this.state.classes[entry].isChecked
			}
		}
		return false;
	}

	eventListGrutee(calendarGruteeEvents){
	var newEvents = calendarGruteeEvents.filter(attr => {
		return this.getChecked(attr.title) === true;
	});
		return newEvents
		
		};

	constructFirebaseEntry(json, grutor){
		// function to construct Firebase course entry
		var name = json["course"].substr(0, json["course"].indexOf(" "));
		var course = {};
		if(grutor){
			// grutor logic
			course[name] = {
					location: json["location"],
					startTime: json["startTime"],
					endTime: json["endTime"],
					day: json["day"]
			}
		} else {
			// add to classes child in Firebase
			course[name] = true; //can be replaced with actual data if we want it
		}
		return course
	}

	addToUsers(name, course_entry, grutor, currentUser){
		//add course to Users DB in Firebase
		usersRef.once("value").then(function(snapshot){
			if(grutor){
				var grutorClasses = usersRef.child(currentUser).child("grutorClasses");
				if(!(snapshot.hasChild(currentUser) && snapshot.child(currentUser).hasChild("grutorClasses"))){
					// no user or no grutoring classes for this user yet
					grutorClasses.set(course_entry);
				}else{
					// update
					grutorClasses.child(name).set(course_entry[name]);
				}
			}else{
				var classes = usersRef.child(currentUser).child("classes");
				if(!(snapshot.hasChild(currentUser) && snapshot.child(currentUser).hasChild("classes"))){
					// no user or classes for this user yet
					classes.set(course_entry);
				}else{
					// update
					classes.child(name).set(course_entry[name]);
				}
			}
		})
	}

	addToClasses(code, course_name, grutor, currentUser){
		// adds course/grutor to Classes DB in Firebase
		classesRef.once("value").then(function(snapshot){
			if(!snapshot.hasChild(code)){
				var course = {[code]: course_name}
				classesRef.child(code).set(course)
			}
			// add new grutor if not already present
			if(grutor && !snapshot.child(code).child("grutors").child(currentUser).exists()){
				var grutors = classesRef.child(code).child("grutors")
				var data = {[currentUser]: true}
				grutors.child(currentUser).set(data[currentUser]);
			}
		})
	}

	// callback function for adding a course using overlay
  addCourse(course){
	    var json = course;

	    //json
	    const currentUser = this.state.current_user.displayName;
		const grutor = json["role"] === "grutor";
		const course_name = json["course"].substr(json["course"].lastIndexOf("-")+1).trim()
		var course_entry = this.constructFirebaseEntry(json, grutor);
		var name = Object.keys(course_entry)[0];

		this.addToUsers(name, course_entry, grutor, currentUser);
		this.addToClasses(name, course_name, grutor, currentUser);
  }

	// function for setting up grutoring info for classes that User is IN
	getGrutoringInfo(classes){
		classesRef.on("value", (snapshot) => {
			var grutorInfo = [];
			if(this.state.usersSnapshot !== null){
				for(let i in classes){
					var classCode = classes[i]
					// get grutors for this class
					var grutors = snapshot.child(classCode).child("grutors");
					if(grutors.exists()){
						var grutorJSON = grutors.toJSON();
						for(let grutorName in grutorJSON){
							var obj = {};
							obj[classCode] = this.state.usersSnapshot.child(grutorName).child("grutorClasses").child(classCode).val();
							obj[classCode]["grutor"] = grutorName.key;
							grutorInfo.push(obj);
						}
					}else{
						var obj = {};
						obj[classCode] = "No grutors for this class";
						grutorInfo.push(obj);
					}
				}
			}else{
				grutorInfo = [];
			}
			// set state whenever snapshot changes
			});
			this.parseGruteeEventsList(grutorInfo);
			this.setState({
				classInfo: grutorInfo
			}, function(){
			})
		})
	}

	// Helper function that parses grutorClasses obtained from Firebase into events
	// list to be displayed on calendar
	parseGrutorEventsList(grutorClasses) {

		// Initialize variable that events object uses
		var title = "";
		var start = "";
		var end = "";
		var isChecked = "";

		// Initiliaze variables that have to be stored for parsing
		var startDate = "";
		var startTime = "";
		var dateTimeStringStart = "";
		var endDate = "";
		var endTime = "";
		var dateTimeStringEnd = "";
		var tempEvents = [];

		// Iterate through every {} object in grutorInfo
		for(var i = 0; i < grutorClasses.length; i++) {
			var currentGrutorClassPropsObject = grutorClasses[i];
			// parse title from grutorClasses list
			title = Object.keys(grutorClasses[i])[0];

			//parse start date and time from grutorClasses list
			startDate = Object.values(Object.values(grutorClasses[i])[0])[2];
			startTime = Object.values(Object.values(grutorClasses[i])[0])[3];
			dateTimeStringStart = startDate + " " + startTime;
			start = new Date(moment(dateTimeStringStart, 'YYYY-MM-DD HH:mm'));

			// parse end date and time from grutorClasses list
			endDate = Object.values(Object.values(grutorClasses[i])[0])[2];
			endTime = Object.values(Object.values(grutorClasses[i])[0])[0];
			dateTimeStringEnd = endDate + " " + endTime;
			end = new Date(moment(dateTimeStringEnd, 'YYYY-MM-DD HH:mm'));

			isChecked = false;
			var obj = {
				title,
				start,
				end,
				isChecked
			}
			tempEvents.push(obj)
			this.setState({
				calendarGrutorEvents: tempEvents});
			// Now we update the current state to reflect changes in events displayed
			// on the calendar
		}
	}

	parseGruteeEventsList(classInfo) {

		// Initialize variable that events object uses
		var title = "";
		var start = "";
		var end = "";
		var isChecked = "";

		// Initiliaze variables that have to be stored for parsing
		var startDate = "";
		var startTime = "";
		var dateTimeStringStart = "";
		var endDate = "";
		var endTime = "";
		var dateTimeStringEnd = "";
		var tempEventsList = [];

		// Iterate through every {} object in grutorInfo
		for(var i = 0; i < classInfo.length; i++) {
			var currentGrutorClassPropsObject = classInfo[i];
			// parse title from grutorClasses list
			title = Object.keys(classInfo[i])[0];

			//parse start date and time from grutorClasses list
			startDate = Object.values(Object.values(classInfo[i])[0])[2];
			startTime = Object.values(Object.values(classInfo[i])[0])[3];
			dateTimeStringStart = startDate + " " + startTime;
			start = new Date(moment(dateTimeStringStart, 'YYYY-MM-DD HH:mm'));

			// parse end date and time from grutorClasses list
			endDate = Object.values(Object.values(classInfo[i])[0])[2];
			endTime = Object.values(Object.values(classInfo[i])[0])[0];
			dateTimeStringEnd = endDate + " " + endTime;
			end = new Date(moment(dateTimeStringEnd, 'YYYY-MM-DD HH:mm'));
			isChecked = false;

			var obj = {
				title,
				start,
				end,
				isChecked
			};

			tempEventsList.push(obj);
			}

		// Now we update the current state to reflect changes in events displayed
		// on the calendar
		this.setState({
			calendarGruteeEvents: tempEventsList
		});

	}


	// function to display courses from Firebase
	setCourses(){
		if(this.state.current_user === null){
			// no user logged in
			this.setState({
				classes: [],
				grutorClasses: []
			}, function(){
				document.getElementById("firebase-classes").textContent = "No user logged in.";
				document.getElementById("firebase-grutorClasses").textContent = "No user logged in.";
			})
		}else{
			const currentUser = this.state.current_user.displayName;
			const userRef = firebase.database().ref("Users"+"/"+currentUser);
			// get snapshot of user's entry in Firebase
			userRef.on('value', (snapshot) => {
				var enrolledClasses = [];
				var grutoringClasses = [];
				if(snapshot.exists()){
					// get classes for this user
					if(snapshot.hasChild("classes")){
						snapshot.child("classes").forEach(function(child){
							enrolledClasses.push(child.key)
						});
						this.getGrutoringInfo(enrolledClasses);
					}
					// get classes this user is grutoring for
					if(snapshot.hasChild("grutorClasses")){
						var data = snapshot.child("grutorClasses").val();
						for(let grutorClass in data){
							var obj = {};
							obj[grutorClass] = data[grutorClass];
							grutoringClasses.push(obj);
						}
					}
				}
				// Parse event title, startTime, and endTime for calendar display
				this.parseGrutorEventsList(grutorClasses);
				let withCheck = [];
				for(let event in enrolledClasses){
					let obj = {value: enrolledClasses[event], isChecked: false};
					withCheck.push(obj);
				};
				this.setState({
					classes: withCheck,
					grutorClasses: grutorClasses
				}, function(){
					
				})
			})
		}
	}

  	//logout function to be passed to navbar component
  	logout(){
      	auth.signOut().then(() => {
          	this.setState({
              	current_user: null
          	});
      	});
  	}

	// runs whenever component mounts
  	componentDidMount(){
    	auth.onAuthStateChanged((user) => {
      	if(user){
          	this.setState({
              	current_user: user,
          	}, this.setCourses);
		  }
		})
    	}
  	

	// toggles the display of the add course overlay
  	togglePopup(){
    	this.setState({
        	showPopup: !this.state.showPopup
    	});
  	}

	// function for removing course from Firebase
	removeClass(courseCode){
		// TODO: Implement functionality for removing class from Firebase on button click
		alert("Remove class functionality yet to be implemented");
	}

	// function for removing course from Firebase
	removeCourse(courseCode,isGrutor){
		if (isGrutor){
			const userRef = firebase.database().ref(`/Users/${this.state.current_user.displayName}/grutorClasses/${courseCode}`);
			const grutorRef = firebase.database().ref(`/Classes/${courseCode}/grutors/${this.state.current_user.displayName}`);
			grutorRef.remove()
				.then(function() {
					console.log("Remove succeeded.")
				})
				.catch(function(error) {
					console.log("Remove failed: " + error.message)
				});
			userRef.remove();
		}
		else{
			const userRef = firebase.database().ref(`/Users/${this.state.current_user.displayName}/classes/${courseCode}`);
			userRef.remove();
		}
	}

  	render() {
	    return (
	        <div>
	            <Row>
	                <Navbar
	                    logout={this.logout}
						current_user = {this.state.current_user}
	                />
	            </Row>
	            <div className="body">
	                <Row vertical='center'>
	                  	<Column flexGrow={1} horizontal='center'>
		                    <h1>Class List</h1>
							<form>
							{this.state.classes ?
								this.mapGruteeEvents(this.state.calendarGruteeEvents)
								:
								null
							}
							</form>
							<h1>Grutoring List</h1>
							<form>
							{ this.mapGrutorEvents(this.state.calendarGrutorEvents) } 
							</form>
							<h5>Data passed back from adding course:</h5>
		                    <pre id="course-info"></pre>
							<h5>Data passed back from Firebase regarding current user's classes:</h5>
							<pre id="firebase-classes"></pre>
							<h5>Data passed back from Firebase regarding grutoring hours of current user's classes:</h5>
							<pre id="firebase-classes-info">{this.state.classInfo.length === 0 ? "No information for classes" : null}</pre>
							<h5>Data passed back from Firebase regarding current user's grutoring duties:</h5>
							<pre id="firebase-grutorClasses"></pre>
	                  	</Column>
	                  	{this.state.current_user ?
		                  	<div>
		                      	<button onClick={this.togglePopup}>Add a class</button>
		                  	</div>
	                  		:
		                  	<div>
		                      	<p>You need to login to add classes.</p>
		                  	</div>
	                  	}
	                  	<Column flexGrow={1} horizontal='center'>
	                      	<BigCalendar
													selectable
								          localizer={localizer}
								          events={(this.eventList(this.state.calendarGrutorEvents)).concat(this.eventListGrutee(this.state.calendarGruteeEvents))}
								          defaultView={BigCalendar.Views.WEEK}
								          defaultDate={new Date(moment())}
	                    	/>
	                  	</Column>
	                </Row>
	            </div>
	            {this.state.showPopup ?
	                <ClassPopUp
	                    courses = {this.state.scrapedCourses}
	                    closePopup = {this.togglePopup}
	                    addCourse = {(course) => {this.addCourse(course)}}/>
	                :
	                null
	            }
	        </div>
	  	);
	}
};

export default App