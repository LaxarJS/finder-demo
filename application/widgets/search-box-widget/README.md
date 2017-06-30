# SearchBoxWidget

> Simple Box for entering search words.


## Content
* [Appearance](#appearance)
* [Usage](#usage)
* [References](#references)


## Appearance

![The SearchBoxWidget waiting for user input](docs/search-box-widget.png)


## Usage

### Installation

For installation instruction take a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_widgets.md).


### Configuration example

```json
{
   "widget": "finder-demo/search-box-widget",
   "features": {
      "search": {
         "resource": "searchString"
      }
   }
}
```
Use this configuration on a page to get a SearchBoxWidget instance.
Whenever the user starts a new search, the entered string is published under the topic `searchString`.


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"

...
