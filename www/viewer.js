//-------------------------------------------------------------------------------
//  MAP STUFF
//-------------------------------------------------------------------------------

COLORS = {
  player1: 'lightblue',
  player2: 'orange',
  neutral: 'gray'
}

function Region(svg, id) {
  return {
    setColor: function(color) {
      var s = svg.getElementById('region' + id);
      s.style.fill = color;
      return this;
    }, 
    setText: function(text) {
      var s = svg.getElementById('region' + id + 'Text');
      s.innerHTML = text;
      return this;
    }
  }
}

function Map(svg) {

  return {
    region: function(id) {
      return Region(svg, id);
    },
    maxRegion: function() {
      return 42;  // No joke! 
    },
    forEach: function(fn) {
      for (var i = 1; i <= this.maxRegion(); i++) {
        fn(this.region(i));
      }
    },
    clear: function() {
      this.forEach(function(region) {
        region.setColor('');
        region.setText('');
      });
    }
  }
}

//-------------------------------------------------------------------------------
//  GAME STUFF
//-------------------------------------------------------------------------------

function splitLogIntoRounds(log) {
  var ret = [[]];
  
  $.each(log.split('\n'), function(i, line) {
    if (line.match('Round \\d+')) {
      ret.push([]);
    } else {
      ret[ret.length-1].push(line);
    }
  });

  return ret;
}

function Replay(log, map) {
  var rounds = splitLogIntoRounds(log);

  function playRound(round) {
    $.each(round, function(i, line) {
      if (line.match('update_map')) {
        updateMap(line.substr('update_map '.length).split(' '));
      }
    });
  }

  function updateMap(commands) {
    // Commands is an array of [region player amount] tuples
    while (commands.length >= 3) {
      var r = map.region(commands[0]);
      r.setColor(COLORS[commands[1]]);
      r.setText(commands[2]);

      commands = commands.slice(3);
    }
  }

  return {
    playUntil: function(round) {
      map.clear();
      for (var i = 0; i <= round; i++) {
        playRound(rounds[i]);
      }
    },
    get: function(round) {
      return rounds[round];
    },
    maxRound: function() {
      return rounds.length - 1;
    }
  }
}

function FakeReplay() {
  return {
    playUntil: function() { },
    get: function() { return []; },
    maxRound: function() { return 0; }
  };
}


//-------------------------------------------------------------------------------
//  BOOTSTRAP & UI STUFF
//-------------------------------------------------------------------------------

function UIModel(map) {
  var self = this;

  self.replay = ko.observable(null);
  self.title = ko.observable('');
  self.round = ko.observable(0);
  self.replays = ko.observableArray([]);
  self.selectedInList = ko.observable('');

  self.setReplay = function(file, replay_) {
    self.replay(replay_);
    self.title(file);
    self.round(0);
    replay(0);
  }

  function replay(rnd) {
    var roundNr = parseInt(rnd, 10);
    self.replay().playUntil(roundNr);
  }
  self.round.subscribe(replay);

  self.roundCommands = ko.computed(function() {
    if (!self.replay()) return '';

    return $.map(self.replay().get(self.round()), function(line) {
      return '<p>' + line + '</p>';
    }).join('\n');
  });

  self.canAdvance = function() {
    return self.round() < self.replay().maxRound();
  }
  self.advance = function() {
    if (self.canAdvance()) {
      self.round(self.round() + 1);
    }
  }
  self.canRegress = function() {
    return self.round() > 0;
  }
  self.regress = function() {
    if (self.canRegress()) {
      self.round(self.round() - 1);
    }
  }
  self.begin = function() {
    self.round(0);
  }
  self.end = function() {
    self.round(self.replay().maxRound());
  }
  self.refreshList = function() {
    $.get('/list', function(data) {
      self.replays(data.split('\n'));
    });
  }
  self.selectedInList.subscribe(function(selected) {
    if (!selected) return;
    $.get('/logs/' + selected, function(data) {
      self.setReplay(selected, Replay(data, map));
    })
  });
}

$(function() {
  $('#map').on('load', function() {
    var svgRoot = document.getElementById('map').contentDocument.getElementsByTagName('svg')[0];
    var map = Map(svgRoot);

    var ui = new UIModel(map);
    ui.setReplay('', FakeReplay());  // Bogus
    ko.applyBindings(ui);

    ui.refreshList();

    Mousetrap.bind('g', function() { ui.begin(); return false; });
    Mousetrap.bind('k', function() { ui.regress(); return false; });
    Mousetrap.bind('j', function() { ui.advance(); return false; });
    Mousetrap.bind('G', function() { ui.end(); return false; });
  });
})
