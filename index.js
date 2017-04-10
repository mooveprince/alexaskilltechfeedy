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
            case "LaunchRequest":
                launchOuputGenerator (context);
            break;

            case "IntentRequest":
                console.log (`INTENT REQUEST ${event.request.intent.name}`);
                if (event.request.intent.name === "GetTrendingTopics") {
                    intentOuputGenerator (context, event);
                } else if (event.request.intent.name == "AMAZON.HelpIntent") {
                    launchOuputGenerator (context);
                } else if (event.request.intent.name == "AMAZON.StopIntent") {
                    stopOutputGenerator (context);
                } else if (event.request.intent.name == "AMAZON.CancelIntent") {
                    stopOutputGenerator (context);
                } else {
                    errorOutputGenerator (context);
                }
            break;

            case "SessionEndedRequest":
                console.log(`SESSION ENDED REQUEST`);
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
intentOuputGenerator = (context, event) => {
    var websiteName = event.request.intent.slots.website.value;
    console.log ("Intent for website " + websiteName);
    var endPoint = getEndPoint (websiteName);
    console.log ("Endpoint is " + endPoint);
    var body = '';
    https.get (endPoint, (response) => {
        response.on ('data', (chunk) => { body += chunk});
        response.on ('end', () => {
            var topics = JSON.parse (body);
            var titlesForCard = "";
            var titlesForSpeech = [];
            for (var topic of topics) {
                titlesForCard += `${topic.title}. \n`;
                titlesForSpeech.push(topic.title);
            }

            var cardTitle = websiteName;
            var cardContent = titlesForCard.toString();   

            var pausedTopics = titlesForSpeech.toString().split(",").join("<break time='1s'/>");
            var ssmlString = ssmlStringReplacer(pausedTopics);
            var speakContent = `<speak> ${ssmlString} </speak>`;
            
            var cardResponse = buildCardResponse (cardTitle, cardContent);
            finalResponse (context, speakContent, cardResponse, true );
        });        
    });

}

launchOuputGenerator = (context) => {
    console.log ("Inside Launch Output Generator");
    var cardTitle = "Help";
    var cardContent = `Welcome to TechFeedy. One stop for your trending topics.  Now, which site you would like ? ${supportedSites} `;
    var speakContent = `<speak> ${cardContent} </speak>`;

    var cardResponse = buildCardResponse (cardTitle, cardContent);
    finalResponse (context, speakContent, cardResponse, false );

}

errorOutputGenerator = (context) => {
    var cardTitle = "Help";
    var cardContent = `I can only provide information for ${supportedSites}. Now, which site you would like ?`;
    var speakContent = `<speak> ${cardContent} </speak>`;

    var cardResponse = buildCardResponse (cardTitle, cardContent);
    finalResponse (context, speakContent, cardResponse, false );    

}

stopOutputGenerator = (context) => {
    var cardTitle = "Stop";
    var cardContent = `Good Bye`;
    var speakContent = `<speak> ${cardContent} </speak>`;

    var cardResponse = buildCardResponse (cardTitle, cardContent);
    finalResponse (context, speakContent, cardResponse, true );      
}

finalResponse = (context, speakContent, cardResponse, shouldEndSession) => {
    console.log ("Inside Final Response");
    context.succeed(
        generateResponse(
            buildSpeechletResponse(speakContent, cardResponse, shouldEndSession),
            {}
        )
    );
}

buildCardResponse = (cardTitle, cardContent) => {
    console.log ("Inside build Card Response");
    return {
        "type" : "Simple",
        "title" : cardTitle,
        "content" : cardContent
    };
}

buildSpeechletResponse = (outputText, cardDetails, shouldEndSession) => {
    console.log ("Build Speech Response");
  return {
    outputSpeech: {
      type: "SSML",
      ssml: outputText
    },
    card: cardDetails,
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

getEndPoint = (websiteName) => {
    switch (websiteName) {
        case "hacker news":
            return hackerNewsEndpoint;
        
        case "tech meme" :
            return techMemeEndpoint;
        
        case "tech crunch" :
            return techCrunchEndpoint;
        
        default:
            //Below code should never gets executed as its not right intent because of the slots we defined
            throw "Invalid Website";  
    }
}

ssmlStringReplacer = (ssmlString) => {
    return ssmlString.replace(/&/g, ' and ');
}