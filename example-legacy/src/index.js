import './app.ts';
import './test-cmp1.ts';
import '@dwc/dev-tools';

const main = document.querySelector('main');


const button= document.createElement("button");

button.innerText="Add component";
button.addEventListener("click",()=>{
    main.appendChild(document.createElement('my-app'));
});

main.appendChild(button);


main.appendChild(document.createElement('test-cmp'));