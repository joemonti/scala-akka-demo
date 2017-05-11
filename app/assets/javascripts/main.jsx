const styles = {
  main: {
  },
  chats: {
    border: '1px solid black',
    padding: '4px',
    marginTop: '4px'
  },
  info: {
    color: '#888',
    margin: '4px 2px'
  },
  chatFrom: {
    color: '#0000ff',
    fontWeight: 'bold',
    margin: '4px 2px'
  },
  chatSelf: {
    color: '#ff0000',
    fontWeight: 'bold',
    margin: '4px 2px'
  },
  chatMessage: {
    margin: '4px 2px'
  }
};

class Chat extends React.Component {
  constructor(props) {
    super(props);
    
    let wsProto = (window.location.protocol == 'https:' ? 'wss' : 'ws');
    this.ws = new WebSocket(`${wsProto}://${window.location.host}/ws`);
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
      console.log("WS Event %o", event);
      this.setState(prevState => {
        prevState.chats.splice(0, 0, JSON.parse(event.data));
        return prevState;
      });
    };
    
    this.state = {
      username: '',
      loggedIn: false,
      chats: []
    };
    
    this.handleLogin = this.handleLogin.bind(this);
    this.handleSend = this.handleSend.bind(this);
  }
  
  handleLogin(event) { 
    event.preventDefault();
    var username = document.getElementById('login-username').value;
    console.log("Logging in as " + username);
    if (username == '') return;
    let obj = {
        command: "login",
        username
    };
    this.ws.send(JSON.stringify(obj));
    let selfChat = {
      event: "info",
      message: "You logged in as " + username
    };
    this.setState(prevState => {
      prevState.username = username;
      prevState.loggedIn = true;
      prevState.chats.splice(0, 0, selfChat);
      return prevState;
    });
  }

  handleSend(event) {
    event.preventDefault();
    var message = document.getElementById('chat-send-message').value;
    if (message == '') return;
    let obj = {
        command: "send",
        message
    };
    this.ws.send(JSON.stringify(obj));
    let selfChat = {
      event: "send",
      from: this.state.username,
      message
    };
    this.setState(prevState => {
      prevState.chats.splice(0, 0, selfChat);
      return prevState;
    });
    document.getElementById('chat-send-message').value = '';
  }

  render() {
    if (!this.state.loggedIn) {
      return (
        <div style={styles.main}>
          <form id="login-form" key="login-form" onSubmit={this.handleLogin}>
            <input type="text" id="login-username" key="login-username" autoComplete="off"/>
            <button type="submit">Login</button>
          </form>
        </div>
      );
    } else {
      let chats = this.state.chats.map((chat, i) => {
        if (chat.event == "info") {
          return (<div style={styles.info} key={i}>{chat.message}</div>);
        } else if (chat.event == "login") {
          return (<div style={styles.info} key={i}>{chat.from} logged in</div>);
        } else if (chat.event == "logout") {
          return (<div style={styles.info} key={i}>{chat.from} logged out</div>);
        } else if (chat.event == "send") {
          var fromStyle = styles.chatFrom;
          if (chat.from == this.state.username) fromStyle = styles.chatSelf;
          return (
            <div style={styles.chat} key={i}>
              <span style={fromStyle}>{chat.from}: </span>
              <span style={styles.chatMessage}>{chat.message}</span>
            </div>
          );
        }
      });
      return (
        <div style={styles.main}>
          <form id="chat-form" key="chat-form" onSubmit={this.handleSend}>
            <input type="text" id="chat-send-message" key="chat-send-message" autoComplete="off"/>
            <button type="submit">Send</button>
          </form>
          <div style={styles.chats}>{chats}</div>
        </div>
      );
    }
  }
}


ReactDOM.render(
 <Chat/>,
 document.getElementById('root')
);
