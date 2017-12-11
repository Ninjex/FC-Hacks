// ==UserScript==
// @name        RodeoTools
// @namespace   RodeoTools
// @include     https://rodeo-iad.amazon.com/BNA3/ItemList*
// @version     1
// ==/UserScript==

// https://rodeo-iad.amazon.com/resources/javascript/shipmentList.js
let lineArray = JSON.parse(localStorage.getItem('lineSettings')) || [
  {val: 'SLAM01', text: '1', checked: true},
  {val: 'SLAM02', text: '2', checked: true},
  {val: 'SLAM03', text: '3', checked: true},
  {val: 'SLAM04', text: '4', checked: true},
  {val: 'SLAM05', text: '5', checked: true},
  {val: 'SLAM06', text: '6', checked: true},
  {val: 'SLAM07', text: '7', checked: true},
  {val: 'SLAM08', text: '8', checked: true},
  {val: 'SLAM09', text: '9', checked: true},
  {val: 'SLAM10', text: '10', checked: true},
  {val: 'wsSingles', text: 'Stations', checked: true},
  {val: 'M00002', text: 'M-Mod', checked: true},
  {val: 'Passthru', text: 'Pass Throughs', checked: true},
  {val: 'INDUCT', text: 'Induct', checked: true},
  {val: 'RECIRC', text: 'Recirc', checked: true},
  {val: 'LANE', text: 'Lanes', checked: true}
]

let lineHTML = ''
lineArray.forEach(function (line) {
  if (line.checked) {
    lineHTML += '<li><input id="' + line.val + '" checked type="checkbox" name="line" value="' + line.val + '">' + line.text + '</li>'
  } else {
    lineHTML += '<li><input id="' + line.val + '" type="checkbox" name="line" value="' + line.val + '">' + line.text + '</li>'
  }
})

let buttons = `<div id="bessTools">
  <div id="lineFilter" class="dropdown-check-list" tabindex="100">
    <span class="anchor">Line Options</span>
    <ul class="items">
      <li><button id="settings" onclick="javascript:saveSettings()">Save</button></li>
      ${lineHTML}
    </ul>
  </div>

  <div id="btnArea">
    <button id="cart" onclick="javascript:cartModal()">Carts</button>
    <button id="tote" onclick="javascript:toteModal()">Totes</button>
  </div>

  <div id="searchArea">
    <input type="text" maxlength="4" size="4" id="cart" class="" placeholder="Cart ID"/>
    <input type="text" maxlength="3" size="4" id="tote" class="" placeholder="Tote ID"/>
    <div id="quickInfo"></div>
  </div>
</div>`

let linkEl = document.getElementsByClassName('pager-page-link')[0]

if (linkEl) {
  let totalShipments = document.getElementsByClassName('pager-result-size')[0].childNodes[0].nodeValue
  let link = linkEl.href
  let explode = link.split('currentPage=2')
  let headLink = explode[0] + 'currentPage=1'
  let doubleExplode = explode[1].split('pageSize=1000')
  let tailLink = doubleExplode[0] + 'pageSize=' + totalShipments + doubleExplode[1]
  let newLink = headLink + tailLink
  buttons += `<a href="${newLink}">FIT ALL</a>`
}

window.saveSettings = function () {
  lineArray.forEach(function (line) {
    let check = document.getElementById(line.val).checked
    line.checked = check
  })
  localStorage.removeItem('lineSettings')
  localStorage.setItem('lineSettings', JSON.stringify(lineArray))
  console.log('Setting localStorage lineSettings to:')
  console.log(lineArray)
}

document.body.innerHTML = buttons + document.body.innerHTML

let cartLocationElement = document.createElement('div')
cartLocationElement.setAttribute('id', 'cartLocations')
cartLocationElement.setAttribute('class', 'hide')
document.body.appendChild(cartLocationElement)

let toteLocationElement = document.createElement('div')
toteLocationElement.setAttribute('id', 'toteLocations')
toteLocationElement.setAttribute('class', 'hide')

document.body.appendChild(toteLocationElement)

let updatedShipmentLocationElement = document.createElement('div')
updatedShipmentLocationElement.setAttribute('id', 'updatedShipments')
updatedShipmentLocationElement.setAttribute('class', 'hide')
document.body.appendChild(updatedShipmentLocationElement)

var checkList = document.getElementById('lineFilter')
checkList.getElementsByClassName('anchor')[0].onclick = function (evt) {
  if (checkList.classList.contains('visible')) {
    checkList.classList.remove('visible')
  } else {
    checkList.classList.add('visible')
  }
}

