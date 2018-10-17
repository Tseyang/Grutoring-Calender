import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';

class CourseMenu extends React.Component{
    constructor(){
        super();
        this.state = {
            courses: []
        };
    }

    componentDidMount(){
        // Using HyperSchedule backend to load API
        URL = "https://hyperschedule.herokuapp.com/api/v2/all-courses"
        fetch(URL).then(results => {
            return results.json();
        }).then(data => {
            var HMcourses = data["courses"].filter(function(course) {return course["school"] === "HM";});
            console.log(HMcourses);
            this.setState({
                courses: HMcourses
            })
        })
    }

    render(){
        return(
            <select>
                {
                    this.state.courses.map((course) => {
                        var course_code = course["department"] + "-" + String(course["courseNumber"]).padStart(3, "0") + course["courseCodeSuffix"] + "-" + course["section"] + " " + course["courseName"];
                        return (<option key={course_code}>{course_code}</option>);
                    })
                }
            </select>
        );
    }
}


// =======================================

ReactDOM.render(
    <CourseMenu />,
    document.getElementById('root')
);
