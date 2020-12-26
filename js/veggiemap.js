// The "use strict" directive helps to write cleaner code.
"use strict";


/* Definition (polyfill) for the function replaceAll
   for older browser versions (before 2020)
   Can be removed after some years. */
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (old_str, new_str){
        return this.replace(new RegExp(old_str, 'g'), new_str);
    };
}

// Define marker groups
let parentGroup = L.markerClusterGroup({showCoverageOnHover: false, maxClusterRadius: 20});
let vegan_only = L.featureGroup.subGroup(parentGroup, {});
let vegetarian_only = L.featureGroup.subGroup(parentGroup, {});
let vegan_friendly = L.featureGroup.subGroup(parentGroup, {});
let vegan_limited = L.featureGroup.subGroup(parentGroup, {});
let vegetarian_friendly = L.featureGroup.subGroup(parentGroup, {});
let subgroups = { vegan_only, vegetarian_only, vegan_friendly, vegan_limited, vegetarian_friendly };

let map;
let locate_control;
let layerContol;
let languageControl;


function veggiemap() {

  // TileLayer
  let tileOSM = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; <a href='https://openstreetmap.org'>OpenStreetMap</a> contributors, <a href='https://creativecommons.org/licenses/by-sa/2.0/'>CC-BY-SA</a>",
    maxZoom: 18
  });

  // Map
  map = L.map("map", {
    layers: [tileOSM],
    center: [51.42, 12.0],
    zoom: 11,
    worldCopyJump: true,
    zoomControl: false
  });

  // Add zoom control
  L.control.zoom({position:'topright'}).addTo(map);

  // Define overlays (each marker group gets a layer) + add legend to the description
  let overlays = {
    "<div class='legendRow'>vegan_only</div>" : vegan_only,
    //"<div class='legendRow' title='Place which offers only vegan food.'><div class='firstCell vegan_only'></div><div class='secondCell'></div><div class='thirdCell' id='n_vegan_only'></div></div>" : vegan_only,
    "<div class='legendRow' title='Place which offers only vegetarian and vegan food.'><div class='firstCell vegetarian_only'></div><div class='secondCell'></div><div class='thirdCell' id='n_vegetarian_only'></div></div>" : vegetarian_only,
    "<div class='legendRow' title='Place which offers also vegan food.'><div class='firstCell vegan_friendly'></div><div class='secondCell'></div><div class='thirdCell' id='n_vegan_friendly'></div></div>" : vegan_friendly,
    "<div class='legendRow' title='Place with limited vegan offer (usualy that means, you have to ask for it).'><div class='firstCell vegan_limited'></div><div class='secondCell'></div><div class='thirdCell' id='n_vegan_limited'></div></div>" : vegan_limited,
    "<div class='legendRow' title='Place which offers also vegetarian food, but no vegan.'><div class='firstCell vegetarian_friendly'></div><div class='secondCell'></div><div class='thirdCell' id='n_vegetarian_friendly'></div></div><br /><br /><div id='date'></div>" : vegetarian_friendly
  };

  veggiemap_populate(parentGroup);

  // Enable the on-demand popup and tooltip calculation
  parentGroup.bindPopup(calculatePopup);
  parentGroup.bindTooltip(calculateTooltip);

  // Close the tooltip when opening the popup
  parentGroup.on("click", function(e){
    if(parentGroup.isPopupOpen()){
      parentGroup.closeTooltip();
    }
  })

  // Add hash to the url
  let hash = new L.Hash(map);

  // Add info button
  let infoButton = L.easyButton(
    '<div class="info-button"></div>',
    function(btn, map){toggleInfo()}
  ).addTo(map);
  infoButton.setPosition('topright');

  // Add button for search places
  L.Control.geocoder().addTo(map);

  // Add button to search own position
  locate_control = L.control.locate({
    icon: 'locate_icon',
    iconLoading: 'loading_icon',
    showCompass: true,
    locateOptions: {maxZoom: 16},
    position:'topright'
  }).addTo(map);

  // Add layer control button
  layerContol = L.control.layers(null, overlays);
  layerContol.addTo(map);
  console.log(layerContol);

  // Add language control button
  languageControl = L.languageSelector({
      languages: new Array(
      // TODO: replace Array with foreach ...

          L.langObject('de', 'Deutsch'),
          L.langObject('en', 'English'),
		  L.langObject('eo', 'Esperanto'),
          L.langObject('fi', 'Suomi'),
          L.langObject('fr', 'Français')
      ),
      callback: changeLanguage,
      //title: 'Language',  // TODO: Add real title and translate it
      vertical: true,
	  collapsed:true
  });
  languageControl.addTo(map);

  // Add scale control
  L.control.scale().addTo(map);
}


