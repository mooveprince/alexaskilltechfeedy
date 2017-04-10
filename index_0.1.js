var https = require ('https');

var supportedSites = ['Hacker News', 'Tech Crunch', 'Tech Meme'];
var launchOutput = `<speak> Welcome to TechFeedy. One stop for your trending topics.  Now, which site you would like ? ${supportedSites} </speak>`;
var errorOutput = `<speak>I can only provide information for ${supportedSites}. Now, which site you would like ? </speak>`;
var goodByeOutput = `<speak>Good Bye</speak>`;

var hackerNewsEndpoint = "https://techfeedyservice.herokuapp.com/hackernews";
var techCrunchEndpoint = "https://techfeedyservice.herokuapp.com/techcrunch";
var techMemeEndpoint = "https://techfeedyservice.herokuapp.com/techmeme" ;


exports.handler = (event, context) => {

    try {
        if (event.session.new) {
            console.log ("New Session");
        }
        switch (event.request.type) {
            case "LaunchRequest":
                console.log(`LAUNCH REQUEST`);
                context.succeed(
                    generateResponse(
                        buildSpeechletResponse(launchOutput, false),
                        {}
                    )
                )
            break;

            case "IntentRequest":
                console.log (`INTENT REQUEST ${event.request.intent.name}`);
                if (event.request.intent.name === "GetTrendingTopics") {
                    var endPoint = getEndPoint (event.request.intent.slots.website.value, context);
                    var body = '';
                    https.get (endPoint, (response) => {
                        response.on ('data', (chunk) => { body += chunk});
                        response.on ('end', () => {
                            var topics = JSON.parse (body);
                            var titles = [];
                            for (var topic of topics) {
                                titles.push(topic.title);
                            }
                            var pausedTopics = titles.toString().split(",").join("<break time='1s'/>");
                            var ssmlString = ssmlStringReplacer(pausedTopics);
                            var output = `<speak> ${ssmlString} </speak>`;
                            context.succeed(
                            generateResponse(
                                buildSpeechletResponse(output, true),
                                {} )
                            )
                        })
                    });
                } else if (event.request.intent.name == "AMAZON.HelpIntent") {
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse(launchOutput, false),
                            {}
                        )
                    );
                } else if (event.request.intent.name == "AMAZON.StopIntent") {
                    context.succeed(
                        generateResponse(
                            buildSpeechletResponse(goodByeOutput, false),
                            {}
                        )
                    );
                }
                else {
                    context.succeed(
                        generateResponse(
                        buildSpeechletResponse(errorOutput, false),
                        {} )
                    );
                }

            case "SessionEndedRequest":
                console.log(`SESSION ENDED REQUEST`)
            break;
            default:
                context.fail(`INVALID REQUEST TYPE: ${event.request.type}`);
        }

    } catch (error) {
        console.log (error);
        context.fail (`Exception: ${error}`);
    }

}


// Helpers
buildSpeechletResponse = (outputText, shouldEndSession) => {
  return {
    outputSpeech: {
      type: "SSML",
      ssml: outputText
    },
    card: {
      type: "Simple",
      title: "TechFeedy",
      content: "Pulling the information from your favourite websites",
    },
    shouldEndSession: shouldEndSession
  }
}

generateResponse = (speechletResponse, sessionAttributes) => {
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }
}

getEndPoint = (websiteName, context) => {
    switch (websiteName) {
        case "hacker news":
            return hackerNewsEndpoint;
        
        case "tech meme" :
            return techMemeEndpoint;
        
        case "tech crunch" :
            return techCrunchEndpoint;
        
        default:
            //throw "Invalid Website";  
            //Below code should never gets executed as its not right intent
            context.succeed(
                generateResponse(
                    buildSpeechletResponse(errorOutput, false),
                    {} )
                );
    }
}

ssmlStringReplacer = (ssmlString) => {
    ssmlString = ssmlString.replace(/&/g, ' and ');
    return ssmlString;

}