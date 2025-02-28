export function setIntervalX(
  callback: () => void,
  delay: number,
  repetitions: number
) {
  console.log('start');
  var x = 0;
  var intervalID = window.setInterval(function () {
    callback();
    console.log('sync');

    if (++x === repetitions) {
      window.clearInterval(intervalID);
      console.log('finished');
    }
  }, delay);
}
