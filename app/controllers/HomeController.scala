package controllers

import javax.inject._
import play.api._
import play.api.mvc._
import play.api.libs.json._
import play.api.libs.streams._
import akka.actor._
import akka.stream._
import scala.collection.mutable


/**
 * This controller creates an `Action` to handle HTTP requests to the
 * application's home page.
 */
@Singleton
class HomeController @Inject() (implicit system: ActorSystem, materializer: Materializer) extends Controller {
  val router = system.actorOf(ChatRouter.props())
  
  /**
   * Create an Action to render an HTML page.
   *
   * The configuration in the `routes` file means that this method
   * will be called when the application receives a `GET` request with
   * a path of `/`.
   */
  def index = Action { implicit request =>
    Ok(views.html.index())
  }
  
  def ws = WebSocket.accept[JsValue, JsValue] { request =>
    ActorFlow.actorRef(out => ChatUser.props(out, router))
  }
}

case class ChatLogin(username: String)
case class ChatLogout(username: String)
case class ChatRegister(username: String, actorRef: ActorRef)
case class ChatUnregister(username: String)
case class ChatSend(from: String, message: String)

object ChatRouter {
  def props() = Props(new ChatRouter())
}

class ChatRouter() extends Actor {
  val users = mutable.Map.empty[String, ActorRef]
  
  def receive = {
    case ChatRegister(username, actorRef) => 
      Logger.debug(s"User $username connected")
      users.foreach { _._2 ! ChatLogin(username) }
      users.put(username, actorRef)
    case ChatUnregister(username) => 
      Logger.debug(s"User $username disconnected")
      users.remove(username)
      users.foreach { _._2 ! ChatLogout(username) }
    case send @ ChatSend(from, message) => 
      Logger.debug(s"User $from sent $message")
      users.filter(_._1 != from).foreach { _._2 ! send }
  }
}


object ChatUser {
  def props(out: ActorRef, router: ActorRef) = Props(new ChatUser(out, router))
}

class ChatUser(out: ActorRef, router: ActorRef) extends Actor {
  var username = "anonymous"
  def receive = {
    case msg: JsValue => 
      (msg \ "command").as[String] match {
        case "login" => 
          username = (msg \ "username").as[String]
          router ! ChatRegister(username, self)
        case "send" => router ! ChatSend(username, (msg \ "message").as[String])
        case cmd => out ! Json.obj("error" -> s"invalid command $cmd")
      }
    case ChatSend(username, message) => 
      out ! Json.obj("event" -> "send", "from" -> username, "message" -> message)
    case ChatLogin(username) =>
      out ! Json.obj("event" -> "login", "from" -> username)
    case ChatLogout(username) =>
      out ! Json.obj("event" -> "logout", "from" -> username)
  }
  
  override def postStop() = {
    if (username != "anonymous") {
     router ! ChatUnregister(username)
    }
  }
}