const PathList = {
  ppMultiLargeDual: 'wsMultis[6-9].*',
  ppMultiSmallDual: 'wsMultis[1-5].*',
  // only shows AAs signed into the processing app.
  ppMultiWraps: 'wsGiftWrap[1-9]{4}',
  ppSingleLarge: 'wsSingles[1-4].*',
  ppSinglePoly: 'wsSingles[5-8].*',
  // no unique identifier for shoes, count is added with single small
  ppSingleShoe: 'wsNULL',
  ppSingleSmall: '^[0-9]{3}'
}

const PathAcronyms = {
  PPMultiLargeDual: 'ML',
  PPMultiSmallDual: 'MS',
  PPMultiWraps: 'GW',
  PPSingleLarge: 'SL',
  PPSinglePoly: 'SP',
  PPSingleSmall: 'SS',
  PPHOV: 'HOV',
  PPSingleShoe: 'Shoe' // &#128095
}

const SinglePaths = {
  singleLarge: 'PPSingleLarge',
  singleSmall: 'PPSingleSmall',
  hov: 'PPHOV'
}

class ShipmentDB {
  constructor (shipments) {
    this.shipments = shipments || []
  }

  addShipment (shipmentObject) {
    this.shipments.push(new Shipment(shipmentObject))
  }

  showShipments () {
    console.log(this.shipments)
  }

  grabShipments () {
    function convertTime (dwellTime) {
      let time = dwellTime.split('h')
      let minutes = 0
      if (time.length > 1) {
        minutes = (parseInt(time[0] * 60) + parseInt(time[1]))
      } else {
        minutes = (parseInt(time[0]))
      }
      return minutes
    }

    var rows = document.getElementsByTagName('tr')
    for (var i = 1; i < rows.length; i++) {
      var row = rows[i]
      var cols = Array.prototype.map.call(row.getElementsByTagName('td'), col => col.innerText)
      let [
          foo, sid, fnSku, exsd, scanid, outerscanid,
          cond, shipmeth, shipopt, processpath, pickpriority,
          batchid, quantity, workingpool, dwellTime
          ] = cols
      this.addShipment({
        'shipmentID': sid,
        'fnSku': fnSku,
        'expectedShipDate': exsd,
        'scannableID': scanid,
        'outerScannableID': outerscanid,
        'condition': cond,
        'shipMethod': shipmeth,
        'shipOption': shipopt,
        'processPath': processpath,
        'pickPriority': pickpriority,
        'batchID': batchid,
        'quantity': quantity,
        'workingPool': workingpool,
        'dwellTime': {'hours': dwellTime, 'minutes': convertTime(dwellTime)}
      })
    }
  }

  partialSort (identifier, value) {
    return this.shipments.filter(function (shipment) {
      return shipment[identifier].includes(value)
    })
  }

  sortBy (identifier, value) {
    if (identifier === 'dwellTime') {
      return this.shipments.filter(function (shipment) {
        return shipment[identifier].minutes >= value
      })
    }

    return this.shipments.filter(function (shipment) {
      return shipment[identifier] === value
    })
  }
}

class CartDB {
  constructor (carts) {
    this.carts = carts || []
  }

  // CartDB.carts.forEach(function(c) { CartDB.sortBy('location', c.location)})
  sortBy (identifier, value) {
    return this.carts.filter(function (cart) {
      return cart[identifier] === value
    })
  }

  addCart (cartObject) {
    this.carts.push(cartObject)
  }

  showCarts () {
    console.log(this.carts)
  }

  grabCarts () {
    let parent = this
    let filterCarts = []
    let cartList = shipmentManager.shipments.filter(function (shipmentObject) {
      return isCart(shipmentObject.outerScannableID)
    })
    cartList.forEach(function (cart) {
      if (filterCarts.indexOf(cart.outerScannableID) === -1) {
        filterCarts.push(cart.outerScannableID)
      }
    })

    filterCarts.forEach(function (cart) {
      let inDB = false
      parent.carts.forEach(function (insideDB) {
        if (insideDB.cartID === cart) inDB = true
      })
      if (!inDB) parent.carts.push(new Cart(cart, sameOSID(cart)))
    })

    parent.carts.forEach(function (cart) {
      cart.unitQuantity()
      cart.chuteQuantity()
    })
  }

  largestCarts () {
    this.grabCarts()
    let parent = this
    let biggestCarts = []
    var tempDB = parent.carts.slice()
    while (biggestCarts.length < parent.carts.length) {
      let biggestIndex = 0
      let biggest = tempDB[0].units
      let biggestCart = tempDB[0].cartID
      tempDB.forEach(function (cart, index, object) {
        if (cart.units >= biggest) {
          biggest = cart.units
          biggestCart = cart
          biggestIndex = index
        }
      })
      tempDB.splice(biggestIndex, 1)
      biggestCarts.push(biggestCart)
    }
    // console.log(biggestCarts)
    return biggestCarts
  }

