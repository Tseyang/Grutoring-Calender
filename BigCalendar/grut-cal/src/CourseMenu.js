import React from 'react';

class CourseMenu extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            courses: this.props.courses
        };
    }

    render(){
        return(
            <div>
                <input list="courses" name="course" required/>
                <datalist id="courses">
                    {
                        this.state.courses.map((course) => {
                            var course_code = course["department"] + "-" +  String(course["courseNumber"]).padStart(3, "0") + course["courseCodeSuffix"] + "-" + course["school"] + "-" + course["section"] + " " + course["courseName"];
                            return (<option key={course_code} value={course_code}>{course_code}</option>);
                        })
                    }
                </datalist>
            </div>
        );
    }
}

export default CourseMenu