/**
 * Add or replace the language parameter of the URL and reload the page.
 * @param String id of the language
 */
function changeLanguage(selectedLanguage) {
    window.location.href = updateURLParameter(window.location.href, 'lang', selectedLanguage);
}

/**
 * Add or replace a parameter (with value) in the given URL.
 * By Adil Malik, https://stackoverflow.com/questions/1090948/change-url-parameters/10997390#10997390
 * @param String url the URL
 * @param String param the parameter
 * @param String paramVal the value of the parameter
 * @return String the changed URL
 */
function updateURLParameter(url, param, paramVal) {
    var theAnchor = null;
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";

    if (additionalURL) {
        var tmpAnchor = additionalURL.split("#");
        var theParams = tmpAnchor[0];
        theAnchor = tmpAnchor[1];
        if(theAnchor) {
            additionalURL = theParams;
        }

        tempArray = additionalURL.split("&");

        for (let i=0; i<tempArray.length; i++) {
            if(tempArray[i].split('=')[0] != param) {
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }        
    } else {
        var tmpAnchor = baseURL.split("#");
        var theParams = tmpAnchor[0];
        theAnchor  = tmpAnchor[1];

        if(theParams) {
            baseURL = theParams;
        }
    }

    if(theAnchor) {
        paramVal += "#" + theAnchor;
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}











// Function to toogle the visibility of the Info box.
function toggleInfo() {
  let element = document.getElementById('information');    // get the element of the information window
  let computedStyle = window.getComputedStyle(element);    // get the actual style information
    if (computedStyle.display != "block") {
      element.style.display = "block";
    }
    else {
      element.style.display = "none";
    }
}

// Function to hide the spinner.
function hideSpinner() {
  let element = document.getElementById('spinner');
  element.style.display = "none";
}

// Function to put the numbers of markers into the legend.
//   The numbers are calculated using the refresh.py script and stored in the places.json file.
function stat_populate() {
  const url = "data/stat.json";
  fetch(url)
  .then(response => response.json())
  .then(data => onEachFeatureStat(data))
  .catch(error  => {console.log('Request failed', error);});
}

function onEachFeatureStat(data) {
  for (let category in data.stat[data.stat.length -1]){
    let number_of_elements = data.stat[data.stat.length -1][category];
    // document.getElementById(category).innerHTML = "(" + number_of_elements + ")";     // TODO: Testweise abgeschalten
  }
}

// Function to get the information from the places json file.
function veggiemap_populate(parentGroup) {
  const url = "data/places.min.json";
  fetch(url)
  .then(response => response.json())
  .then(geojson => geojsonToMarkerGroups(geojson.features))
  .then(markerGroups => {
    Object.entries(subgroups).forEach(([key, subgroup]) => {
      // Bulk add all the markers from a markerGroup to a subgroup in one go
      // Source: https://github.com/ghybs/Leaflet.FeatureGroup.SubGroup/issues/5
      subgroup.addLayer(L.layerGroup(markerGroups[key]));
      map.addLayer(subgroup);
    });

    // Don't show vegetarian_friendly on startup
    map.removeLayer(vegetarian_friendly);

    // Reveal all the markers and clusters on the map in one go
    map.addLayer(parentGroup);

    // Call the function to put the numbers into the legend
    stat_populate();

    // Check if the data entries are complete
    //checkData(parentGroup);

    // Hide spinner
    hideSpinner();
  })
  .catch(error  => {console.log('Request failed', error);});
}

// Process the places GeoJSON into the groups of markers
function geojsonToMarkerGroups(features) {
    const groups = {};
    features.forEach(feature => {
        const eCat = feature.properties.category;
        if (!groups[eCat]) groups[eCat] = [];
        groups[eCat].push(getMarker(feature));
    });
    return groups;
}

// Function to get the marker.
function getMarker(feature) {
    let eLatLon = [feature.geometry.coordinates[1],feature.geometry.coordinates[0]];
    let eSym = feature.properties.symbol;
    let eNam = feature.properties.name;
    let eIco = feature.properties.icon;
    let eCat = feature.properties.category;

    let marker = L.marker(eLatLon, { icon: getIcon(eIco, eCat) });
    marker.feature = feature;
    return marker;
}

// Calculate tooltip content for a given marker layer
function calculateTooltip(layer) {
    let feature = layer.feature;
    let eSym = feature.properties.symbol;
    let eNam = feature.properties.name;
    return eSym + " " + eNam;
}

// Calculate popup content for a given marker layer
function calculatePopup(layer) {
    // Get the information
    let feature = layer.feature;
    let eId  = feature.properties._id;
    let eLatLon = [feature.geometry.coordinates[1],feature.geometry.coordinates[0]];
    let eNam = feature.properties.name;
    let eTyp = feature.properties._type;
    let eCit = feature.properties.addr_city;
    let eCou = feature.properties.addr_country;
    let ePos = feature.properties.addr_postcode;
    let eStr = feature.properties.addr_street;
    let eCat = feature.properties.category;
    let eEma = feature.properties.contact_email;
    let ePho = feature.properties.contact_phone;
    let eWeb = feature.properties.contact_website;
    let eFac = feature.properties.contact_facebook;
    let eIns = feature.properties.contact_instagram;
    let eCui = feature.properties.cuisine;
    let eIco = feature.properties.icon;
    let eInf = feature.properties.more_info;
    let eOpe = feature.properties.opening_hours;
    let eSym = feature.properties.symbol;

    /*** Building the popup content ***/
    let popupContent = "<div class='mapPopupTitle'>" + eSym + " " + eNam; // Symbol and name

    // OSM link for popup
    let osmUrl = "https://openstreetmap.org/"+eTyp+"/"+eId;
    popupContent += "<a href='"+osmUrl+"' target='_blank' rel='noopener noreferrer'> *</a></div><hr/>"; // OSM link

    // Adding cuisine information to popup
    if(eCui!=undefined){popupContent += "<div class='popupflex-container'><div>👩‍🍳</div><div>" + eCui.replaceAll(";", ", ").replaceAll("_", " ") +"</div></div>"}

    // Address
    let eAddr = ""
    // Collecting address information
    if(eStr!=undefined){eAddr += eStr +"<br/>"}  // Street
    if(ePos!=undefined){eAddr += ePos +" "}      // Postcode
    if(eCit!=undefined){eAddr += eCit +" "}      // City
    //if(eCou!=undefined){eAddr += "<br/>" + eCou} // Country

    // Adding address information to popup
    if(eAddr!=""){popupContent += "<div class='popupflex-container'><div>📍</div><div>" + eAddr +"</div></div>"}

    // Adding opening hours to popup
    if(eOpe!=undefined){
      // Country: Germany
      let country_code = 'de';
      // State: Sachsen-Anhalt
      let state = 'st';
      // Get browser language for the warnings and the prettifier
	  
	  
	  
	  
      //let locale = navigator.language.split('-')[0];
	  //let locale = getUserLanguage();
	  
	  let locale = userLanguage; // userLanguage is defined in i18n.js
	  
      //Create opening_hours object
	  let oh = new opening_hours(eOpe, {
          'lat':eLatLon[0],'lon':[0], 'address': {'country_code':country_code, 'state':state}},
          {'locale':locale});
      let prettified_value = oh.prettifyValue({conf: {'locale':locale, 'rule_sep_string': '<br />', 'print_semicolon': false, 'sep_one_day_between': ', '}});
      prettified_value = prettified_value.replaceAll(',', ', ').replaceAll('PH', i18next.t('words.public_holiday'));
      // Find out the open state
      let open_state = '';
      let open_state_emoji = '';
      if(oh.getState()){
        open_state = i18next.t('words.open');
        open_state_emoji = 'open';
        if(!oh.getFutureState()){
          open_state += i18next.t('texts.will close soon');
          open_state_emoji = 'closes_soon';
        }
      } else {
        open_state = i18next.t('words.closed');
        open_state_emoji = 'closed';
        if(oh.getFutureState()){
          open_state += i18next.t('texts.will open soon');
          open_state_emoji = 'opens_soon';
        }
      }
      // Append opening hours to the popup
      popupContent += "<div class='popupflex-container'><div>🕖</div><div><span class='open_state_circle " + open_state_emoji + "'></span>" + open_state + "<br />" + prettified_value + "</div></div>";
    }

    // Adding addidtional information to popup
    if(ePho!=undefined){popupContent += "<div class='popupflex-container'><div>☎️</div><div><a href='tel:" + ePho + "' target='_blank' rel='noopener noreferrer'>" + ePho + "</a></div></div>"}
    if(eEma!=undefined){popupContent += "<div class='popupflex-container'><div>📧</div><div><a href='mailto:" + eEma + "' target='_blank' rel='noopener noreferrer'>" + eEma + "</a></div></div>"}
    if(eWeb!=undefined){popupContent += "<div class='popupflex-container'><div>🌐</div><div><a href='" + eWeb + "' target='_blank' rel='noopener noreferrer'>" + eWeb.replace("https://", "") + "</a></div></div>"}
    if(eFac!=undefined){popupContent += "<div class='popupflex-container'><div>🇫</div><div><a href='" + eFac + "' target='_blank' rel='noopener noreferrer'>" + decodeURI(eFac).replace("https://", "") + "</a></div></div>"}
    if(eIns!=undefined){popupContent += "<div class='popupflex-container'><div>📸</div><div><a href='" + eIns + "' target='_blank' rel='noopener noreferrer'>" + eIns.replace("https://", "") + "</a></div></div>"}
    if(eInf!=undefined){popupContent += "<hr/><div class='popupflex-container'><div>ℹ️</div><div><a href=\"https://www.vegan-in-halle.de/wp/leben/vegane-stadtkarte/#"+eTyp+eId+"\" target=\"_top\">" + i18next.t('texts.more_info') + "</a></div>"}

    return popupContent;
}


// Adding function for opening_hours objects to check if place will be open after n minutes (60 minutes as default)
if (!opening_hours.prototype.getFutureState) {
  opening_hours.prototype.getFutureState = function(minutes = 60) {
    let nowPlusHours = new Date();
    nowPlusHours.setUTCMinutes(nowPlusHours.getUTCMinutes()+minutes);
    return this.getState(nowPlusHours);
  };
}


// Check if the data entries are complete
function checkData(parentGroup) {
    parentGroup.eachLayer(function(layer){
      // Collect properties
      let eNam = layer.feature.properties.name;
      let eId  = layer.feature.properties._id;
      let eTyp = layer.feature.properties._type;
      let osmUrl = "https://openstreetmap.org/"+eTyp+"/"+eId;
      let eOpe = layer.feature.properties.opening_hours;
      let eCit = layer.feature.properties.addr_city;
      let ePos = layer.feature.properties.addr_postcode;
      let eStr = layer.feature.properties.addr_street;

      // Check address data
      if (eCit == undefined || ePos == undefined || eStr == undefined) {
        console.log("-W- " + eNam + ": Address information incomplete. - " + osmUrl);
      }

      // Check opening hours
      if (eOpe == undefined) {
        console.log("-W- " + eNam + ": Without opening hours. - " + osmUrl);
      }


      //TODO: Check if cuisine if filled

    });
};


// Main function
veggiemap();
