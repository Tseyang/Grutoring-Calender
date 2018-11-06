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

//necessary to make sure dates work
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
			testState: []
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
	}

	constructFirebaseEntry(json, grutor){
		// function to construct Firebase course entry
		var name = json["course"].substr(0, json["course"].indexOf(" "));
		var course = {};
		console.log(json)
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
			this.setState({
				classInfo: grutorInfo
			}, function(){
			})
		})
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
				// set state whenever snapshot changes
				this.setState({
					classes: enrolledClasses,
					grutorClasses: grutoringClasses
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

	displayData() {
	var userData = this.state.testState.map((item) => {
		return (
			<li key={item.id}>{item.classes[0]}
			</li>
		)});
	return userData;
	}

  	componentDidMount(){
    	auth.onAuthStateChanged((user) => {
      	if(user){
			const usersRef = firebase.database().ref("Users"); 
			usersRef.once('value', (snapshot) => {
				console.log(snapshot.val());
				let items = snapshot.val();
    			let newState = [];
    			for (let item in items) {
					newState.push({
						id: item,
						class: items[item].classes,
						grutorClassses: items[item].grutorClasses
					});
				}
          	this.setState({
              	current_user: user,
          	}, this.setCourses);
		  })
		}
    	});
  	}

	// toggles the display of the add course overlay
  	togglePopup(){
    	this.setState({
        	showPopup: !this.state.showPopup
    	});
  	};

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
							{this.state.current_user ?
							<div>
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
							</div>
							:
							<div>
								<h1>No classes for a non-logged in user.</h1>
							</div>
							}
			
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