  fetchCart (cartNum) {
    let carts = this.carts.filter(function (cart) {
      return cartNum === cart.cartID.substr(cart.cartID.length - 4)
    })
    return carts
  }

  setLocations () {
    let parent = this
    let children = Array.from(document.getElementById('cartLocations').children)
    children.forEach(function (cartDiv) {
      let cartIndent = cartDiv.attributes.id.value
      let cartLoc = cartDiv.attributes.class.value
      console.log('Setting ' + cartIndent + ' : ' + cartLoc)
      if (parent.fetchCart(cartIndent).length > 0) parent.fetchCart(cartIndent).pop().location = cartLoc
    })
  }
}

class ToteDB {
  constructor (totes) {
    this.totes = totes || []
  }

  addTote (toteObject) {
    this.totes.push(toteObject)
  }

  showTotes () {
    console.log(this.totes)
  }

  grabTotes () {
    let parent = this
    let filterTotes = []
    let toteList = shipmentManager.shipments.filter(function (shipmentObject) {
      return isTote(shipmentObject.scannableID)
    })

    toteList.forEach(function (tote) {
      if (filterTotes.indexOf(tote.scannableID) === -1) {
        filterTotes.push(tote.scannableID)
      }
    })

    filterTotes.forEach(function (tote) {
      let inDB = false
      parent.totes.forEach(function (insideDB) {
        if (insideDB.toteID === tote) inDB = true
      })
      if (!inDB) parent.addTote(new Tote(tote, sameSID(tote)))
    })
  }

  largestTotes () {
    this.grabTotes()
    let parent = this
    let biggestTotes = []
    var tempDB = parent.totes.slice()
    while (biggestTotes.length < parent.totes.length) {
      let biggestIndex = 0
      let biggest = tempDB[0].units
      let biggestTote = tempDB[0].toteID
      tempDB.forEach(function (tote, index, object) {
        if (tote.units >= biggest) {
          biggest = tote.units
          biggestTote = tote
          biggestIndex = index
        }
      })
      tempDB.splice(biggestIndex, 1)
      biggestTotes.push(biggestTote)
    }
    return biggestTotes
  }

  groupByDwellTime () {
    this.grabTotes()
    let parent = this
    let highestDwells = []
    let tempDB = this.totes.slice()
    while (highestDwells.length < parent.totes.length) {
      let highestIndex = 0
      let highestDwell = parseInt(tempDB[0].dwellTime.minutes)
      let highestTote = tempDB[0].toteID
      tempDB.forEach(function (tote, index, object) {
        if (parseInt(tote.dwellTime.minutes) >= highestDwell) {
          highestDwell = tote.dwellTime.minutes
          highestTote = tote
          highestIndex = index
        }
      })
      tempDB.splice(highestIndex, 1)
      highestDwells.push(highestTote)
    }
    return highestDwells
  }

  groupBySIDs () {
    let tempDB = this.totes.slice()
  }

  sameSID (sid) {
    return this.totes.filter(function (tote) {
      return tote.toteID === sid
    })[0].shipments
  }

  findIdentifier (identifier) {
    this.grabTotes()
    return this.totes.filter(function (tote) {
      return (tote.toteID.substr(tote.toteID.length - 3) === identifier)
    })
  }

  fetchTote (fetchID) {
    let totes = this.totes.filter(function (tote) {
      return (tote.toteID === fetchID)
    })
    return totes
  }

  setLocations () {
    let parent = this
    let children = Array.from(document.getElementById('toteLocations').children)
    children.forEach(function (toteDiv) {
      let toteIdent = toteDiv.attributes.id.value
      let toteLoc = toteDiv.attributes.class.value
      if (parent.fetchTote(toteIdent).length > 0) parent.fetchTote(toteIdent).pop().location = toteLoc
    })
  }
}

class Line {
  constructor () {
    this.lines = lines || {}
  }

  addLine (key, line) {
    this.lines[key] = line
  }

  setLines (lineObject) {
    this.lines = lineObject
  }

  updateLines () {
    let lineDOM = document.getElementById('lineFilter')
    var vals = Array.prototype.map.call(lineDOM.getElementsByTagName('input'), val => val.checked)
    let [ slam1, slam2, slam3, slam4, slam5, slam6, slam7, slam8, slam9, slam10, wsSingles, moooo2, passthru, induct, lane, recirc ] = vals
    let filteredLines = {
      'SLAM01': slam1,
      'SLAM02': slam2,
      'SLAM03': slam3,
      'SLAM04': slam4,
      'SLAM05': slam5,
      'SLAM06': slam6,
      'SLAM07': slam7,
      'SLAM_08': slam8,
      'SLAM_09': slam9,
      'SLAM_10': slam10,
      'wsSingles': wsSingles,
      'M00002': moooo2,
      'Passthru': passthru,
      'INDUCT': induct,
      'LANE': lane,
      'RECIRC': recirc
    }
    this.setLines(filteredLines)
  }

