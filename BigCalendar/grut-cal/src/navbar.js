/*
 * Author: Tse Yang Lim
 * Desc: This is the Component for the navbar at the top of the app which
 * primarily handles login/logout functionality
 */

import React, { Component } from 'react';
import './css/navbar.css'

import { auth, provider } from "./firebase.js"

class Navbar extends Component{

    constructor(props){
        super(props);
        this.state = {
            current_user: props.current_user,
        };
        this.login = this.login.bind(this);
        this.logout = this.logout.bind(this);
    }

    /*
     * Whenever a login or logout is done, set the state accordingly
     */
    componentDidMount(){
        auth.onAuthStateChanged((user) => {
            if(user){
                this.setState({
                    current_user: user,
                });
            }
        });
    }

    /*
     * Use logout function that is passed in on construction of this Component
     * to access the current_user variable in the state of the parent component App.js
     */
    logout(){
        this.props.logout();
        this.setState({
            current_user: null
        });
    }

    /*
     * Use G-Suite login API with a popup for logging in, login restricted to g.hmc
     */
    login(){
        auth.signInWithPopup(provider).then((result) => {
            const user = result.user;
            this.setState({
                current_user: user,
            });
        });
    }

    render(){
        return(
            <div className="navbar navbar__extended">
                <div className="container">
                    {this.state.current_user ?
                        <div className="navbar__inner">
                            {this.state.current_user.displayName}
                            <a className="navbar__logo" onClick={this.logout}>Log Out</a>
                        </div>
                        :
                        <div className="navbar__inner">
                            You are not logged in.
                            <a className="navbar__logo" onClick={this.login}>Log In</a>
                        </div>
                    }
                </div>
            </div>
        );
    }
}

export default Navbar
