/*
 * Author: Tse Yang Lim
 * Desc: Component of popup form for adding a class
 */

import React, { Component } from 'react';
import CourseMenu from './CourseMenu';

class ClassPopUp extends Component {
    constructor(props){
        super(props);
        //expect functions addCourse (callback for form contents) and closePopup from parent App.js
        //courses are courses that were scraped and processed in parent App.js
        this.state = {
            grutor: false,
            courses: props.courses,
            formValues: {
                course: "",
                grutor: false,
                location: null,
                day: null,
                startTime: null,
                endTime: null,
            },
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.toggleGrutor = this.toggleGrutor.bind(this);
        this.toggleStudent = this.toggleStudent.bind(this);
    }

    toggleGrutor(){
        this.setState({
            grutor: true
        });
    }

    toggleStudent(){
        this.setState({
            grutor: false
        });
    }

    /* function to handle submission of the form */
    handleSubmit(event){
        event.preventDefault();
        const data = new FormData(event.target);

    // helper function to display invalid input fields on addCourse form submission
    showInvalidInputError(validCourse, validTime){
      let error = "Following fields were invalid:";
      document.getElementById("error-header").textContent = error;
      if(!validCourse){
        document.getElementById("course-error").textContent = "Course Code and Name";
      }
      if(!validTime){
        document.getElementById("time-error").textContent = "Start and End times are invalid"
      }
    }

    // helper function to validate time inputs for addCourse form submission
    validateTime(startTime, endTime){
      if(endTime > startTime){
        return true;
      }else{
        return false;
      }
    }

    handleSubmit(event){
        event.preventDefault();
        const data = new FormData(event.target);
        let validCourse = false;
        let validTime = false;
        // access FormData fields with 'data.get(fieldName)'
        var newState = {};
        if(data.get("role") === "grutor"){
            newState = {
                location: data.get("location"),
                day: data.get("day"),
                startTime: data.get("startTime"),
                endTime: data.get("endTime")
            }
            if(this.validateTime(newState["startTime"],newState["endTime"])){
              validTime = true;
            }
        }else{
          // set time to true for student
          validTime = true;
        }
        newState["course"] = data.get("course");
        newState["role"] = data.get("role");

        let validCourses = new Set();
        this.state.courses.map((course) => {
            var course_code = course["course_code"].substr(0, course["course_code"].lastIndexOf(" ")) + " - " +  course["course_name"];
            validCourses.add(course_code);
        })

        if(validCourses.has(newState["course"])){
          validCourse = true;
        }

        if(validCourse && validTime){
          document.getElementById("error-header").textContent = "";
          document.getElementById("course-error").textContent = "";
          document.getElementById("time-error").textContent = "";
          this.setState({formValues: newState}, function() {
              this.props.addCourse(this.state.formValues);
              this.props.closePopup();
          })
        }else{
          this.showInvalidInputError(validCourse, validTime);
        }
    }

    render(){
        return(
            <div className="class-popup">
                <div className="class-popup-inner">
                    <form onSubmit={this.handleSubmit}>
                        <div id="error-container"><p id="error-header"></p><p id="course-error"></p><p id="time-error"></p></div>
                        <CourseMenu courses={this.state.courses} />
                        <input type="radio" name="role" value="student" onClick={this.toggleStudent} required></input> Student
                        <input type="radio" name="role" value="grutor" onClick={this.toggleGrutor} required></input> Grutor
                        <div>
                            {this.state.grutor ?
                                <div id="grutor-fields">
                                    Location: <input type="text" name="location" required></input><br/>
                                    Day:
                                    <select name="day" required>
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select><br/>
                                    Start time: <input type="time" name="startTime" required></input><br/>
                                    End time: <input type="time" name="endTime" required></input>
                                </div>
                                :
                                null
                            }
                        </div>
                        <input type = "submit" />
                    </form>
                    <button onClick={this.props.closePopup}>Back</button>
                </div>
            </div>
        )
    }
}

export default ClassPopUp
