//For each scprit there needs to be some process running as well as a terminal to envoke the commands. 
//While the application is running, go to a terminal window and run: frida process name. Example: frida experiment. 
//Once frida is connected to the desired process use the scripts provided below, either through copy/paste or editing them.



//function 'g' takes in an int and returns that same int

//Attaches to function 'g' and changes the argument to 0
Interceptor.attach(ptr(Module.getExportByName(null, "g")), { onEnter(args){args[0] = ptr("0");}});


//Attaches to funtion 'g' and changes the return value to 0
Interceptor.attach(ptr(Module.getExportByName(null, "g")), { onLeave(retval){retval.replace(0x00);}});


//Attaches to function 'g' and replaces the function with the new functionality to return n*2
Interceptor.replace(ptr(Module.getExportByName(null, "g")), new NativeCallback((n) => {return n*2;}, 'int', ['int']));


//Creates a native function of the function 'g' and stores it in test
const test = new NativeFunction(Module.getExportByName(null, "g"), 'int', ['int']);



//Attaches to the first thread and iterates through the prints the onRecieve funtion
Stalker.follow(Process.enumerateThreads()[0].id, {
  events: {
    call: true}, onReceive(events) {
    console.log(Stalker.parse(events, {
      annotate: true, // to display the type of event
      stringify: true
    }));
  },});


//Attaches to the thread of function 'g' and prints the onSummary function
Interceptor.attach(ptr(Module.getExportByName(null, "g")), 
{ onEnter(args)
	{Stalker.follow(this.threadId, 
		{ events:{call: true, ret: false, exec: false, block: false}, 
		onCallSummary: function(summary){console.log(JSON.stringify(summary, null))}})
	}, 
	onLeave(retval){Stalker.unfollow(this.threadId)}
});


//Attaches to the thread of function 'g' and iterates through all calls, printing them
Interceptor.attach(ptr(Module.getExportByName(null, "g")), 
{ onEnter(args)
{Stalker.follow(this.threadId, 
{ events:{call: true, ret: false, exec: false, block: false}, 
transform: function(iterator){
let instruction = iterator.next();
do{
console.log(instruction);
iterator.keep();
}while((instruction=iterator.next()) != null);}})}, onLeave(retval){Stalker.unfollow(this.threadId)}});


//Attaches to the thread of function 'g' and iterates through all calls made in the specific binary and prints them
//start of binary
var base = Module.findBaseAddress('experiment');
Interceptor.attach(ptr(Module.getExportByName(null, "g")),
{ onEnter(args)
{Stalker.follow(this.threadId,
{ events:{call: true, ret: false, exec: false, block: false},
transform: function(iterator){
let instruction = iterator.next();
do{
//checks if the call is within the range of the binary
if(instruction.address >= base && instruction.address <= base.add(Process.findModuleByName('experiment').size))
{
console.log([instruction.address , instruction]);
}
iterator.keep();
}while((instruction=iterator.next()) != null);}})}, onLeave(retval){Stalker.unfollow(this.threadId)}});



//prints each module loaded for the application
Process.enumerateModulesSync().forEach(function(f) {
        console.log(JSON.stringify(f, null, '  '));
    });


//prints each export of each module loaded for the application
Process.enumerateModulesSync()
    .forEach(function(f) {
        console.log(JSON.stringify(Module.enumerateExportsSync(f.name), null, '  '));
    });




//function 'foo' takes in a struct as its argument
//Attaches to function foo and adds a print for the int stored in the struct
const some_func_pointer = Module.getExportByName(null, 'foo');
const some_func = new NativeFunction(some_func_pointer, "void", ["int"]);
Interceptor.replace(some_func_pointer, new NativeCallback(function (size)
{
  console.log(size)
  some_func(size);
}, "void", ["int"]));



//function 'goo' takes in a pointer of a struct as its argument
//Attaches to function goo and changes the int stored in the struct to 2] 
const some_func_pointer = Module.getExportByName(null, 'goo');
const some_func = new NativeFunction(some_func_pointer, "void", ["pointer"]);
Interceptor.replace(some_func_pointer, new NativeCallback(function (pointer) {
  pointer.writeInt(23);
  console.log(pointer.readInt()) // size
  some_func(pointer);
}, "void", ["pointer"]));