  isActive (line) {
    this.updateLines()
    let pattern = /(^ws[0-9]{3}|^[0-9]{3})/
    let active = false
    for (var propName in this.lines) {
      if (propName === 'wsSingles') {
        if (pattern.test(line)) active = true
      }
      if (propName.includes(line) || (line.includes(propName) && this.lines[propName])) active = true
    }
    return active
  }

  showLines () {
    console.log(this.lines)
  }
}

class Filter {
  constructor (filterList) {
    this.filterList = filterList || []
  }

  addFilter (filter) {
    this.filterList.push(filter)
  }

  showFilters () {
    this.filterList.forEach(function (filterObject) {
      let { name, code, description } = filterObject
      console.log('Filter Name: ' + name)
      console.log('Filter Code: ' + code)
      console.log('Filter Description: ' + description)
    })
  }

  executeFilter (filter, paramList) {
    this.filterList.forEach(function (filterObject) {
      let { name, code, description } = filterObject
      if (filter === name) code.apply(null, paramList)
    })
  }
}

class Shipment {
  constructor (ship) {
    for (var propName in ship) {
      this[propName] = ship[propName]
    }
  }
}

window.shipmentManager = new ShipmentDB()
shipmentManager.grabShipments()

window.lineManager = new Line()

window.filterManager = new Filter()

var isTote = function (tote) {
  return (tote.substring(0, 3).toLowerCase() === 'tsx')
}

var isCart = function (cart) {
  let cartPaths = [
    'PPMultiLarge', 'PPMultiLargeDual', 'PPMultiLargeQuad',
    'PPMultiSmall', 'PPMultiSmallDual', 'PPMultiSmallQuad',
    'PPMultiWraps'
  ]

  return (cart.substring(0, 5) === 'resml' || cart.substring(0, 5) === 'relrg')
}

var onLine = function (outerscanid, line) {
  return (outerscanid.substring(5) === line || outerscanid.substring(0, 9) === line || outerscanid.substring(5, 13) === line)
}

var removeDuplicatesBy = function (keyFn, array) {
  var mySet = new Set()
  let newArray = array.filter(function (x) {
    let key = keyFn(x)
    let isNew = !mySet.has(key)
    if (isNew) mySet.add(key)
    return isNew
  })
  return newArray
}

var lines = function () {
  let filteredTotes = {}
  lineManager.updateLines()
  let lineList = lineManager.lines
  for (var line in lineList) {
    if (lineList[line]) {
      filteredTotes[line] = shipmentManager.shipments.filter(function (shipmentObject) {
        return onLine(shipmentObject.outerScannableID, line)
      })
    }
  }
  for (var lineName in filteredTotes) {
    let list = filteredTotes[lineName]
    list.forEach(function (tote) {
    })
  }
  console.log(filteredTotes)
  return filteredTotes
}

window.openTab = function (url) {
  var win = window.open(url, '_blank')
  win.focus()
}

// filterManager.executeFilter('totes')
var totes = function () {
  var toteList = shipmentManager.shipments.filter(function (obj) {
    return isTote(obj.scannableID)
  })
  console.log(toteList)
}

filterManager.addFilter({
  'name': 'isTote',
  'code': isTote,
  'description': 'Verifies if the scannable ID is a tote ID'
})

filterManager.addFilter({
  'name': 'isCart',
  'code': isCart,
  'description': 'Verifies if the scannable ID is a cart ID'
})

filterManager.addFilter({
  'name': 'onLine',
  'code': onLine,
  'description': 'Verifies if the outer scannable ID is on a line'
})

filterManager.addFilter({
  'name': 'lines',
  'code': lines,
  'description': 'Returns an array of totes on the desired line'
})

filterManager.addFilter({
  'name': 'totes',
  'code': totes,
  'description': 'Returns shipments that only have tote scannable ID'
})

class Cart {
  constructor (cartID, shipments, chutes, units) {
    this.cartID = cartID
    this.shipments = shipments || []
    this.chutes = chutes || 0
    this.units = units || 0
  }

  addShipment (shipmentObject) {
    this.shipments.push(shipmentObject)
  }

  chuteQuantity () {
    let chuteQuantity = removeDuplicatesBy(x => x.scannableID, this.shipments).length
    this.chutes = chuteQuantity
    return chuteQuantity
  }

