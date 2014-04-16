var PUSH_CHARS = "0123456789abcdefghijklmnopqrstuvwxyz";
var NUM_PUSH_CHARS = PUSH_CHARS.length;
var lastPushTime = 0;
var lastRandChars = [];

export default function() {
  var now = new Date();
  var duplicateTime = now === lastPushTime;
  lastPushTime = now;
  var timeStampChars = new Array(8);

  for(var i = 7; i >= 0; i--) {
    timeStampChars[i] = PUSH_CHARS.charAt(now % NUM_PUSH_CHARS);
    now = Math.floor(now / NUM_PUSH_CHARS);
  }
  var id = timeStampChars.join("");
  
  if(!duplicateTime) {
    for(i = 0; i < 12; i++) {
      lastRandChars[i] = Math.floor(Math.random() * NUM_PUSH_CHARS);
    }
  } else {
    for(i = 11; i >= 0 && lastRandChars[i] === NUM_PUSH_CHARS - 1; i--) {
      lastRandChars[i] = 0;
    }
    lastRandChars[i]++;
  }
  for(i = 0; i < 12; i++) {
    id += PUSH_CHARS.charAt(lastRandChars[i]);
  }
  return id;
}
