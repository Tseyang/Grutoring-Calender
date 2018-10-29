import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

import firebase,  { auth, provider } from "./firebase.js";

import Navbar from './Navbar.js';
import ClassPopUp from './AddClassPopUp';

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
    this.togglePopup = this.togglePopup.bind(this);
    this.addCourse = this.addCourse.bind(this);
    this.logout = this.logout.bind(this);
  }

  // callback function for adding a course using overlay
  addCourse(course){
    console.log(course);
    var json = course;
    document.getElementById("course-info").textContent = JSON.stringify(json, undefined, 2);

    //json as this.state
    const usersRef = firebase.database().ref("users");
    const currentUser = this.state.current_user;

    if(json["role"] === "grutor"){
        // grutor logic
        var course = {};
        course[json["course"].substr(0, json["course"].indexOf(" "))] = {
                location: json["location"],
                startTime: json["startTime"],
                endTime: json["endTime"],
                startDate: json["date"]
            }
        // console.log(this.state.current_user);
        usersRef.child(currentUser.displayName).child("grutorClasses").set(course);
    } else {
        // add to classes child in Firebase
        var course = {
            title: json["course"]
        }
        usersRef.child(currentUser.displayName).child("classes").set(course);
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

  componentDidMount(){
    auth.onAuthStateChanged((user) => {
      if(user){
          this.setState({
              current_user: user,
          });
      }
    });
    // Using HyperSchedule backend to load API
    URL = "https://hyperschedule.herokuapp.com/api/v2/all-courses"
    fetch(URL).then(results => {
        return results.json();
    }).then(data => {
        var HMcourses = data["courses"].filter(function(course) {return course["school"] === "HM";});
        this.setState({
            courses: HMcourses
        })
    })
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
