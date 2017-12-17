// ==UserScript==
// @name        XHRTest
// @namespace   XHR
// @include     https://rodeo-iad.amazon.com/BNA3/*
// @version     1
// @grant       GM_xmlhttpRequest
// ==/UserScript==


function InjectDemoCode($) {
  /*
  let text = document.createTextNode('Fetch')
  let fetchBtn = document.createElement('div')
  fetchBtn.setAttribute('class', 'btn')
  fetchBtn.appendChild(text)
*/
  function getLocations () {
      window.setInterval(function () {
        if (window.pagnated && document.getElementById('cartLocations').children.length < cartDB.carts.length) {
          document.querySelector('#btnArea #cart').innerText = `Carts (${document.getElementById('cartLocations').children.length} / ${cartDB.carts.length})`
          console.log('Getting Locations')
          console.log(cartDB.carts)
          cartDB.carts.forEach(function(cart) {
            let cart_id = cart.cartID;
            let fetchURL = "http://fcresearch-na.aka.amazon.com/BNA3/results/container-hierarchy?s=" + cart_id;
            let messageTxt  = JSON.stringify (["fetchCarts", fetchURL])
            window.postMessage (messageTxt, "*");
          })
        } else {
          document.querySelector('#btnArea #cart').setAttribute('class', 'good')
          document.querySelector('#btnArea #cart').innerText = `Carts`
        }
      }, 2000)
    }
    getLocations()
/*
  fetchBtn.onclick = function () {
    getLocations()
  }
  document.getElementById('bessTools').appendChild(fetchBtn)
  */
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
    }

    if ( ! messageJSON) return;

    if (messageJSON[0] == "fetchCarts") {
      // document.getElementById('cartLocations').innerHTML = '';
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
              if (!document.getElementById(c_id)) {
                let divElement = document.createElement('div');
                divElement.setAttribute('id', c_id);
                divElement.setAttribute('class', loc);
                cartDiv.appendChild(divElement);
              }
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
}
