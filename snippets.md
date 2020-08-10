```

// 


function privateProxy(target: any) {
  // save a reference to the original constructor
  var original = target;
  
  // the new constructor behaviour
  var f: any = function (...args) {
    console.log('decorator constructor of ' + original.name);
    let newConstructor = Reflect.construct(original, args);
    return new Proxy(newConstructor, {
      get(target, name) {
        if (target[name]) {
          if (name.startsWith('_')) {
            throw new Error(`Private property ${name} cannot be accessed`);
          } else {
            return target[name];
          }
        }
      }
    });
  }
 
  // copy prototype so intanceof operator still works
  f.prototype = original.prototype;
 
  // return new constructor (will override original)
  return f;
}



@privateProxy
class Person { 
  private _firstName: string;
  private _lastName: string;

  constructor(firstName: string, lastName: string) { 
    this._firstName = firstName;
    this._lastName = lastName;
    console.log(`constructing ${this.name}`);
  }

  get name() {
    return this._firstName + ' ' + this._lastName;
  }

}

var p = new Person("John", "Doe");
console.log(p.name);
console.log(p._firstName);






// This is a cool proxy example:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy#Finding_an_array_item_object_by_its_property

```