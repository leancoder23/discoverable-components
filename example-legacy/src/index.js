import './app.ts';
import './test-cmp1.ts';
import '@dwc/dev-tools';

const main = document.querySelector('main');


const button= document.createElement("button");

button.innerText="Add component";
button.addEventListener("click",()=>{
    try{
        let appobj = document.createElement('my-app');
        main.appendChild(appobj);
       
    console.log('DS app instance',appobj);
    }catch(e){
        console.error('DS app instance error',e);
    }
   
    
});

main.appendChild(button);


main.appendChild(document.createElement('test-cmp'));