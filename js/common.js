function setCookie(cname, cvalue, exdays) {
  var d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  var expires = "expires="+d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function setCookie2(cookieName, cookieValue, exdays){
	
    var expireDate = document.cookie.indexOf(cookieName) === -1
            ? new Date(new Date().setTime(new Date().getTime()+ (exdays * 24 * 60 * 60 * 1000)))
            : unescape(document.cookie).split('expireDate=')[1]; // split out date to reuse
    document.cookie = cookieName + '=' + cookieValue + ',expireDate=' + expireDate + ';expires=' + expireDate;
}

function getCookie(cname) {
  var name = cname + "=";
  var ca = document.cookie.split(';');
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function eraseCookie(name) {   
    document.cookie = name+'=; Max-Age=-99999999;';  
}

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function getRandomElement(arr) {
	var rnd = getRndInteger(0,arr.length-1);
	return arr[rnd];	
}

function setLocalStorageObjectItem(key, value) {
  if (value === undefined) {
    localStorage.removeItem(key);
  } else {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function getLocalStorageObjectItem(key) {
  var json = localStorage.getItem(key);
  if (json === undefined) {
    return undefined;
  }
  return JSON.parse(json);
}
