/*
 * Author: Tse Yang Lim
 * Desc: Component of popup form for adding a class
 */

import React, { Component } from 'react';
import CourseMenu from './CourseMenu';
import { TimePicker } from 'material-ui-pickers';
import { MuiPickersUtilsProvider } from 'material-ui-pickers';
import MomentUtils from '@date-io/moment';
import moment from 'moment';
import ClockIcon from '@material-ui/icons/Schedule';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import { withStyles } from '@material-ui/core/styles';
import Input from '@material-ui/core/Input';
import TextField from '@material-ui/core/TextField';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';



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
            selectedDate: null,
            selectedStart: null,
            day: '',
            location:'',
            value: "Student"

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

    handleDateChange = date => {
        this.setState({ selectedDate: date });
    };
    
    handleChangeStart = date => {
        this.setState({ selectedStart: date });
    };

    handleChangeDay = event => {
        this.setState({ day: event.target.value });
      };
    
    handleChangeLoc = event => {
        this.setState({
          location: event.target.value,
        });
      };
    
    handleChangeRadio = event => {
        this.setState({ value: event.target.value });
      };

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

    convertTime12to24(time12h) {
        const [time, modifier] = time12h.split(' ');
      
        let [hours, minutes] = time.split(':');
      
        if (hours === '12') {
          hours = '00';
        }
      
        if (modifier === 'PM') {
          hours = parseInt(hours, 10) + 12;
        }
      
        return hours + ':' + minutes;
      }

    // helper function to validate time inputs for addCourse form submission
    validateTime(startTime, endTime){
        console.log(startTime);
        console.log(this.convertTime12to24(endTime));
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
        console.log(data.get("testicle"))
        console.log(data.get("location"))
        console.log(this.state.location)
        if(this.state.value == "grutor"){
            newState = {
                location: this.state.location,
                day: this.state.day,
                startTime: this.convertTime12to24(data.get("startTime")),
                endTime: this.convertTime12to24(data.get("endTime"))
            }
            if(this.validateTime(newState["startTime"],newState["endTime"])){
              validTime = true;
            }
        }else{
          // set time to true for student
          validTime = true;
        }
        newState["course"] = data.get("course");
        newState["role"] = this.state.value;

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
                    <div className="formLayout" >
                    <form onSubmit={this.handleSubmit} id="formVertical" autoComplete = {false}>
                        <div id="error-container"><p id="error-header"></p><p id="course-error"></p><p id="time-error"></p></div>
                        <CourseMenu courses={this.state.courses} />
                        {/* <input type="radio" name="role" value="student" onClick={this.toggleStudent}></input> <br/> */}
                        {/* <Radio
                            checked={this.state.grutor === false}
                            onChange={this.toggleStudent}
                            value="studentRadio"
                            name="role"
                            labelPlacement="start"
                            label="Student"
                        /> */}
                        <FormControl component="fieldset" className="studentRadio">
                            <RadioGroup
                                aria-label="student"
                                name="student"
                                className="student"
                                value={this.state.value}
                                onChange={this.handleChangeRadio}
                            >
                                <FormControlLabel
                                value="student"
                                control={<Radio color="primary" />}
                                label="Student"
                                labelPlacement="start"
                                />
                            </RadioGroup>               
                        </FormControl>
                        <FormControl component="fieldset" className="grutorRadio">
                            <RadioGroup
                                aria-label="grutor"
                                name="grutor"
                                className="grutor"
                                value={this.state.value}
                                onChange={this.handleChangeRadio}
                            >
                                <FormControlLabel
                                value="grutor"
                                control={<Radio color="primary" />}
                                label="Grutor"
                                labelPlacement="start"
                                />
                            </RadioGroup>               
                        </FormControl> 
                        {/* <input type="radio" name="role" value="grutor" onClick={this.toggleGrutor} required></input> Grutor */}
                        <div>
                            {this.state.value == "grutor" ?
                                <div id="grutor-fields">
                                    {/* Location: <input type="text" name="location" required></input><br/> */}
                                    <TextField
                                        id="standard-name"
                                        label="Location"
                                        value={this.state.location}
                                        onChange={this.handleChangeLoc}
                                        margin="normal"
                                        /><br/>
                                    <FormControl className="formControlAddClass">
                                    <InputLabel htmlFor="age-simple">Day of the Week</InputLabel>
                                    <Select
                                        value={this.state.day}
                                        onChange={this.handleChangeDay}
                                        inputProps={{
                                            name: 'age',
                                            id: 'age-simple',
                                        }}
                                        name="age"
                                        classes={
                                            {root: 'classes-state-formcontrol'}
                                          }
                                        required
                                        >
                                        <MenuItem value="">
                                        <em>None</em>
                                        </MenuItem>
                                        <MenuItem value="Monday">Monday</MenuItem>
                                        <MenuItem value="Tuesday">Tuesday</MenuItem>
                                        <MenuItem value="Wednesday">Wednesday</MenuItem>
                                        <MenuItem value="Thursday">Thursday</MenuItem>
                                        <MenuItem value="Friday">Friday</MenuItem>
                                        <MenuItem value="Saturday">Saturday</MenuItem>
                                        <MenuItem value="Sunday">Sunday</MenuItem>
                                    </Select>
                                    </FormControl> <br/>
                                    {/* <select name="day" required>
                                        <option value="Monday">Monday</option>
                                        <option value="Tuesday">Tuesday</option>
                                        <option value="Wednesday">Wednesday</option>
                                        <option value="Thursday">Thursday</option>
                                        <option value="Friday">Friday</option>
                                        <option value="Saturday">Saturday</option>
                                        <option value="Sunday">Sunday</option>
                                    </select><br/>  */}
                                    <MuiPickersUtilsProvider utils={MomentUtils} moment ={moment}>
                                        <TimePicker
                                            name = "startTime"
                                            keyboard
                                            label="Select a start time"
                                            mask={[/\d/, /\d/, ':', /\d/, /\d/, ' ', /a|p/i, 'M']}
                                            placeholder="08:00 AM"
                                            value={this.state.selectedStart}
                                            onChange={this.handleChangeStart}
                                            disableOpenOnEnter
                                            keyboardIcon = {<ClockIcon />}
                                            />  
                                    </MuiPickersUtilsProvider><br/>
                                    <MuiPickersUtilsProvider utils={MomentUtils} moment ={moment}>
                                        <TimePicker
                                            name = "endTime"
                                            keyboard
                                            label="Select an end time"
                                            mask={[/\d/, /\d/, ':', /\d/, /\d/, ' ', /a|p/i, 'M']}
                                            placeholder="08:00 AM"
                                            value={this.state.selectedDate}
                                            onChange={this.handleDateChange}
                                            disableOpenOnEnter
                                            keyboardIcon = {<ClockIcon />}
                                            />            
                                    </MuiPickersUtilsProvider>
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
