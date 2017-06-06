# OmdbSearchWidget

> A widget displaying results found on omdbapi.com.


## Content

* [Appearance](#appearance)
* [Usage](#usage)
* [References](#references)


## Appearance

![The OmdbSearchWidget displaying a search result](docs/omdb-search-widget.png)


## Usage

### Installation

For installation instruction take a look at the [LaxarJS documentation](https://github.com/LaxarJS/laxar/blob/master/docs/manuals/installing_widgets.md).


### Configuration example

```json
{
   "widget": "finder-demo/omdb-search-widget",
   "features": {
      "search": {
         "resource": "searchString"
      }
   }
}
```
Use this configuration on a page to get a OmdbSearchWidget instance.
The `searchString` resource is expected to provide searches for movies.


## References

The following resources are useful or necessary for the understanding of this document.
The links refer to the latest version of the documentation.
Refer to the bower.json for the specific version that is normative for this document.

* [LaxarJS Concepts]
* [LaxarJS Patterns]

[LaxarJS Concepts]: https://github.com/LaxarJS/laxar/blob/master/docs/concepts.md "LaxarJS Concepts"
[LaxarJS Patterns]: https://github.com/LaxarJS/laxar_patterns/blob/master/docs/index.md "LaxarJS Patterns"

...
