// ==UserScript==
// @name        AutomaticHeadCounts
// @namespace   HeadCounts
// @include     https://fc-pack-man-web-na.amazon.com/*
// @version     2
// @grant       none
// ==/UserScript==

/*
 Modify the object below to hold your desired process paths,
 provide the regex to match the process path name as a key: value pair
*/
const PathList = {
  ppMultiLargeDual: 'wsMultis[6-9].*',
  ppMultiSmallDual: 'wsMultis[1-5].*',
  // only shows AAs signed into the processing app.
  ppMultiWraps:     'wsGiftWrap[1-9]{4}',
  ppSingleLarge:    'wsSingles[1-5].*',
  ppSinglePoly:     'wsSingles[6-8].*',
  // no unique identifier for shoes, count is added with single small
  ppSingleShoe:     'wsNULL',
  ppSingleSmall:    '^[0-9]{3}',
};

function clearTable() {
  document.getElementById('headCount').innerHTML = '';
}

class WorkStation {
  constructor(station) {
    for(var prop in station) {
      this[prop] = station[prop];
    }
  }
}

class WorkStationDB {
  constructor(workstations) {
    this.workstations = workstations || [];
  }

  addWorkStation(stationObject) {
    this.workstations.push(new WorkStation(stationObject));
  }

  populateStations() {
    if(this.workstations.length > 0) {
      this.workstations = [];
    }
    clearTable();
    let stationRows = [];
    let rows = document.querySelectorAll('tr');
    for(var i = 0; i < rows.length; i++) {
      let r = rows[i];
      if(r.attributes.class.value == 'odd' || r.attributes.class.value == 'even') {
        stationRows.push(r);
      }
    }

    stationRows.map((station) => {
      let  [eventType, packerID, workStation, time,
           shipmentID, cpt, batchID, chuteID, uph,
           unitsPacked, active, assignedWS, assignedBy] = Array.from(station.cells).map(c => c.innerText);
      let newStation = new WorkStation({
        'EventType': eventType, 'PackerID': packerID, 'workstation': workStation,
        'Time': time, 'ShipmentID': shipmentID, 'CPT': cpt, 'BatchID': batchID,
        'ChuteID': chuteID, 'UPH': uph, 'UnitsPacked': unitsPacked, 'Active': active,
        'AssignedWS': assignedWS, 'AssignedBy': assignedBy
      });
      this.addWorkStation(newStation);
    });
    this.workstations.splice(0, 1);
  }

  getActiveStations() {
    return this.workstations.filter((station) => {
      return station.Active == 'true';
    });
  }

  regexSearch(prop, expression, arr=this.workstations) {
    let matches = [];
    let regex = new RegExp(expression);
    arr.filter((station) => {
      if(regex.test(station[prop])) {
        matches.push(station);
      }
    });
    return matches;
  }

  headCount() {
    this.populateStations();
    let rows = [];
    for(var p in PathList) {
      let exp = PathList[p];
       let count = this.regexSearch('workstation', exp).length;
       let row = `<tr>
       <td style='border: solid 2px black; padding: 3px'>${p}</td>
       <td style='border: solid 2px black; padding: 3px'>${count}</td>
       </tr>`;
       rows.push(row);
    }

    let table = `<tr>
        <th>Total Headcount</th>
        <th>${this.workstations.length}</th>
      </tr>
      ${rows.join('')}`;
    let tableDiv = document.getElementById('headCount');
    tableDiv.innerHTML = table;
  }

  activeHeadCount() {
    this.populateStations();
    let activeStations = this.getActiveStations();
    let rows = [];
    for(var p in PathList) {
      let exp = PathList[p];
       let count = this.regexSearch('workstation', exp, activeStations).length;
       let row = `<tr>
       <td style='border: solid 2px black; padding: 3px'>${p}</td>
       <td style='border: solid 2px black; padding: 3px'>${count}</td>
       </tr>`;
       rows.push(row);
    }

    let table = `<tr>
        <th>Total Headcount</th>
        <th>${activeStations.length}</th>
      </tr>
      ${rows.join('')}`;
    let tableDiv = document.getElementById('headCount');
    tableDiv.innerHTML = table;
  }

  findPackers () {
    this.populateStations()
    let rows = []
    let packerList = prompt('Packer Logins (seperate with spaces)').split(' ').filter(i => i.length > 1)
    console.log(packerList)
    packerList.map((packer) => {
      let search = this.workstations.filter((station) => {
        return station.PackerID.trim() === packer.trim()
      })
      console.log('Search: ' + search)
      if (search.length > 0) {
        let row = `<tr>
        <td style='border: solid 2px black; padding: 3px'>${packer}</td>
        <td style='border: solid 2px black; padding: 3px'>${search[0].workstation.trim()}</td>
        </tr>`
        rows.push(row)
      } else {
        let row = `<tr>
        <td style='border: solid 2px black; padding: 3px'>${packer}</td>
        <td style='border: solid 2px black; padding: 3px'>&nbsp;</td>
        </tr>`
        rows.push(row)
      }
    })
    let table = `<tr>
        <th>Login</th>
        <th>Location</th>
      </tr>
      ${rows.join('')}`;
    let tableDiv = document.getElementById('headCount');
    tableDiv.innerHTML = table;
    // return results
  }

}

window.stationDB = new WorkStationDB();

let headCountDiv = `<div style='z-index: 100; position: absolute; top: 10%; left: 75%' id='headcount-container'></div>`;
document.body.innerHTML += headCountDiv;
document.querySelector('.container').style = 'width: 100%!important'
document.querySelectorAll('.nav.pull-right')[0].innerHTML += '<li><a href="javascript:stationDB.headCount()">[Get Headcount]</a></li>';
document.querySelectorAll('.nav.pull-right')[0].innerHTML += '<li><a href="javascript:stationDB.activeHeadCount()">[Active Headcount]</a></li>';
document.querySelectorAll('.nav.pull-right')[0].innerHTML += '<li><a href="javascript:stationDB.findPackers()">[VTO]</a></li>';
let myTable = `<table id="headCount" style="z-index:999; background-color: white; padding: 15px;"></table>`;
document.getElementById('headcount-container').innerHTML += myTable;