  unitQuantity () {
    let quant = 0
    this.shipments.forEach(function (shipment) {
      // console.log(shipment)
      quant += parseInt(shipment.quantity)
    })
    this.units = quant
    return this.units
  }

  highestDwell () {
    let highestDwellTime = this.shipments[0].dwellTime
    this.shipments.forEach(function (shipment) {
      let dwell = shipment.dwellTime.minutes
      if (parseInt(dwell) > parseInt(highestDwellTime.minutes)) highestDwellTime = shipment.dwellTime
    })
    return highestDwellTime
  }

  lowestDwell () {
    let lowestDwellTime = this.shipments[0].dwellTime
    this.shipments.forEach(function (shipment) {
      let dwell = shipment.dwellTime.minutes
      if (parseInt(dwell) < parseInt(lowestDwellTime.minutes)) lowestDwellTime = shipment.dwellTime
    })
    return lowestDwellTime
  }
}

window.cartDB = new CartDB()
window.toteDB = new ToteDB()

class Tote {
  constructor (toteID, shipments) {
    this.toteID = toteID
    this.shipments = shipments || []
    this.units = this.shipments.length
    this.outerScannableID = this.shipments[0].outerScannableID
  }
  addShipment (shipmentObject) {
    this.shipments.push(shipmentObject)
    this.units += 1
  }

  getUnits () {
    return this.shipments.length
  }

  highestDwell () {
    let highestDwellTime = this.shipments[0].dwellTime
    this.shipments.forEach(function (shipment) {
      let dwell = shipment.dwellTime.minutes
      if (parseInt(dwell) > parseInt(highestDwellTime.minutes)) highestDwellTime = shipment.dwellTime
    })
    return highestDwellTime
  }
}

window.sameOSID = function (osid) {
  let group = []
  shipmentManager.shipments.forEach(function (shipment) {
    if (osid === shipment.outerScannableID) {
      group.push(shipment)
    }
  })
  return group
}

window.sameSID = function (sid) {
  let group = []
  shipmentManager.shipments.forEach(function (shipment) {
    if (sid === shipment.scannableID) {
      group.push(shipment)
    }
  })
  return group
}

let injectCSSFile = function (id, url) {
  if (!document.getElementById(id)) {
    var head = document.getElementsByTagName('head')[0]
    var link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = url
    // link.media = 'all'
    head.appendChild(link)
  }
}

injectCSSFile('custom-styles', 'https://codepen.io/Syncthetic/pen/EXqqJZ.css')

window.hideTools = function () {
  let tools = document.getElementById('bessTools')
  if (tools.style.visibility === 'hidden') {
    tools.style.visibility = 'visible'
  } else {
    tools.style.visibility = 'hidden'
  }
}

window.onkeydown = function (e) {
  if (e.keyCode === 112) {
    hideTools()
  }
}

/* Table Structure
  headers = [{headerName:h1, attributes[{id:idName, class:className}]}, {}, {} ]
  cellData = [{text:td, attributes:[{id:idName, class:className}]}, {}, {} ]
  attributes = [{id:id, class:className}]
*/
class Table {
  constructor (headers, cellData, attributes) {
    this.headers = headers || []
    this.cellData = cellData || []
    this.attributes = attributes || []
  }

  addAttribute (attributeObject) {
    this.attributes.push(attributeObject)
  }

  addHeader (headerObject) {
    this.headers.push(headerObject)
  }

  addCell (cellObject) {
    this.cellData.push(cellObject)
  }

  createElement () {
    let table = document.createElement('table')
    let attributes = this.attributes
    if (attributes.length > 0) {
      attributes.forEach(function (attribute) {
        for (var attributeName in attribute) {
          table.setAttribute(attributeName, attribute[attributeName])
        }
      })
    }

    let headerTr = document.createElement('tr')

    this.headers.forEach(function (header) {
      let headerElement = document.createElement('th')
      let attributes = header.attributes
      if (attributes.length > 0) {
        attributes.forEach(function (attribute) {
          for (var attributeName in attribute) {
            headerElement.setAttribute(attributeName, attribute[attributeName])
          }
        })
      }
      let headerText = document.createTextNode(header.headerName)
      headerElement.appendChild(headerText)
      headerTr.appendChild(headerElement)
    })
    table.appendChild(headerTr)

    this.cellData.forEach(function (cellGroup) {
      let dataTr = document.createElement('tr')
      for (var cell in cellGroup) {
        let cellElement = document.createElement('td')
        let attributes = cellGroup[cell].attributes
        if (attributes && attributes.length > 0) {
          attributes.forEach(function (attribute) {
            for (var attributeName in attribute) {
              cellElement.setAttribute(attributeName, attribute[attributeName])
            }
          })
        }

        if (cellGroup[cell].attributes[0].link) {
          let linkElement = document.createElement('a')
          let linkText = cellGroup[cell].text
          let textElement = document.createTextNode(linkText)
          linkElement.appendChild(textElement)
          linkElement.href = 'https://rodeo-iad.amazon.com/BNA3/Search?_enabledColumns=on&enabledColumns=OUTER_SCANNABLE_ID&searchKey=' + linkText
          linkElement.target = '_blank'
          cellElement.appendChild(linkElement)
        } else {
          let cellText = document.createTextNode(cellGroup[cell].text)
          cellElement.appendChild(cellText)
        }
        dataTr.appendChild(cellElement)
      }
      table.appendChild(dataTr)
    })
    return table
  }
}

