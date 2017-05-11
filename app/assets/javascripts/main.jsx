class Chat extends React.Component {
  constructor(props) {
    super(props);
    
    this.ws = new WebSocket('ws://localhost:9000/ws');
    this.ws.onclose = (event) => {
        console.log("WS Close %o", event);
    };
    this.ws.onopen = (event) => {
        console.log("WS Open %o", event);
    };
    this.ws.onerror = (event) => {
        console.error("WS ERROR %o", event);
    };
    this.ws.onmessage = (event) => {
        console.log("WS Eevent %o", event);
    };
    
    this.state = {
      username: '',
      loggedIn: false,
      chats: []
    };
    
    this.handleChange = this.handleChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }
  
  handleChange(event) {
    this.setState({username: event.target.value});
  }
  
  handleLogin(event) { 
    event.preventDefault();
    console.log("Logging in as " + this.state.username);
    if (this.state.username == '') return;
    let obj = {
        command: "login",
        username: this.state.username
    };
    this.ws.send(JSON.stringify(obj));
    this.setState({loggedIn: true});
  }

  render() {
    if (!this.state.loggedIn) {
        return (
            <div>
                <form onSubmit={this.handleLogin}>
                    <input type="text" value={this.state.username} onChange={this.handleChange} />
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    } else {
        return (<h1>Logged In as {this.state.username}</h1>);
    }
  }
}


ReactDOM.render(
 <Chat/>,
 document.getElementById('root')
);
