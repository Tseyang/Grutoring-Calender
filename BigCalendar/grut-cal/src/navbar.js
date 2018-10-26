import React, { Component } from 'react';
import './css/navbar.css'

import firebase,  { auth, provider } from "./firebase.js"

class Navbar extends Component{

    constructor(props){
        super(props);
        this.state = {
            current_user: props
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
