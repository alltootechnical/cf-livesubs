function toggle() {
    var x = document.getElementById('info');
    if (x.style.display === 'none') x.style.display = 'block';
    else x.style.display = 'none';
}

var app = angular.module('myApp', []);

app.filter('formatByte', function () {
  'use strict';

  return function (size) {
    var exp = Math.log(size) / Math.log(1024) | 0;
    return (size / Math.pow(1024, exp)).toFixed(2) + '\xa0' +
      ((exp > 0) ? 'kMGTPEZY'[exp - 1] + 'B' : 'B');
  };
});

function SubsCtrl($scope, $http, $interval, $timeout) {

    $scope.submissions = [];
    var temp = [];
    var first_run = true;
    var how_many = 400;

    $scope.ratings = {};
    $scope.hiddenVerdicts = false;
    $scope.currSubid = 0;

    $scope.toggleVerdicts = function () {
        $scope.hiddenVerdicts = !$scope.hiddenVerdicts;
        $scope.currSubid = $scope.submissions.result[0].id;
        alert("Verdicts will now be " + ($scope.hiddenVerdicts ? "hidden" : "shown"));
    };

    $scope.filtered = false;
    $scope.users = [];
    var kw = "";
    $scope.filterUsers = function () {
        var kw2 = prompt('Enter the list of usernames separated with a comma. Leave blank or click "Cancel" to remove filtering.', kw);
        if (kw2 == null || kw2 == "") $scope.filtered = false;
        else {
            kw = kw2;
            $scope.filtered = true;
            $scope.users = kw.split(",");
        }
    }

    $scope.verdict_map = {
    undefined: 'QU',
    'FAILED': 'FA',
    'OK': 'AC',
    'PARTIAL': 'PA',
    'COMPILATION_ERROR': 'CE',
    'RUNTIME_ERROR': 'RTE',
    'WRONG_ANSWER': 'WA',
    'PRESENTATION_ERROR': 'PE',
    'TIME_LIMIT_EXCEEDED': 'TLE',
    'MEMORY_LIMIT_EXCEEDED': 'MLE',
    'IDLENESS_LIMIT_EXCEEDED': 'ILE',
    'SECURITY_VIOLATED': 'SV',
    'CRASHED': 'CR',
    'INPUT_PREPARATION_CRASHED': 'IPC',
    'CHALLENGED': 'CH',
    'SKIPPED': 'SK',
    'TESTING': 'TE',
    'REJECTED': 'RJ',
    'HIDDEN': 'X'
    };

    $scope.tableLimit = 20;
    $scope.setLimit = function(num) {
        $scope.tableLimit = num;
    }

    $scope.getIndexFromId = function (arr, id) {
        for (var i = 0; i < arr.length; i++) {
            if (id == arr[i].id) {
                return i;
            }
        }
        return -1;
    }

    $scope.loadSubs = function() {
        // var c = ['https://cors-anywhere.herokuapp.com/', 'https://crossorigin.me/'];
        // var c = [''];
        var c = ['https://crossorigin.me/'];
        var cors = c[Math.floor(Math.random()*c.length)];
        $http.get(cors + 'http://codeforces.com/api/problemset.recentStatus?count=' + how_many).success(function(data, status) {
            var lastsub = -1;
            if (first_run) {temp = data; first_run = false; $scope.submissions = data; lastsub = $scope.submissions.result[0].id;}
            else {
                lastsub = $scope.submissions.result[0].id;
                //$scope.currSubid = lastsub;
                console.log(lastsub);
                if (data.result[0].id > lastsub) {
                    var ap = []
                    for (var i = 0; data.result[i].id > lastsub; i++) {
                        if ($scope.getIndexFromId($scope.submissions.result, $scope.submissions.result[i].id) != -1) {
                            console.log('pushed sub id ' + data.result[i].id + " " + data.result[i].verdict);
                            if ((data.result[i].verdict !== "TESTING" && data.result[i].verdict != undefined)) {
                                if ($scope.hiddenVerdicts) {
                                    data.result[i].verdict = "HIDDEN";
                                    data.result[i].timeConsumedMillis = 0;
                                    data.result[i].memoryConsumedBytes = 0;
                                }
                            }
                            ap.unshift(data.result[i]);
                        }
                    }
                    // console.log("ap length = " + ap.length);
                    // var i = 0;
                    // $scope.pushToTbl = function() {
                    //     // console.log("repush " + ap[i]);
                    //     if (ap[i] != undefined) {
                    //         console.log("repushing id " + ap[i].id);
                    //         $scope.submissions.result.unshift(ap[i]);
                    //     }
                    //     if (i++ < ap.length) $timeout($scope.pushToTbl, 0);
                    //     // if (i++ < ap.length) $scope.pushToTbl();
                    // };
                    // if(typeof ap != undefined) $scope.pushToTbl();
                    // console.log("repush done");

                    for (var i = 0; i < ap.length; i++) {
                        $scope.submissions.result.unshift(ap[i]);
                        setTimeout(function(){}, 100);
                        // $timeout(arguments.callee, 100);
                    }
                    lastsub = $scope.submissions.result[0].id;
                }
                for (var i = 0; i < data.result.length; i++) {
                    for (var j = 0; j < $scope.submissions.result.length; j++) {
                        if (data.result[i].id == $scope.submissions.result[j].id && data.result[i].verdict !== $scope.submissions.result[j].verdict) {
                            if ($scope.submissions.result[j].verdict != undefined && data.result[i].verdict === "TESTING") {
                                console.log("SUPPRESSED: " + $scope.submissions.result[j].id + " " + $scope.submissions.result[j].verdict + " --> " + data.result[i].id + " " + data.result[i].verdict)
                                continue;
                            }
                            var row = data.result[i];
                            console.log("cmp: " + data.result[i].id + " >" + $scope.currSubid);
                            // hide only those submissions coming after the click
                            if ((data.result[i].verdict !== "TESTING" && data.result[i].verdict != undefined) && data.result[i].id > $scope.currSubid) {
                                if ($scope.hiddenVerdicts) {
                                    data.result[i].verdict = "HIDDEN";
                                    data.result[i].timeConsumedMillis = 0;
                                    data.result[i].memoryConsumedBytes = 0;
                                }
                            }
                            console.log($scope.submissions.result[j].id + " " + $scope.submissions.result[j].verdict + " --> " + data.result[i].id + " " + data.result[i].verdict)
                            $scope.submissions.result.splice($scope.getIndexFromId($scope.submissions.result, $scope.submissions.result[j].id), 1, row);
                        }
                    }
                }
                console.log('updating');
            }

        }).error(function (status) {
            console.log("huy sobra na raw!!!");
        });
    };

    $scope.getRating = function(uname) {
        $http.get('http://codeforces.com/api/user.info?handles=' + uname).success(function(data, status) {
            $scope.ratings[uname] = data[0].rating;
        });
    }

    $scope.now = new Date().getTime()/1000|0;

    $interval($scope.loadSubs, 1000);

}
