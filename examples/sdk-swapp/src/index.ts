import './root';

const outlet = document.getElementById('app');

if (outlet) {
  const root = document.createElement('gc-root');
  outlet.appendChild(root);
}
