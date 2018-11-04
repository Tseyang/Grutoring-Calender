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

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
		    current_user: null,
		    classes: ['CS81','CS70', 'CS121', 'CS105', 'CS60'],
		    showPopup: false,
		    courses: []
		};
		// logic for using offline json document for course listings
		var HMcourses = ScrapedCourses["courses"];
		for(let course in HMcourses){
		    var curr_course = HMcourses[course];
		    this.state.courses.push(curr_course);
		}
		this.togglePopup = this.togglePopup.bind(this);
		this.addCourse = this.addCourse.bind(this);
		this.logout = this.logout.bind(this);
	}

	constructFirebaseEntry(json, grutor){
		// function to construct Firebase course entry
		var name = json["course"].substr(0, json["course"].indexOf(" "));
		if(grutor){
			// grutor logic
			var course = {};
			course[name] = {
					location: json["location"],
					startTime: json["startTime"],
					endTime: json["endTime"],
					startDate: json["date"]
			}
		} else {
			// add to classes child in Firebase
			var course = {};
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

	addToClasses(code, course_name, grutor, currentUser){
		// adds course/grutor to Classes DB in Firebase
		const classesRef = firebase.database().ref("Classes");
		classesRef.once("value").then(function(snapshot){
			// add course entry if its not there
			if(!snapshot.hasChild(code)){
				var course = {}
				course[code] = course_name
				classesRef.child(code).set(course)
			}
			// add new grutor if not already present
			if(grutor && !(snapshot.child(code).hasChild("grutors") && snapshot.child(code).child(grutors).hasChild(currentUser))){
				var grutors = classesRef.child(code).child("grutors")
				var data = {}
				data[currentUser] = true; //can be replaced with actual data if we want it
				grutors.child(currentUser).set(data[currentUser]);
			}
		})
	}

  	addCourse(course){
		// callback function for adding a course using overlay
	    var json = course;
	    document.getElementById("course-info").textContent = JSON.stringify(json, undefined, 2);

	    //json
	    const currentUser = this.state.current_user.displayName;
		const grutor = json["role"] === "grutor";
		const course_name = json["course"].substr(json["course"].lastIndexOf("-")+1).trim()
		var course_entry = this.constructFirebaseEntry(json, grutor);
		var name = Object.keys(course_entry)[0];

		this.addToUsers(name, course_entry, grutor, currentUser);
		this.addToClasses(name, course_name, grutor, currentUser);
  	}

  	//logout function to be passed to navbar component
  	logout(){
      	auth.signOut().then(() => {
          	this.setState({
              	current_user: null
          	});
      	});
  	}

  	componentDidMount(){
    	auth.onAuthStateChanged((user) => {
      	if(user){
          	this.setState({
              	current_user: user,
          	});
      	}
    	});
  	}

  	togglePopup(){
    	this.setState({
        	showPopup: !this.state.showPopup
    	});
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
	                    <CheckboxGroup
	                      checkboxDepth={2} // This is needed to optimize the checkbox group
	                      name="classes"
	                      value={this.state.classes}
	                      onChange={this.classesChanged}>

	                      <label><Checkbox value="CS81"/> CS81</label>
	                      <br></br>
	                      <label><Checkbox value="CS70"/> CS70</label>
	                      <br></br>
	                      <label><Checkbox value="CS121"/> CS121</label>
	                      <br></br>
	                      <label><Checkbox value="CS105"/> CS105</label>
	                      <br></br>
	                      <label><Checkbox value="CS60"/> CS60</label>

	                    </CheckboxGroup>
	                    <pre id="course-info"></pre>
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
	                    courses = {this.state.courses}
	                    closePopup = {this.togglePopup}
	                    addCourse = {(course) => {this.addCourse(course)}}/>
	                :
	                null
	            }
	        </div>
	  	);
	}

	classesChanged = (newClasses) => {
	  	this.setState({
	    	classes: newClasses
	  	});
	}
};

export default App