window.cartModal = function () {
  cartDB.setLocations()
  let groups = []
  let carts = cartDB.largestCarts()

  carts.forEach(function (cart) {
    let area = cart.location
    if (area) {
      let identifier = area.substring(0, 2)
      if (identifier === 'ws') {
        area = 'Pack Station'
      } else if (identifier === 'rs') {
        area = 'Rebin Station'
      } else {
        area = 'Not Scanned Into'
      }
      let allCarts = groups.filter(function (group) {
        return group.area === area
      })
      let found = (allCarts.length > 0)
      if (found) {
        allCarts[0].data.push({self: cart})
      } else {
        groups.push({
          area: area,
          data: [{self: cart}]
        })
      }
    }
  })
  groups.sort(function (a, b) { return b.data.length - a.data.length })
  let totalCarts = 0
  groups.forEach(function (group) {
    totalCarts += group.data.length
  })

  let modal = document.createElement('div')
  modal.setAttribute('id', 'myModal')
  modal.setAttribute('class', 'modal')

  let modalContent = document.createElement('div')
  modalContent.setAttribute('class', 'modal-content')
  modal.appendChild(modalContent)

  let closeButton = document.createElement('span')
  closeButton.innerHTML = '&times'
  closeButton.setAttribute('id', 'modal-close')
  modalContent.appendChild(closeButton)

  let modalHead = document.createElement('div')
  modalHead.setAttribute('id', 'modal-header')

  function displayGrid (name) {
    let list = ['grid-pack-station', 'grid-rebin-station', 'grid-unscanned']

    if (name === 'pack') {
      list.map(id => {
        id === 'grid-pack-station' ? document.getElementById(id).classList.remove('hidden') : document.getElementById(id).classList.add('hidden')
      })
    } else if (name === 'rebin') {
      list.map(id => {
        id === 'grid-rebin-station' ? document.getElementById(id).classList.remove('hidden') : document.getElementById(id).classList.add('hidden')
      })
    } else if (name === 'unscanned') {
      list.map(id => {
        id === 'grid-unscanned' ? document.getElementById(id).classList.remove('hidden') : document.getElementById(id).classList.add('hidden')
      })
    } else { // name == 'all'
      list.map(id => {
        document.getElementById(id).classList.remove('hidden')
      })
    }
  }

  function makeButton (val, action) {
    let button = document.createElement('input')
    button.setAttribute('class', 'bessButton')
    button.type = 'button'
    button.value = val
    let { functionName, args } = action
    button.addEventListener('click', function () {
      functionName.apply(null, args)
    })
    modalHead.appendChild(button)
  }

  makeButton('Packing', {functionName: displayGrid, args: ['pack']})
  makeButton('Rebin', {functionName: displayGrid, args: ['rebin']})
  makeButton('UnScanned', {functionName: displayGrid, args: ['unscanned']})
  makeButton('All', {functionName: displayGrid, args: ['all']})

  modalContent.appendChild(modalHead)

  let row = document.createElement('div')
  row.setAttribute('class', 'row')
  modalContent.appendChild(row)

  groups.forEach(function (group, index) {
    let column = document.createElement('div')
    column.setAttribute('class', 'grid col-sm-12')

    if (group.area === 'Pack Station') {
      column.setAttribute('id', 'grid-pack-station')
    } else if (group.area === 'Rebin Station') {
      column.setAttribute('id', 'grid-rebin-station')
    } else { // group.area == 'Not Scanned Into'
      column.setAttribute('id', 'grid-unscanned')
    }
    row.appendChild(column)

    let columnHeader = document.createElement('div')
    columnHeader.setAttribute('class', 'grid-header')

    let headerData = document.createTextNode(`${group.area} [${group.data.length} / ${totalCarts}]`)
    columnHeader.appendChild(headerData)
    column.appendChild(columnHeader)

    let table = new Table()

    let cartHeaders = ['OSID', 'Location', 'Units', 'Chutes', 'Path', 'Highest Dwell', 'Lowest Dwell']
    cartHeaders.map(header => table.addHeader({headerName: header, attributes: []}))
    let attributes = {class: 'grid-content'}
    table.addAttribute(attributes)

    group.data.forEach(function (cartArray) {
      let cart = cartArray.self
      let osid = cart.cartID
      let location = cart.location
      let units = cart.units
      let chutes = cart.chutes
      let highDwell = cart.highestDwell().hours
      let lowDwell = cart.lowestDwell().hours
      let path = PathAcronyms[cart.shipments[0].processPath]

      let osidCell = {text: osid, attributes: [{class: 'cart', link: true}]}
      let locationCell = {text: location, attributes: [{class: 'location', link: true}]}
      let unitCell = {text: units, attributes: [{class: 'units'}]}
      let chuteCell = {text: chutes, attributes: [{class: 'chutes'}]}
      let highDwellCell = {text: highDwell, attributes: [{class: 'dwell'}]}
      let pathCell = {text: path, attributes: [{class: 'path'}]}
      let lowDwellCell = {text: lowDwell, attributes: [{class: 'dwell'}]}

      if (location.substring(0, 2) === 'ws') {
        let sameLocations = cartDB.sortBy('location', location)
        if (sameLocations.length > 1) {
          let titleString = sameLocations.map(function (l) {
            return l.cartID
          }).join(' ')
          osidCell.attributes.push({duplicate: 'yes'}, {title: titleString})
          locationCell.attributes.push({duplicate: 'yes'}, {title: titleString})
        }
      }

      let finalCell = [osidCell, locationCell, pathCell, unitCell, chuteCell, highDwellCell, lowDwellCell]
      table.addCell(finalCell)
    })
    let tableHTML = table.createElement()
    columnHeader.appendChild(tableHTML)
  })

  document.body.appendChild(modal)
  let optMenu = document.getElementsByClassName('rodeo-navigation-container')[0]
  optMenu.setAttribute('id', 'rodeo-navigation-container')
  let divList = ['fcpn-header', 'rodeo-navigation-container', 'main-panel', 'fcpn-footer']
  divList.map(div => {
    let el = document.getElementById(div)
    el.classList.add('hidden')
  })

  var _modal = document.getElementById('myModal')
  var closeBtn = document.getElementById('modal-close')
  closeBtn.onclick = function () {
    divList.map(div => {
      let el = document.getElementById(div)
      if (div === 'rodeo-navigation-container') el.removeAttribute('id')
      el.classList.remove('hidden')
    })
    _modal.parentNode.removeChild(modal)
    _modal.style.display = 'none'
  }

  _modal.style.display = 'block'
  window.onclick = function (event) {
    if (event.target === _modal) {
      divList.map(div => {
        let el = document.getElementById(div)
        if (div === 'rodeo-navigation-container') el.removeAttribute('id')
        el.classList.remove('hidden')
      })
      _modal.parentNode.removeChild(modal)
      _modal.style.display = 'none'
    }
  }
}

