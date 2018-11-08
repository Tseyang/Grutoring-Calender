import React, { Component } from 'react';
import CourseMenu from './CourseMenu';

class ClassPopUp extends Component {
    constructor(props){
        super(props);
        //expect functions addCourse (callback for form contents) and closePopup
        this.state = {
            grutor: false,
            courses: props.courses,
            repeat: false,
            formValues: {
                course: "",
                grutor: false,
                repeat: false,
                location: null,
                day: null,
                startTime: null,
                endTime: null,
            }
        }
        this.handleSubmit = this.handleSubmit.bind(this);
        this.toggleGrutor = this.toggleGrutor.bind(this);
        this.toggleStudent = this.toggleStudent.bind(this);
        this.toggleRepeat = this.toggleRepeat.bind(this);
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

    toggleRepeat(){
        this.setState({
            repeat: !this.state.repeat
        });
    }

    handleSubmit(event){
        event.preventDefault();
        const data = new FormData(event.target);

        // access FormData fields with 'data.get(fieldName)'
        var newState = {};
        if(data.get("role") === "grutor"){
            newState = {
                repeat:  data.get("repeat"),
                location: data.get("location"),
                day: data.get("day"),
                startTime: data.get("startTime"),
                endTime: data.get("endTime")
            }
        }
        newState["course"] = data.get("course");
        newState["role"] = data.get("role");
        this.setState({formValues: newState}, function() {
            this.props.addCourse(this.state.formValues);
            this.props.closePopup();
        })
    }

    render(){
        return(
            <div className="class-popup">
                <div className="class-popup-inner">
                    <form onSubmit={this.handleSubmit}>
                        <CourseMenu courses={this.state.courses} />
                        <input type="radio" name="role" value="student" onClick={this.toggleStudent} required></input> Student
                        <input type="radio" name="role" value="grutor" onClick={this.toggleGrutor} required></input> Grutor
                        <div>
                            {this.state.grutor ?
                                <div id="grutor-fields">
                                    Location: <input type="text" name="location" required></input><br/>
                                    Permanent <input type="checkbox" name="repeat" onClick={this.toggleRepeat}></input><br/>
                                    {this.state.repeat ?
                                        <div>
                                            Select the day for your weekly grutoring hours:
                                        </div>
                                        :
                                        <div>
                                            Select the day for your temporary grutoring hours:
                                        </div>
                                    }Day:
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
