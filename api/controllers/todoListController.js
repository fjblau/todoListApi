'use strict';


var mongoose = require('mongoose'),
  Task = mongoose.model('Tasks');

exports.list_all_tasks = function(req, res) {
  Task.find({}, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};




exports.create_a_task = function(req, res) {
  var new_task = new Task(req.body);
  new_task.save(function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};


exports.read_a_task = function(req, res) {
  Task.findById(req.params.taskId, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};


exports.update_a_task = function(req, res) {
  Task.findOneAndUpdate({_id: req.params.taskId}, req.body, {new: true}, function(err, task) {
    if (err)
      res.send(err);
    res.json(task);
  });
};


exports.delete_a_task = function(req, res) {
  Task.remove({
    _id: req.params.taskId
  }, function(err, task) {
    if (err)
      res.send(err);
    res.json({ message: 'Task successfully deleted' });
  });
};

function parse_gps( input ) {
  
  if( input.indexOf( 'N' ) == -1 && input.indexOf( 'S' ) == -1 &&
      input.indexOf( 'W' ) == -1 && input.indexOf( 'E' ) == -1 ) {
      return input.split(',');
  }
  
  var parts = input.split(/[°'"]+/).join(' ').split(/[^\w\S]+/);
  
  var directions = [];
  var coords = [];
  var dd = 0;
  var pow = 0;
  var i = 0;

  for( i in parts ) {
  
      // we end on a direction
      if( isNaN( parts[i] ) ) {
  
          var _float = parseFloat( parts[i] );
  
          var direction = parts[i];
  
          if( !isNaN(_float ) ) {
              dd += ( _float / Math.pow( 60, pow++ ) );
              direction = parts[i].replace( _float, '' );
          }
  
          direction = direction[0];
  
          if( direction == 'S' || direction == 'W' )
              dd *= -1;
  
          directions[ directions.length ] = direction;
  
          coords[ coords.length ] = dd;
          dd = pow = 0;
  
      } else {
  
          dd += ( parseFloat(parts[i]) / Math.pow( 60, pow++ ) );
  
      }
  
  }
  
  if( directions[0] == 'W' || directions[0] == 'E' ) {
      var tmp = coords[0];
      coords[0] = coords[1];
      coords[1] = tmp;
  }
  
  return coords;
}

exports.calcCF = function(req,res) {
  var modes = {
    'roadTransport' : 62,
    'railTransport' : 22,
    'bargeTransport' :31,
    'shortSea' :16,
    'intermodalRoadRail' :26,
    'intermodalRoadBarge' :34,
    'intermodalRoadShortSea' :21,
    'pipeline' :5,
    'deepSeaContainer' :8,
    'deepSeaTanker':5,
    'airfreight' :602
  };
  var cfFrom = parse_gps(req.body.CFfrom);
  var cfTo = parse_gps(req.body.CFto);
  
  var lat1 = cfFrom[0];
  var lon1 = cfFrom[1];

  var lat2 = cfTo[0];
  var lon2 = cfTo[1];

  function distance(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = (lat2 - lat1) * Math.PI / 180;  // deg2rad below
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = 
       0.5 - Math.cos(dLat)/2 + 
       Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
       (1 - Math.cos(dLon))/2;
  
    return R * 2 * Math.asin(Math.sqrt(a));
  };

  var d = distance(lat1, lon1, lat2, lon2);

  //var phi1 = lat1.toRad(), phi2 = lat2.toRad(), deltalambda = (lon2-lon1).toRad(), R = 6371e3; 
  //var d = Math.acos( Math.sin(phi1)*Math.sin(phi2) + Math.cos(phi1)*Math.cos(phi2) * Math.cos(deltalambda) ) * R;

  var ef =  modes[req.body.transportMode];
  var km = req.body.km;
  var tonnage = req.body.tonnage;
  var cf = ef * km * tonnage;
  res.json({LocFrom: cfFrom, LocTo: cfTo, distance: d, tonnage: req.body.tonnage,  transportMode: req.body.transportMode, CarbonFootrint:cf});
};
