export function currentDate() {
  let today = new Date().toLocaleDateString().split('/');
  return `${today[2]}-${`0${today[0]}`.slice(-2)}-${`0${today[1]}`.slice(-2)}`;
}
