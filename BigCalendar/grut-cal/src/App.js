import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

import firebase,  { auth, provider } from "./firebase.js";

import Navbar from './Navbar.js';
import CourseMenu from './CourseMenu';

import './css/App.css';
import './css/react-big-calendar.css';

const localizer = BigCalendar.momentLocalizer(moment)

class ClassPopUp extends Component {
    constructor(props){
        super(props);
        //expect functions addCourse (callback for form contents) and closePopup
        console.log(props);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit(event){
        event.preventDefault();
        const data = new FormData(event.target);

        // access FormData fields with 'data.get(fieldName)'
        var course = data.get("course");
        this.props.addCourse(course);
        this.props.closePopup();
    }

    render(){
        return(
            <div className="class-popup">
                <div className="class-popup-inner">
                    <form onSubmit={this.handleSubmit}>
                        <CourseMenu />
                        <input type = "submit" />
                    </form>
                    <button onClick={this.props.closePopup}>Back</button>
                </div>
            </div>
        )
    }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        current_user: null,
        classes: ['CS81','CS70', 'CS121', 'CS105', 'CS60'],
        showPopup: false,
    };
    this.togglePopup = this.togglePopup.bind(this);
    this.addCourse = this.addCourse.bind(this);
  }

  // callback function for adding a course using overlay
  addCourse(course){
    var json = {
        courseCode: course.substr(0, course.indexOf(' ')),
        courseName: course.substr(course.indexOf(' ')+1)
    }
    document.getElementById("JSON-course-name").textContent = json.courseName;
    document.getElementById("JSON-course-code").textContent = "(" + json.courseCode + ")";
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
                <Navbar/>
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
                  </Column>
                  <div>
                      <button onClick={this.togglePopup}>Add a class</button>
                      <p>The class was: <span id="JSON-course-name"></span> <span id = "JSON-course-code"></span> </p>
                  </div>
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