window.toteModal = function () {
  toteDB.setLocations()
  let groups = []
  let totes = toteDB.largestTotes()
  totes.forEach(function (tote) {
    var line = tote.outerScannableID
    if (lineManager.isActive(line)) {
      let pattern = /(^ws[0-9]{3}|^[0-9]{3})/
      if (line.includes('wsSingles') || pattern.test(line)) line = 'Pack Station'
      let toteLine = groups.filter(function (group) {
        return group.lineName === line
      })
      let lineFound = (toteLine.length > 0)
      if (lineFound) {
        // add things to the group here
        toteLine[0].data.push({self: tote})
      } else {
        groups.push({
          lineName: line,
          data: [{self: tote}]
        })
      }
    }
  })

  groups.sort(function (a, b) { return b.data.length - a.data.length })
  let modal = document.createElement('div')
  modal.setAttribute('id', 'myModal')
  modal.setAttribute('class', 'modal')

  let modalContent = document.createElement('div')
  modalContent.setAttribute('class', 'modal-content')
  modal.appendChild(modalContent)

  let closeButton = document.createElement('span')
  closeButton.innerHTML = '&times'
  closeButton.setAttribute('id', 'modal-close')
  modalContent.appendChild(closeButton)
  // let rows = []
  let row = document.createElement('div')
  row.setAttribute('class', 'row')
  modalContent.appendChild(row)

  groups.forEach(function (group, index) {
    let column = document.createElement('div')
    column.setAttribute('class', 'grid col-sm-4')
    row.appendChild(column)

    let columnHeader = document.createElement('div')
    columnHeader.setAttribute('class', 'grid-header')
    let headerData = document.createTextNode(`${group.lineName} [${group.data.length}]`)
    columnHeader.appendChild(headerData)
    column.appendChild(columnHeader)

    let table = new Table()

    let toteHeaders = ['OSID', 'Units', 'Dwell', 'Path / Cond']
    toteHeaders.map(header => table.addHeader({headerName: header, attributes: []}))

    let attributes = {class: 'grid-content'}
    table.addAttribute(attributes)
    let locSet = false
    group.data.forEach(function (toteArray) {
      let tote = toteArray.self
      let osid = tote.toteID
      let units = tote.units
      let dwell = tote.highestDwell().hours
      let path = PathAcronyms[tote.shipments[0].processPath]
      let cond = tote.shipments[0].condition
      let loc = tote.outerScannableID

      let toteCell = {text: osid, attributes: [{class: 'tote', link: true, title: `${path} (${cond})`}]}
      let locCell = {text: loc, attributes: [{class: 'location'}]}
      let unitCell = {text: units, attributes: [{class: 'units'}]}
      let dwellCell = {text: dwell, attributes: [{class: 'dwell'}]}
      let pathCell = {text: `${path} / ${cond}`, attributes: [{class: 'path'}]}
      let pattern = /(^ws[0-9]{3}|^[0-9]{3})/
      var finalCell
      if (loc.includes('wsSingles') || pattern.test(loc)) {
        if (locSet === false) {
          let locationHeader = {headerName: 'Location', attributes: []}
          table.addHeader(locationHeader)
        }
        finalCell = [toteCell, unitCell, dwellCell, locCell, pathCell]
        locSet = true
      } else {
        finalCell = [toteCell, unitCell, dwellCell, pathCell]
      }
      table.addCell(finalCell)
    })
    let tableHTML = table.createElement()
    columnHeader.appendChild(tableHTML)
  })

  document.body.appendChild(modal)
  let optMenu = document.getElementsByClassName('rodeo-navigation-container')[0]
  optMenu.setAttribute('id', 'rodeo-navigation-container')
  let divList = ['fcpn-header', 'rodeo-navigation-container', 'main-panel', 'fcpn-footer']
  divList.map(div => {
    let el = document.getElementById(div)
    el.classList.add('hidden')
  })

  var _modal = document.getElementById('myModal')
  var closeBtn = document.getElementById('modal-close')
  closeBtn.onclick = function () {
    divList.map(div => {
      let el = document.getElementById(div)
      if (div === 'rodeo-navigation-container') el.removeAttribute('id')
      el.classList.remove('hidden')
    })
    _modal.parentNode.removeChild(modal)
    _modal.style.display = 'none'
  }

  _modal.style.display = 'block'
  window.onclick = function (event) {
    if (event.target === _modal) {
      _modal.style.display = 'none'
      divList.map(div => {
        let el = document.getElementById(div)
        if (div === 'rodeo-navigation-container') el.removeAttribute('id')
        el.classList.remove('hidden')
      })
      _modal.parentNode.removeChild(modal)
      _modal.style.display = 'none'
    }
  }
}

