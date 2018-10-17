import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import './react-big-calendar.css';
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

const localizer = BigCalendar.momentLocalizer(moment)


class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
      classes: ['CS81','CS70', 'CS121', 'CS105', 'CS60']
    };
  }


  render() {
    return (

        <Row vertical='center'>
          <Column flexGrow={1} horizontal='center'>
            <text>Class List</text>
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
          <Column flexGrow={1} horizontal='center'>
              <BigCalendar
              localizer={localizer}
              events={[]}
              startAccessor="startDate"
              endAccessor="endDate"
            />
          </Column>
        </Row>

  );
}

classesChanged = (newClasses) => {
  this.setState({
    classes: newClasses
  });
}

};

export default App
