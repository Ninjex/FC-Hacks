const Label = {
  B1    : 'event_btn_1',
  B2    : 'event_btn_2',
  B3    : 'event_btn_3',
  CNT   : 'continue',
  ION   : 'LithiumIon',
  ION_H : 'LithiumIon_TD',
  MTL   : 'LithiumMetal',
  MTL_H : 'LithiumMetal_TD',
};

const Box = {
  // populate these when return to work
  A1    : '',   A3    : '',
  AE    : '',   AD    : '',
  A5    : '',   BF    : '',
  V3    : '',   V4    : '',
  B2A   : '',   BA8   : '',
  BA    : '',   B4    : '',
  BG    : '',   S5    : '',
  A9    : '',   A7    : '',
}

const ToolBox = {

     init: function() {
       for(var apps in this) {
         //console.log('App: ' + apps);
         for(var func in this[apps]) {
           //console.log('func: ' + func);
           this[apps][func].parent = this[apps];
         }
       }
        delete this.init;
        return this;
    },

  kickout: {

    killed: false,
    off: function() { this.killed = true; },
    on:  function() { this.killed = false; },
    scan: (data) => { handleScan(data); },

    toggle: function() {
      if(this.killed) this.killed = false; else this.killed = true;
    }, // end toggle()

    inject: {
      call: function() {
        data = prompt("Data to Inject");
        updateLog('Injected: ' + data );
        this.parent.scan(data);
      },
      desc: 'Scan arbitrary data',
      shortcut: 96, // NumPad: 0
    }, // end inject()

    override: {
      call: function() {
        updateLog("Overriding Weight of Current Unit");
        this.parent.scan(Label.CNT);
        this.parent.scan(Label.B3);
      },
      desc: 'Tell the system that the item has the current weight',
    }, // end override()

    lithiumMetal: {
      call: function() {
        updateLog("Injecting Lithium Metal Label Scans");
        this.parent.scan(Label.MTL);   // scan lithium metal shiping label
        this.parent.scan(Label.MTL_H); // scan lithium metal handling label
      },
      desc: 'Scan lithium Metal Battery Labels',
      shortcut: 77, // m
    }, // end lithiumMetal()

    lithiumIon: {
      call: function()  {
        updateLog("Injecting Lithium Ion Label Scans");
        this.parent.scan(Label.ION);
        this.parent.scan(Label.ION_H);
      },
      desc: 'Scan Lithium Ion Battery Labels',
      shortcut: 73, // i
    }, // end lithiumIon()

    bruteForce: {
      call: () => {

      },
      desc: 'Bruteforce a shipment, trying all possible box combinations',
    }, // end bruteForce()

    scanBox: {
      call: function() {
        var box_code = '';
        this.parent.scan(box_code);
      },
      desc: 'Scan a set box code',
      shortcut: 'foo' // foo
    }, // end scanBox()

    shotgun: {
      call: function()  {
        var asin   = prompt("ASIN");
        var amount = Number(prompt("How many units?"));
        updateLog("Shotgun: " + asin + ' * ' + amount);
        for(var x = amount; x--;) {
          this.parent.scan(asin);
          this.parent.scan(Label.CNT);
          this.parent.scan(Label.B3);
          this.parent.override.call();
        }
      },
      desc: 'Scan an ASIN and override that item weight multiple times',
      shortcut: 83, // 's'
    }, // end shotgun()

    problemSolve: {
      call: () => {
        updateLog("Sending to ProblemSolve");
        this.parent.scan(Label.CNT);
        this.parent.scan(Label.B1);
        this.parent.scan(Label.CNT);
      },
      desc: 'Send a shipment to problem solve (something is wrong with it)',
      shortcut: 101, // NumPad: 5
    }, // end problemSolve()
  }, // end kickout

  packapp: {
    killed: false,
    off: function() { this.killed = true; },
    on:  function() { this.killed = false; },
    toggle: function() {
      if(this.killed) this.killed = false; else this.killed = true;
    },
    inject: {
      call: () => {
        alert('packapp inject() differs from ko inject()');
      },
      shortcut: 97, // NumPad: 1
    }
  }

}.init(); // end ToolBox

var toolbox = Object.create(ToolBox);

window.onkeydown = function(e) {
  e = e || event
  for(var app in toolbox) {
    tools = toolbox[app];
    //console.log('status: ' + tools.killed);
    if(tools.killed === false) {
      //console.log(toolbox[app].killed);
      for(var tool in tools) {
        method = tools[tool];
        if(e.keyCode === method.shortcut) method.call();
      }
    }
  }
}
