# LaxarJS FinderDemo

The *FinderDemo* is a fresh version of Web 2.0 mashups, using *LaxarJS* builtin technologies for loosely coupled components, easily interconnected via *event bus*.
It is a web application combining several publicly available, searchable APIs in one view, each API represented by a dedicated widget.
A search term entered by the user is distributed to all widgets via the event bus and each receiver then queries its specific web service for a set of results.
If something was found, the first result is displayed, while possible further results are available via a select box.


The demo consists of a small set of LaxarJS widgets implemented in AngularJS.

* [Show the live demo](http://laxarjs.github.io/finder-demo/)
* [LaxarJS Homepage](http://laxarjs.org)
* [LaxarJS on GitHub](https://github.com/LaxarJS/laxar)


## Running the FinderDemo

To fetch the required tools and libraries, make sure that you have `npm` (comes with NodeJS) installed on your machine.

Use a shell to issue the following commands:

```sh
git clone --recursive https://github.com/LaxarJS/finder-demo.git
cd finder-demo
npm install
npm start
```

Afterwards, open the demo at [http://localhost:8002/debug.html](http://localhost:8002/debug.html).


## Next Steps

For an optimized version more suitable for production, stop the server (using `Ctrl-C`) and run:

```sh
npm run-script dist
npm start
```

Now you can browse the optimized demo at [http://localhost:8002/index.html](http://localhost:8002/index.html).
Instead of using `npm start`, you can use any web server on your machine by having it serve the `finder-demo` directory.

Try modifying the widgets under `includes/widgets/finder-demo` or add new widgets for different APIs, to get a feel for how a LaxarJS application works.
