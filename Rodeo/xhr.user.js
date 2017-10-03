// ==UserScript==
// @name        XHRTest
// @namespace   XHR
// @include     https://rodeo-iad.amazon.com/BNA3/*
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==

function InjectDemoCode($) {
  console.log('Getting Updated Locations');
    cartDB.carts.forEach(function(cart) {
      let cart_id = cart.cartID;
      let fetchURL = "http://fcresearch-na.aka.amazon.com/BNA3/results/container-hierarchy?s=" + cart_id;
      let messageTxt  = JSON.stringify (["fetchCarts", fetchURL])
        window.postMessage (messageTxt, "*");
        //console.log ("Posting message");
    });

    toteDB.totes.forEach(function(tote) {
      let tote_id = tote.toteID;
      let fetchURL = "http://fcresearch-na.aka.amazon.com/BNA3/results/container-hierarchy?s=" + tote_id;
      let messageTxt  = JSON.stringify (["fetchTotes", fetchURL])
        window.postMessage (messageTxt, "*");
        //console.log ("Posting message");
    });

    let messageTxt = JSON.stringify (['updateShipments', document.location.href])
    window.postMessage (messageTxt, "*");

    setTimeout(function() {
      InjectDemoCode($)
    }, 30000);
}

withPages_jQuery (InjectDemoCode);

//--- This code listens for the right kind of message and calls GM_xmlhttpRequest.
window.addEventListener ("message", receiveMessage, false);

function receiveMessage (event) {
    var messageJSON;
    try {
        messageJSON     = JSON.parse(event.data);
    }
    catch (zError) {
        // Do nothing
    }
    //console.log ("messageJSON:", messageJSON);

    if ( ! messageJSON) return; //-- Message is not for us.

    if (messageJSON[0] == "fetchCarts") {
      document.getElementById('cartLocations').innerHTML = '';
        var fetchURL    = messageJSON[1];
        GM_xmlhttpRequest ({
            method:     'GET',
            url:        fetchURL,
            onload:     function (responseDetails) {
              let div = document.createElement('div');
              div.innerHTML = responseDetails.responseText;
              let area = div.getElementsByTagName('a')[0].innerText;
              let identifier = area.substring(0,2);
              var loc;
              if(identifier == 'rs' || identifier == 'cv') {
                loc = div.getElementsByTagName('a')[0].innerText;
              } else {
                loc = div.getElementsByTagName('a')[3].innerText;
              }
              let cart_identifier = fetchURL.split('?s=')[1];
              let c_id = cart_identifier.substr(cart_identifier.length - 4);

              let cartDiv = document.getElementById('cartLocations');
              let divElement = document.createElement('div');
              divElement.setAttribute('id', c_id);
              divElement.setAttribute('class', loc);
              cartDiv.appendChild(divElement);
           }
        });
    } else if (messageJSON[0] == "fetchTotes") {
      document.getElementById('toteLocations').innerHTML = '';
        var fetchURL    = messageJSON[1];
        GM_xmlhttpRequest ({
            method:     'GET',
            url:        fetchURL,
            onload:     function (responseDetails) {
              let div = document.createElement('div');
              div.innerHTML = responseDetails.responseText;
              let area = div.getElementsByTagName('a')[0].innerText;
              let identifier = area.substring(0,2);
              var loc;
              if(identifier == 'ws') {
                loc = div.getElementsByTagName('a')[2].innerText;
              } else {
                loc = area;
              }
              let tote_identifier = fetchURL.split('?s=')[1];

              let toteDiv = document.getElementById('toteLocations');
              let divElement = document.createElement('div');
              divElement.setAttribute('id', tote_identifier);
              divElement.setAttribute('class', loc);
              toteDiv.appendChild(divElement);
           }
        });
    }
    else { // updateShipments
      var fetchURL = messageJSON[1];
      console.log('Updating Shipments');
      GM_xmlhttpRequest ({
          method:     'GET',
          url:        fetchURL,
          onload:     function (responseDetails) {
            let shipmentElement = document.getElementById('updatedShipments');
            let pageDOM = responseDetails.responseText;
            shipmentElement.innerHTML = pageDOM;
         }
      });
    }
}

function withPages_jQuery (NAMED_FunctionToRun) {
    var funcText        = NAMED_FunctionToRun.toString ();
    var funcName        = funcText.replace (/^function\s+(\w+)\s*\((.|\n|\r)+$/, "$1");
    var script          = document.createElement ("script");
    script.textContent  = funcText + "\n\n";
    script.textContent += 'jQuery(document).ready( function () {' + funcName + '(jQuery);} );';
    document.body.appendChild (script);
};
