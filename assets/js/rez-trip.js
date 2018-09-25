(function() {
  angular
    .module('rezTrip', [], function($interpolateProvider) {
      $interpolateProvider.startSymbol('[[');
      $interpolateProvider.endSymbol(']]');
    })
    .value('rt3api', new Rt3Api({
      portalId: 'westhousehotelnewyork',
      hotelId: 'NYCWST',
      defaultLocale: 'en',
      defaultCurrency: 'USD'
    }))

   .config(function($locationProvider) {
      $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false
      });
    })

    .directive('onSearchChanged', function (rt3Search) {
      return {
        scope: false,
        restrict: 'A',
        link: function (scope, element, attrs) {
          scope.$watch('search.params', function (params) {
            if (params.arrival_date && params.departure_date) {
              scope.$eval(attrs.onSearchChanged);
            }

          }, true);

          scope.$eval(attrs.onSearchChanged);
        }
      };
    })
    .controller('roomDetail', ['$scope', 'rt3Search', 'rt3Browser','$timeout','$filter','$http', function($scope, rt3Search, rt3Browser,$timeout,$filter,$http) {
        //$(".loading").css("display","block");

        setTimeout(function(){
          $(".loading").fadeOut('slow');
          $("#adults").val(1);
          $("#children").val(0);
        },2000);


    }])
    .controller('loader', ['$scope', function($scope) {
      //$(".loading").css("display","block");

      setTimeout(function(){
        $(".roomPageContent").css("display","block");
        $(".loading").fadeOut('slow');
      },1200);


   }])
    .controller('offerDetail', ['$scope', 'rt3SpecialRates', 'rt3Browser','$timeout','$filter','$q', function($scope, rt3SpecialRates, rt3Browser,$timeout,$filter,$q) {
      window.onhashchange = function() {
        window.location.reload();
      }
        $scope.reloadPage = function(){$window.location.reload();}
         //$(".loading").css("display","block");
         $q.when(rt3SpecialRates.ready).then(function(response){
           var oList = rt3SpecialRates.special_rates;;
           var oName = window.location.hash.substr(1); //$("#offerId").val();
           var tmpName;
           for(var j= 0 ; j < oList.length ; j++){
                oName = $filter ('formatNameForLink')(oName);
                tmpName = $filter ('formatNameForLink')(oList[j].rate_plan_name);
               if(tmpName == oName){
                  // find previous and next rooms name
                  if(j > 0){
                     $scope.prevOfferName = oList[j-1].rate_plan_name;
                  }

                  if(j < oList.length -1){
                     $scope.nextOfferName = oList[j+1].rate_plan_name;
                  }
                  break;
               }
           }
           $(".loading").fadeOut('slow');
            $(".offerPageMainContent").css("display","block");
        });



    }])
    .controller('offerRates', ['$scope', '$q', 'rt3api', function($scope, $q, rt3api) {
        var ppc_offers = [];

        $(".ppc-offers-list [name = 'offers_code[]']").each(function(key, ele) {
            ppc_offers.push({
                    'offer_code' : $(ele).val(),
                    'room_code'  : $(ele).data('roomcode')
            })

        });
        $("#ppcOfferForm").submit(function() {

            fetchPPCOfferPrice ();
        });


        function fetchPPCOfferPrice() {
            $(".floating-price").addClass('loading-dots');
            var arrival_date = $("#arrival_date").val() != '' ? $("#arrival_date").val() : null;
            var departure_date = $("#departure_date").val() != '' ? $("#departure_date").val() : null;
            var adults = $("#adults").val();
            var children = $("#children").val();

            var common_params = {
                            arrival_date: arrival_date,
                            departure_date: departure_date,
                            adults: adults,
                            children: children,
                            ip_address: sessionStorage.ip_add
                        };
            var rate_params , params, offer;
            $scope.noprice = '';
            $scope.ratePlans = [];
            for (var i = 0 ; i< ppc_offers.length; i++){
               (function(i){
                 offer = ppc_offers[i];
                 rate_params = { rate_code: offer.offer_code};
                 var params = $.extend({}, common_params, rate_params);
                 $scope.noprice = 'NA';
                 $scope.ratePlans[offer.offer_code] = [];
                 $scope.ratePlans[offer.offer_code].price = '';
                 $scope.ratePlans[offer.offer_code].urlParams = '?rate_code='+offer.offer_code+'&arrival_date='+arrival_date+'&departure_date='+departure_date+'&adults[]='+adults+'&children[]='+children;//+'&room_id='+offer.room_code;
                 $q.when(rt3api.getAllAvailableRooms(params)).then(function(response) {
                       var rooms = response.rooms;
                       var roomRate;
                       if(rooms.length > 0 && rooms[0].rate_code == ppc_offers[i].offer_code) {
                         roomRate = rooms[0].min_discounted_average_price[0] || rooms[0].min_average_price[0];
                         $scope.ratePlans[ppc_offers[i].offer_code].price = '$' + Math.round(roomRate);
                       }
                       $(".floating-price").show().removeClass('loading-dots');

                 });
               })(i);
            }
        }

        fetchPPCOfferPrice ();


    }])
    .controller('bookingWidget', ['$scope', 'rt3Search', 'rt3Browser', function($scope, rt3Search, rt3Browser) {
      var self = this;

      this.arrivalOptions = {
        minDate: 0
      }
      this.departureOptions = {
        minDate: 1
      }
      // Todo move to service
      this.chachgeMinDate = function(target) {
        var today = new Date().getDate();
        var arr = new Date($scope.search.params.arrival_date).getDate();
        var arrm = new Date($scope.search.params.arrival_date).getMonth();
        var gettonightstatus= rt3Browser.roomsTonight.length;
        if(gettonightstatus == 0)
        {
          $(".price").hide();
        }
       // console.log(gettonightstatus);
        if (target == 'departure') {
          //self.departureOptions.minDate = (arr-today) + 1;
          var dept= new Date($scope.search.params.arrival_date);
          var theDay=new Date(dept.setDate(dept.getDate() + 1));
          self.departureOptions.minDate=(theDay.getDate()-today+1);
          var newDay=theDay.toISOString().slice(0,10);
          $scope.search.params.departure_date=newDay;
          //console.log("departure"+newDay)
          rt3Browser.getdiff=false;


        }

         if(target == 'depart')
        {


         var date1 = new Date($scope.search.params.arrival_date);
        var date2 = new Date($scope.search.params.departure_date);
        var timeDiff = Math.abs(date2.getTime() - date1.getTime());
        var diffDays = Math.ceil(timeDiff / (1000*3600*24));
        if(diffDays >=2)
        {
          rt3Browser.getdiff=true;
        }
        }
      }
    }]);
})();