window.searchFor = function (identifier) {
  let selector = `#searchArea #${identifier}`
  let input = document.querySelector(selector).value
  let el = document.querySelector(selector)

  if (identifier === 'tote') {
    if (input.length === 3) {
      let shipments = toteDB.findIdentifier(input)
      if (shipments.length > 0) {
        let dwell = shipments[0].shipments[0].dwellTime.hours
        document.getElementById('quickInfo').innerHTML = `Units: ${shipments[0].units}, Dwell: ${dwell}`
        document.querySelector(selector).setAttribute('class', 'good')
      } else {
        document.querySelector(selector).setAttribute('class', 'bad')
      }
    } else {
      document.getElementById('quickInfo').innerHTML = ''
      el.classList.remove('good')
      el.classList.remove('bad')
    }
  } else if (identifier === 'cart') { // if (identifier == 'cart')
    if (input.length === 4) {
      let cart = cartDB.fetchCart(input)
      if (cart.length > 0) {
        document.getElementById('quickInfo').innerHTML = `Units: ${cart[0].units}, Chutes: ${cart[0].chutes}`
        document.querySelector(selector).setAttribute('class', 'good')
      } else {
        document.querySelector(selector).setAttribute('class', 'bad')
      }
    } else {
      document.getElementById('quickInfo').innerHTML = ''
      el.classList.remove('good')
      el.classList.remove('bad')
    }
  }
}

let cartSearch = document.querySelector('#searchArea #cart')
cartSearch.onkeyup = function () {
  searchFor('cart')
}

let toteSearch = document.querySelector('#searchArea #tote')
toteSearch.onkeyup = function () {
  searchFor('tote')
}

cartDB.grabCarts()
toteDB.grabTotes()
