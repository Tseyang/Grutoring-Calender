import React, { Component } from 'react';
import BigCalendar from 'react-big-calendar';
import moment from 'moment';
import './react-big-calendar.css';
import { Column, Row } from 'simple-flexbox';
import {Checkbox, CheckboxGroup} from 'react-checkbox-group';

import firebase,  { auth, provider } from "./firebase.js"
import './App.css'

const localizer = BigCalendar.momentLocalizer(moment)

class App extends Component {

  constructor(props) {
    super(props);
    this.state = {
        current_user: null,
      classes: ['CS81','CS70', 'CS121', 'CS105', 'CS60']
    };
    this.login = this.login.bind(this);
    this.logout = this.logout.bind(this);
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

  logout(){
      auth.signOut().then(() => {
          this.setState({
              current_user: null
          });
      });
  }

  login(){
      auth.signInWithPopup(provider).then((result) => {
          const user = result.user;
          console.log(user);
          this.setState({
              current_user: user,
          });
      });
  }

  render() {
    return (
        <div>
            {this.state.current_user ?
                <div className="navbar">
                    <div className="navbar__inner">
                        <button href="index.html" onClick={this.logout}>Log Out</button>
                        You are logged in as {this.state.current_user.displayName}
                    </div>
                </div>
                :
                <div className="navbar">
                    <div className="navbar__inner">
                        <button href="index.html" onClick={this.login}>Log In</button>
                        You are not logged in.
                    </div>
                </div>
            }
            <div>
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
