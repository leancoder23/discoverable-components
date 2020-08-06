import './dist/app.js';
import './dist/test-cmp1.js';
import './dist/dev-tools.js';

const main = document.querySelector('main');

const button= document.createElement("button");
button.innerText="Add component";
button.addEventListener("click",()=>{
    main.appendChild(document.createElement('my-app'));
});

main.appendChild(button);

main.appendChild(document.createElement('test-cmp'));

main.appendChild(document.createElement('dwc-dev-tools'));