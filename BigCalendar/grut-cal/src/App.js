import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import './react-big-calendar.css';
import './class-panel.css'; 
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

const localizer = BigCalendar.momentLocalizer(moment)

const classes = [
  {value: "CS121"},
  {value: "CS105"},
  {value: "CS70"},
  {value: "CS81"}
]

{/*function mapListItems(classes){
  var classBoxes = classes.map((classTemp) => {
  return (
    <label>{classTemp.value}, {classTemp.id}<input type="checkbox" key={classTemp.id} value=
    {classTemp.value} checked ={classTemp.isChecked} onChange = {this.toggleClass}/> <br></br></label>)});
  return classBoxes};*/}

function classList(classes){
  var checkClasses = classes.map((classTemp) => {
    if (classTemp.isChecked === true){
      return <li>{classTemp.value}<br></br></li>}
    }
  );
  return checkClasses};

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      classes: [
        {id: 1, value: "CS121", isChecked: true},
        {id: 2, value: "CS105", isChecked: false},
        {id: 3, value: "CS70", isChecked: true},
        {id: 4, value: "CS81", isChecked: false}
      ],
      textInput: ''
    };

    this.handleChange = this.handleChange.bind(this);
  }

  mapListItems(classes){
    var classBoxes = classes.map((classTemp) => {
    return (
      <label>{classTemp.value}, {classTemp.id}<input type="checkbox" key={classTemp.id} value=
      {classTemp.value} checked ={classTemp.isChecked} id = {classTemp.id} onChange = {this.toggleClass.bind(this)}/> <br></br></label>)});
    return classBoxes};

  handleChange(event) {
    const target = event.target
    const name = target.name

    this.setState({[name]: event.target.value});
  }

  toggleClass(event) {
    const value = event.target.id;
    const index = value-1;
    this.state.classes[index].isChecked = !(this.state.classes[index].isChecked);
    this.setState({classes: this.state.classes})
  }
  addClass(event) {
    event.preventDefault();
    this.state.classes.push(
      {id: this.state.classes.length+1, value: this.state.textInput, isChecked: false }
    )
    this.setState({classes: this.state.classes})
  }

  render() {
    return (
      <div className = "wholeThing">
        <div className = "userInput">
          <text>Class List</text>
            
            <form>
              { this.mapListItems(this.state.classes) } 
            </form>
            <form>
            <label>
                Name:
                <input 
                  name="textInput"
                  type="text" 
                  value = {this.state.textInput} 
                  onChange={this.handleChange} />
              </label>
              <button name="textInput" type="submit" value="Here"  onClick={this.addClass.bind(this)}>
                Submit Class
              </button>
            </form>
            { classList(this.state.classes) }
          </div>
          <div className = "calendar">
                <BigCalendar
                localizer={localizer}
                events={[]}
                startAccessor="startDate"
                endAccessor="endDate"
              />
          </div> 
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
