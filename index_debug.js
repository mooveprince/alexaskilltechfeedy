var https = require ('https');

var supportedSites = ['Hacker News', 'Tech Crunch', 'Tech Meme'];

var hackerNewsEndpoint = "https://techfeedyservice.herokuapp.com/hackernews";
var techCrunchEndpoint = "https://techfeedyservice.herokuapp.com/techcrunch";
var techMemeEndpoint = "https://techfeedyservice.herokuapp.com/techmeme" ;

exports.handler = (event, context) => {

    try {
        if (event.session.new) {
            console.log ("New Session");
        }
        switch (event.request.type) {
            case "IntentRequest":
                if (event.request.intent.name == "AMAZON.HelpIntent") {
                    launchOuputGenerator (context);
                }
            break;
        }

    } catch (error) {
        console.log (error);
        context.fail (`Exception: ${error}`);
    }
}

launchOuputGenerator = (context) => {
    console.log ("Inside Launch Output Generator");
    var cardTitle = "Help";
    var cardContent = `Welcome to TechFeedy. One stop for your trending topics.  Now, which site you would like ? ${supportedSites} `;
    var speakContent = `<speak> ${cardContent} </speak>`;
    
    var cardResponse = {
       "type" : "Simple",
        "title" : cardTitle,
        "content" : cardContent        
    }

    context.succeed(generateResponse(
                buildSpeechletResponse(speakContent, cardResponse, false),
                {} )
                    );    

}


buildSpeechletResponse = (outputText, cardResponse, shouldEndSession) => {
    console.log ("Build Speech Response");
  return {
    outputSpeech: {
      type: "SSML",
      ssml: outputText
    },
    card: cardResponse,
    shouldEndSession: shouldEndSession
  }
}

generateResponse = (speechletResponse, sessionAttributes) => {
  console.log ("Generate final Response");
  return {
    version: "1.0",
    sessionAttributes: sessionAttributes,
    response: speechletResponse
  }
}