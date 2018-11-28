/*
 * Author: Tse Yang Lim
 *
 * Desc: This is a wrapper component for the dropdown menu that displays courses scraped from Portal
 * when selecting a course to add to the User's list of classes.
 */

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
                            var course_code = course["course_code"].substr(0, course["course_code"].lastIndexOf(" ")) + " - " +  course["course_name"];
                            return (<option key={course_code} value={course_code}></option>);
                        })
                    }
                </datalist>
            </div>
        );
    }
}

export default CourseMenu
