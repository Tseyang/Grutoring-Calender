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


class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
		    current_user: null,
		    classes: [],
			classInfo: [],
			grutorClasses: [],
		    showPopup: false,
		    scrapedCourses: []
		};
		// logic for using offline json document for course listings
		var HMcourses = ScrapedCourses["courses"];
		for(let course in HMcourses){
		    var curr_course = HMcourses[course];
		    this.state.scrapedCourses.push(curr_course);
		}
		this.togglePopup = this.togglePopup.bind(this);
		this.addCourse = this.addCourse.bind(this);
		this.logout = this.logout.bind(this);
		this.setCourses = this.setCourses.bind(this);
		this.removeCourse = this.removeCourse.bind(this);
	}

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
					startDate: json["date"]
			}
		} else {
			// add to classes child in Firebase
			course[name] = true; //can be replaced with actual data if we want it
		}
		return course
	}

	addToUsers(name, course_entry, grutor, currentUser){
		//add course to Users DB in Firebase
		const usersRef = firebase.database().ref("Users");
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

	// adds course/grutor to Classes DB in Firebase
	addToClasses(code, course_name, grutor, currentUser){
		classesRef.once("value").then(function(snapshot){
			if(!snapshot.hasChild(code)){
				var course = {}
				course[code] = course_name
				classesRef.child(code).set(course)
			}
			// add new grutor if not already present
			if(grutor && !snapshot.child(code).child("grutors").child(currentUser).exists()){
				var grutors = classesRef.child(code).child("grutors")
				var data = {}
				data[currentUser] = true; //can be replaced with actual data if we want it
				grutors.child(currentUser).set(data[currentUser]);
			}
		})
	}

	// callback function for adding a course using overlay
  addCourse(course){
	    var json = course;
	    document.getElementById("course-info").textContent = "Added course: " + JSON.stringify(json, undefined, 2);

	    //json
	    const currentUser = this.state.current_user.displayName;
		const grutor = json["role"] === "grutor";
		const course_name = json["course"].substr(json["course"].lastIndexOf("-")+1).trim()
		var course_entry = this.constructFirebaseEntry(json, grutor);
		var name = Object.keys(course_entry)[0];

		this.addToUsers(name, course_entry, grutor, currentUser);
		this.addToClasses(name, course_name, grutor, currentUser);
		this.setCourses();
  }

	// function for setting up grutoring info for classes that User is IN
	getGrutoringInfo(classes){
		const usersRef = firebase.database().ref("Users");
		var grutorInfo = [];
		var usersSnapshot;
		// capture users Table
		usersRef.on("value", (snapshot) => {
			usersSnapshot = snapshot;
		})

		classesRef.on("value", (snapshot) => {
			if(usersSnapshot !== null){
				classes.forEach(function(classCode){
					// get grutors for this class
					var grutors = snapshot.child(classCode).child("grutors");
					if(grutors.exists()){
						grutors.forEach(function(grutorName){
							var obj = {};
							obj[classCode] = usersSnapshot.child(grutorName.key).child("grutorClasses").child(classCode).val();
							obj[classCode]["grutor"] = grutorName.key;
							grutorInfo.push(obj);
						})
					}else{
						var obj = {};
						obj[classCode] = "No grutors for this class";
						grutorInfo.push(obj);
					}
				});
			}else{
				grutorInfo = [];
			}
			// set state whenever snapshot changes
			this.setState({
				classInfo: grutorInfo
			}, function(){
				document.getElementById("firebase-classes-info").textContent = "Class info: " + JSON.stringify(this.state.classInfo, undefined, 2);
			})
		})
	}


	// function to display courses from Firebase
	setCourses(){
		const currentUser = this.state.current_user.displayName;
		const userRef = firebase.database().ref("Users"+"/"+currentUser);
		// get snapshot of user's entry in Firebase
		userRef.on('value', (snapshot) => {
			if(snapshot.exists()){
				var enrolledClasses = [];
				var grutorClasses = [];
				var classInfo = [];
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
						grutorClasses.push(obj);
					}
				}
			}
			// set state whenever snapshot changes
			this.setState({
				classes: enrolledClasses,
				grutorClasses: grutorClasses
			}, function(){
				// informative representation of data on webpage, can be deleted when not needed anymore
				document.getElementById("firebase-classes").textContent = "Classes: " + this.state.classes;
				document.getElementById("firebase-grutorClasses").textContent = "grutorClasses: " + JSON.stringify(this.state.grutorClasses, undefined, 2);
			})
		})
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
    	});
  	}

	// toggles the display of the add course overlay
  	togglePopup(){
    	this.setState({
        	showPopup: !this.state.showPopup
    	});
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
	                />
	            </Row>
	            <div className="body">
	                <Row vertical='center'>
	                  	<Column flexGrow={1} horizontal='center'>
		                    <h1>Class List</h1>
							{this.state.classes ?
								<CheckboxGroup
			                      	checkboxDepth={3} // This is needed to optimize the checkbox group
			                      	id="enrolledClasses"
			                      	value={this.state.classes}
			                      	onChange={this.classesChanged}>
									{this.state.classes.map((enrolledClass) => {
										return(
											<div key={enrolledClass}>
												<label key={enrolledClass}><Checkbox value={enrolledClass} key={enrolledClass}/>{enrolledClass}<br></br></label>
												<button onClick={() => this.removeCourse(enrolledClass,false)}>Remove class</button>
											</div>
										)
									})}
			                    </CheckboxGroup>
								:
								null
							}
							<h1>Grutoring List</h1>
							{this.state.grutorClasses ?
								<CheckboxGroup
			                      	checkboxDepth={3} // This is needed to optimize the checkbox group
			                      	id="grutorClasses"
			                      	value={this.state.grutorClasses}
			                      	onChange={this.classesChanged}>
									{this.state.grutorClasses.map((grutorClass) => {
										var classCode = Object.keys(grutorClass)[0];
										return(
											<div key={classCode}>
												<label key={classCode}><Checkbox value={classCode} key={classCode}/>{classCode}<br></br></label>
												<button onClick={() => this.removeCourse(classCode,true)}>Remove class</button>
											</div>
										)
									})}
			                    </CheckboxGroup>
								:
								null
							}
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
	                      	localizer={localizer}
	                      	events={[]}
	                      	startAccessor="startDate"
	                      	endAccessor="endDate"
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