# Idea
I want to take a step back

we've done some interesting expirements with the model's state / embodiment being the canvas

it has lead me toward the conclusion that the canvas is not that great a place for the model to get it's state.

More expirementation may reveal optimal setups or methods for putting everything on the canvas and having the model read it back.

I want to change direction a bit away from the visual being the entire state.

We saw some impressive results when the model was getting the JS which generates the canvas as well as the screen shot of the canvas, letting hte model incr grow or change the canvas

Here's what i'm thinking.

The canvas is the space the AI and the human share.

The human sees the canvas visually and the model sees it visually and the code 
- (the human could see the code too but it's not a great modality)

It's less about the canvas being the embodiment of the model and more about the canvas being the
embodiment of understsanding between the human and the AI.

The shared state, concept, communication space.

# Vision

We create some starter "Communication frames".

These communication frames are (essentially) the JS to update the canvas to a starter position.

I'm picturing things like starting w/ some panels defined for memories and thoughts and things.

I want to be able to start a new session w/ the AI and choose the starting communication frame.

The canvas itself can grow and I can pan / zoom to work w/in it.

# Communication between human and model

Should we have the canvas (communication frame?) contain the user's text? Prev experiments have shown this can be effective and the model notices it.

It prob isn't as affective as directly putting user's input in the messages api call.

# Persistent state

Should all the state be in the communication frame? I am thinking we should put everything other than the convo between the user and model in the canvas (and it's JS. when i say canvas i mean the JS that renders it _and_ the image)

The convo is persistent state (rolling window) and the canvas is persistent state.

So we keep all the convo and thoughts and we always keep in the chat context the most recent cavas screen shot & JS.

# Doing work

I want me and you (human and AI) to be able to try and do "things" together.

This might mean loading additional context.

In the case that we want to do something like review a webpage to maybe pull info from (some docs maybe), that web page (screen shot?) would be added to the shared canvas.

In technical terms I guess i'm suggesting that the model can use tools to add things to the canvas?

like the model invokes a tool (we can talk tech details on how to implement tools) to "view" the webpage and a screen shot of the web page is added to the canvas?

# Tech guidance
Similar to the other projects we will use the anthropic api
- see other projets for impl refs

tools here means LM tools using the tools spec. we can pull anthropic docs around this later.